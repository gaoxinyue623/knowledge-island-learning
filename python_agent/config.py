from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Mapping
from urllib.parse import urlsplit

from dotenv import dotenv_values

LOOPBACK_HOSTS = {"localhost", "127.0.0.1", "::1"}
LOOPBACK_CLIENTS = {"127.0.0.1", "::1", "::ffff:127.0.0.1"}


def load_local_environment(
    root: str | Path = ".", environment: Mapping[str, str] | None = None
) -> dict[str, str]:
    """File precedence matches Node; process values win. Never mutate os.environ."""
    loaded: dict[str, str] = {}
    for name in (".env", ".env.local", ".env.development", ".env.development.local"):
        path = Path(root) / name
        if path.exists():
            loaded.update({k: v for k, v in dotenv_values(path, interpolate=False).items() if v is not None})
    loaded.update(os.environ if environment is None else environment)
    return loaded


def local_origin(value: str) -> bool:
    try:
        parsed = urlsplit(value)
        return (
            parsed.scheme == "http"
            and parsed.hostname in LOOPBACK_HOSTS
            and not parsed.username
            and not parsed.password
            and parsed.port != 0
            and value == f"{parsed.scheme}://{parsed.netloc}"
        )
    except ValueError:
        return False


@dataclass(frozen=True)
class Settings:
    host: str
    port: int
    upstream_url: str
    origins: tuple[str, ...]
    max_body_bytes: int = 64 * 1024
    max_concurrent: int = 2
    # Generation can include sequential chunks and repairs. Stay within the
    # existing browser deadline of 600 seconds, not one provider-call timeout.
    upstream_timeout_seconds: float = 590.0
    body_timeout_seconds: float = 10.0
    enabled: bool = True
    max_response_bytes: int = 2 * 1024 * 1024
    run_database: str | None = None

    def __post_init__(self) -> None:
        if self.host not in LOOPBACK_HOSTS:
            raise ValueError("FASTAPI_AGENT_HOST_MUST_BE_LOOPBACK")
        if not 1 <= self.port <= 65535:
            raise ValueError("FASTAPI_AGENT_PORT_INVALID")
        if not local_origin(self.upstream_url):
            raise ValueError("AGENT_UPSTREAM_MUST_BE_LOOPBACK")
        if (urlsplit(self.upstream_url).port or 80) == self.port:
            raise ValueError("AGENT_UPSTREAM_SELF_REFERENCE")
        if not self.origins or not all(local_origin(origin) for origin in self.origins):
            raise ValueError("AGENT_ORIGINS_MUST_BE_LOOPBACK")
        if min(self.max_body_bytes, self.max_concurrent, self.upstream_timeout_seconds,
               self.body_timeout_seconds, self.max_response_bytes) <= 0:
            raise ValueError("AGENT_LIMIT_INVALID")
        if self.run_database is not None and (not self.run_database.strip() or self.run_database == ':memory:'):
            raise ValueError("AGENT_RUN_DATABASE_INVALID")


def settings_from_env(root: str | Path = ".", environment: Mapping[str, str] | None = None) -> Settings:
    env = load_local_environment(root, environment)
    if env.get("VITE_LLM_API_KEY"):
        raise ValueError("VITE_LLM_API_KEY_IS_PUBLIC_USE_LLM_API_KEY")
    host = env.get("FASTAPI_AGENT_HOST", "127.0.0.1")
    try:
        port = int(env.get("FASTAPI_AGENT_PORT", "8789"))
    except ValueError:
        raise ValueError("FASTAPI_AGENT_PORT_INVALID") from None
    node_host = env.get("AGENT_API_HOST", "127.0.0.1")
    if node_host == "::1":
        node_host = "[::1]"
    upstream = env.get("AGENT_UPSTREAM_URL", f"http://{node_host}:{env.get('AGENT_API_PORT', '8788')}")
    origins = tuple(value.strip() for value in env.get(
        "AGENT_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",") if value.strip())
    enabled = env.get("NODE_ENV") != "production" and env.get("VITE_ENABLE_DEV_ROUTES") != "false"
    persistence = env.get("FASTAPI_AGENT_RUN_PERSISTENCE", "false")
    if persistence not in {"true", "false"}:
        raise ValueError("AGENT_RUN_PERSISTENCE_INVALID")
    raw_database = env.get("FASTAPI_AGENT_RUN_DATABASE", ".data/learning-agent.sqlite")
    if persistence == "true" and not raw_database.strip():
        raise ValueError("AGENT_RUN_DATABASE_INVALID")
    database = raw_database if persistence == "true" else None
    if database is not None:
        database = str(Path(root) / database)
    return Settings(host, port, upstream, origins, enabled=enabled, run_database=database)


def loopback_request_allowed(
    client_host: str | None, origin: str | None, host: str | None,
    allowed_origins: tuple[str, ...], header: str | None, content_type: str | None,
) -> bool:
    if client_host not in LOOPBACK_CLIENTS or header != "1":
        return False
    if not content_type or content_type.split(";", 1)[0].strip().lower() != "application/json":
        return False
    # Forwarded headers are intentionally ignored: Vite preserves the Host.
    return origin in allowed_origins and local_origin(origin) and urlsplit(origin).netloc == host
