from __future__ import annotations

import asyncio
import json
import sqlite3
from dataclasses import asdict
from time import monotonic
from typing import Literal
from uuid import UUID, uuid4

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, ValidationError
from starlette.requests import ClientDisconnect

from .config import Settings, loopback_request_allowed, settings_from_env
from .run_store import RunStore, summarize_run


class RequestEnvelope(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    # The trusted Node core owns the complete domain schema and validation.
    request: dict
    recentSummaries: list[str] = Field(max_length=100)


class CoreHealth(BaseModel):
    model_config = ConfigDict(strict=True)
    ok: Literal[True]
    service: Literal["learning-agent"]
    enabled: bool
    configured: bool
    provider: Literal["MOCK", "OPENAI_COMPATIBLE"]
    model: str | None = Field(max_length=200)


class GatewayError(Exception):
    def __init__(self, status: int, code: str):
        self.status = status
        self.code = code


def reject(status: int, code: str) -> JSONResponse:
    return JSONResponse({"error": code}, status_code=status)


def parse_json(body: bytes):
    def invalid_constant(_: str):
        raise ValueError("INVALID_JSON_CONSTANT")
    return json.loads(body, parse_constant=invalid_constant)


async def read_body(request: Request, config: Settings) -> bytes:
    chunks = bytearray()
    async for chunk in request.stream():
        if len(chunks) + len(chunk) > config.max_body_bytes:
            raise GatewayError(413, "REQUEST_TOO_LARGE")
        chunks.extend(chunk)
    return bytes(chunks)


async def upstream_json(config: Settings, method: str, path: str, *, body=None, headers=None,
                        transport=None, timeout: float | None = None):
    deadline = config.upstream_timeout_seconds if timeout is None else timeout

    async def perform():
        # Do not inherit HTTP_PROXY credentials or proxy routing for loopback traffic.
        async with httpx.AsyncClient(timeout=deadline, follow_redirects=False,
                                     trust_env=False, transport=transport) as client:
            async with client.stream(method, config.upstream_url + path,
                                     content=body, headers=headers) as response:
                if response.status_code != 200:
                    return response.status_code, None
                data = bytearray()
                async for chunk in response.aiter_bytes():
                    if len(data) + len(chunk) > config.max_response_bytes:
                        raise GatewayError(502, "AGENT_UPSTREAM_INVALID")
                    data.extend(chunk)
                try:
                    return 200, parse_json(bytes(data))
                except (ValueError, RecursionError):
                    raise GatewayError(502, "AGENT_UPSTREAM_INVALID") from None
    try:
        return await asyncio.wait_for(perform(), timeout=deadline)
    except (asyncio.TimeoutError, httpx.TimeoutException):
        raise GatewayError(504, "AGENT_UPSTREAM_TIMEOUT") from None
    except httpx.HTTPError:
        raise GatewayError(503, "AGENT_UPSTREAM_UNAVAILABLE") from None


def create_app(settings: Settings | None = None, *, upstream_transport=None) -> FastAPI:
    config = settings or settings_from_env()
    active = 0
    try:
        runs = RunStore(config.run_database) if config.run_database and config.enabled else None
    except (OSError, sqlite3.Error, ValueError):
        raise RuntimeError('AGENT_RUN_STORE_UNAVAILABLE') from None
    persistence_status = 'enabled' if runs else 'disabled'
    # One local worker: a check/increment without awaits is atomic on its event loop.
    app = FastAPI(title="Knowledge Island Learning Agent", version="19.4",
                  docs_url=None, redoc_url=None, openapi_url=None)

    @app.middleware("http")
    async def response_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    @app.get("/api/agent/health")
    async def health():
        result = {"ok": True, "service": "learning-agent", "backend": "fastapi",
                  "enabled": config.enabled, "configured": False, "provider": None,
                  "model": None, "upstreamAvailable": False,
                  "runPersistence": persistence_status}
        try:
            status, payload = await upstream_json(config, "GET", "/api/agent/health",
                                                  transport=upstream_transport, timeout=2.0)
            if status == 200:
                core = CoreHealth.model_validate(payload)
                result.update(configured=core.configured, provider=core.provider, model=core.model,
                              enabled=config.enabled and core.enabled, upstreamAvailable=True)
        except (GatewayError, ValidationError):
            pass
        return result

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
    async def agent_routes(request: Request, path: str) -> JSONResponse:
        nonlocal active, persistence_status
        if path == 'api/agent/runs' or path.startswith('api/agent/runs/'):
            # Same-origin browser GET may omit Origin. Fetch Metadata plus the
            # preserved Host provide the equivalent boundary; never use forwarded headers.
            origin = request.headers.get('origin')
            if origin is None and request.headers.get('sec-fetch-site') == 'same-origin':
                origin = 'http://' + request.headers.get('host', '')
            if request.method != 'GET' or not config.enabled or not loopback_request_allowed(
                request.client.host if request.client else None, origin, request.headers.get('host'),
                config.origins, request.headers.get('x-knowledge-llm'), 'application/json',
            ):
                return reject(403, 'AGENT_ACCESS_DENIED')
            if runs is None:
                return reject(503, 'AGENT_RUN_PERSISTENCE_DISABLED')
            try:
                if path == 'api/agent/runs':
                    limit = request.query_params.get('limit', '20')
                    if not limit.isascii() or not limit.isdigit() or len(limit) > 3 or not 1 <= int(limit) <= 100:
                        return reject(400, 'AGENT_RUN_LIMIT_INVALID')
                    records = await asyncio.to_thread(runs.list_recent, int(limit))
                    persistence_status = 'enabled'
                    return JSONResponse({'runs': [asdict(record) for record in records]})
                run_id = path.removeprefix('api/agent/runs/')
                try:
                    if str(UUID(run_id)) != run_id:
                        return reject(404, 'AGENT_RUN_NOT_FOUND')
                except ValueError:
                    return reject(404, 'AGENT_RUN_NOT_FOUND')
                record = await asyncio.to_thread(runs.get, run_id)
                persistence_status = 'enabled'
                return JSONResponse(asdict(record)) if record else reject(404, 'AGENT_RUN_NOT_FOUND')
            except (OSError, sqlite3.Error, ValueError):
                persistence_status = 'unavailable'
                return reject(503, 'AGENT_RUN_STORE_UNAVAILABLE')
        if path != "api/agent/questions":
            return reject(404, "AGENT_NOT_FOUND")
        if request.method != "POST" or not config.enabled or not loopback_request_allowed(
            request.client.host if request.client else None,
            request.headers.get("origin"), request.headers.get("host"), config.origins,
            request.headers.get("x-knowledge-llm"), request.headers.get("content-type"),
        ):
            return reject(403, "AGENT_ACCESS_DENIED")
        length = request.headers.get("content-length")
        if length is not None:
            if not length.isascii() or not length.isdigit():
                return reject(400, "REQUEST_INVALID")
            if len(length) > 10 or int(length) > config.max_body_bytes:
                return reject(413, "REQUEST_TOO_LARGE")
        if active >= config.max_concurrent:
            return reject(429, "AGENT_BUSY")
        active += 1
        run_id = None
        started = monotonic()

        async def complete(response: JSONResponse, *, payload=None, error_code=None):
            nonlocal persistence_status
            if runs is not None and run_id is not None:
                try:
                    record = summarize_run(run_id, payload=payload,
                                           latency_ms=int((monotonic() - started) * 1000), error_code=error_code)
                    await asyncio.to_thread(runs.record, record)
                    response.headers['X-Agent-Run-Id'] = run_id
                    response.headers['X-Agent-Run-Persistence'] = 'saved'
                    persistence_status = 'enabled'
                except (OSError, sqlite3.Error, ValueError):
                    # Observability cannot turn a generated batch into a failure
                    # or cause the caller to retry a paid model request.
                    response.headers['X-Agent-Run-Persistence'] = 'failed'
                    persistence_status = 'unavailable'
            return response

        try:
            try:
                body = await asyncio.wait_for(read_body(request, config), config.body_timeout_seconds)
            except asyncio.TimeoutError:
                return reject(408, "REQUEST_TIMEOUT")
            except ClientDisconnect:
                return reject(400, "REQUEST_INVALID")
            try:
                RequestEnvelope.model_validate(parse_json(body))
            except (ValueError, RecursionError):
                return reject(400, "REQUEST_INVALID")
            # Record only admitted generation calls, using server-generated IDs.
            run_id = str(uuid4()) if runs else None
            started = monotonic()
            status, payload = await upstream_json(
                config, "POST", "/api/agent/questions", body=body,
                headers={"Content-Type": "application/json", "Origin": request.headers["origin"],
                         "X-Knowledge-LLM": "1", "Host": request.headers["host"]},
                transport=upstream_transport,
            )
            if status != 200:
                # Never echo an upstream exception, HTML error page or arbitrary JSON.
                errors = {400: "AGENT_REQUEST_REJECTED", 403: "AGENT_ACCESS_DENIED",
                          413: "REQUEST_TOO_LARGE", 408: "REQUEST_TIMEOUT", 429: "AGENT_BUSY"}
                code = errors.get(status, 'AGENT_UPSTREAM_INVALID')
                return await complete(reject(status if status in errors else 502, code), error_code=code)
            if (not isinstance(payload, dict) or not isinstance(payload.get("questions"), list)
                    or not isinstance(payload.get("generator"), dict)
                    or not isinstance(payload.get("validation"), dict)):
                return await complete(reject(502, "AGENT_UPSTREAM_INVALID"), error_code='AGENT_UPSTREAM_INVALID')
            return await complete(JSONResponse(payload), payload=payload)
        except GatewayError as error:
            return await complete(reject(error.status, error.code), error_code=error.code)
        finally:
            active -= 1

    return app
