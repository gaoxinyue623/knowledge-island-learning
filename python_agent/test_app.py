from __future__ import annotations

import asyncio
import json
import tempfile
import unittest
from pathlib import Path

import httpx

from .app import create_app
from .config import Settings, load_local_environment, settings_from_env

HEADERS = {"Origin": "http://127.0.0.1:5173", "Host": "127.0.0.1:5173",
           "Content-Type": "application/json; charset=utf-8", "X-Knowledge-LLM": "1"}
BODY = {"request": {}, "recentSummaries": []}
BATCH = {"questions": [], "generator": {"provider": "MOCK"}, "validation": {"status": "VALID"}}
HEALTH = {"ok": True, "service": "learning-agent", "enabled": True, "configured": True,
          "provider": "OPENAI_COMPATIBLE", "model": "test-model", "secret": "SERVER_SECRET"}


def settings(**kwargs):
    return Settings("127.0.0.1", 8789, "http://127.0.0.1:8788", (HEADERS["Origin"],), **kwargs)


class ConfigurationTests(unittest.TestCase):
    def test_dotenv_precedence_quotes_and_process_override(self):
        with tempfile.TemporaryDirectory() as root:
            Path(root, ".env").write_text("VALUE=base\nAGENT_API_PORT=9000\n", encoding="utf-8")
            Path(root, ".env.local").write_text('VALUE="local # quoted"\n', encoding="utf-8")
            self.assertEqual(load_local_environment(root, {})["VALUE"], "local # quoted")
            Path(root, ".env.development").write_text("VALUE=development\n", encoding="utf-8")
            Path(root, ".env.development.local").write_text("VALUE=last\n", encoding="utf-8")
            self.assertEqual(load_local_environment(root, {})["VALUE"], "last")
            self.assertEqual(load_local_environment(root, {"VALUE": "process"})["VALUE"], "process")
            self.assertEqual(settings_from_env(root, {}).upstream_url, "http://127.0.0.1:9000")
            for env in [{"FASTAPI_AGENT_HOST": "0.0.0.0"}, {"FASTAPI_AGENT_PORT": "oops"},
                        {"AGENT_UPSTREAM_URL": "https://example.com"},
                        {"AGENT_UPSTREAM_URL": "http://127.0.0.1:8789"},
                        {"AGENT_UPSTREAM_URL": "http://user:secret@localhost:8788"},
                        {"AGENT_UPSTREAM_URL": "http://localhost:8788/path"},
                        {"AGENT_ALLOWED_ORIGINS": "http://user:secret@localhost:5173"},
                        {"VITE_LLM_API_KEY": "PRIVATE_VALUE"}]:
                with self.subTest(env=list(env)), self.assertRaises(ValueError) as error:
                    settings_from_env(root, env)
                self.assertNotIn("PRIVATE_VALUE", str(error.exception))
            self.assertFalse(settings_from_env(root, {"NODE_ENV": "production"}).enabled)
            self.assertFalse(settings_from_env(root, {"VITE_ENABLE_DEV_ROUTES": "false"}).enabled)


class FastAPIAgentTests(unittest.IsolatedAsyncioTestCase):
    async def request(self, app, method="POST", path="/api/agent/questions", client_host="127.0.0.1", **kwargs):
        transport = httpx.ASGITransport(app=app, client=(client_host, 1234))
        async with httpx.AsyncClient(transport=transport, base_url="http://127.0.0.1:8789") as client:
            return await client.request(method, path, **kwargs)

    def app(self, handler=None, **kwargs):
        return create_app(settings(**kwargs), upstream_transport=httpx.MockTransport(
            handler or (lambda _: httpx.Response(200, json=BATCH))))

    async def test_health_uses_upstream_state_and_projects_only_safe_metadata(self):
        app = self.app(lambda _: httpx.Response(200, json=HEALTH))
        response = await self.request(app, "GET", "/api/agent/health")
        self.assertEqual(response.json()["model"], "test-model")
        self.assertTrue(response.json()["upstreamAvailable"])
        self.assertNotIn("SERVER_SECRET", response.text)
        self.assertEqual(response.headers["cache-control"], "no-store")
        app = self.app(lambda _: httpx.Response(503, text="SECRET"))
        response = await self.request(app, "GET", "/api/agent/health")
        self.assertFalse(response.json()["configured"])
        self.assertFalse(response.json()["upstreamAvailable"])
        self.assertIsNone(response.json()["model"])

    async def test_origin_host_forwarded_header_and_socket_boundaries(self):
        calls = []
        app = self.app(lambda r: (calls.append(r), httpx.Response(200, json=BATCH))[1])
        attacks = [{"Origin": "https://evil.example"}, {"Origin": HEADERS["Origin"] + "/path"},
                   {"Host": "wrong", "X-Forwarded-Host": HEADERS["Host"]},
                   {"X-Knowledge-LLM": "0"}, {"Content-Type": "application/jsonp"}]
        for headers in attacks:
            response = await self.request(app, headers={**HEADERS, **headers}, json=BODY)
            self.assertEqual(response.status_code, 403)
        response = await self.request(app, headers={**HEADERS, "X-Forwarded-For": "127.0.0.1"},
                                      client_host="192.0.2.1", json=BODY)
        self.assertEqual(response.status_code, 403)
        self.assertFalse(calls)
        response = await self.request(app, "GET", "/api/unknown")
        self.assertEqual(response.json(), {"error": "AGENT_NOT_FOUND"})
        response = await self.request(app, "GET", "/docs")
        self.assertEqual(response.status_code, 404)
        response = await self.request(self.app(enabled=False), headers=HEADERS, json=BODY)
        self.assertEqual(response.status_code, 403)

    async def test_invalid_json_and_envelopes_never_reach_upstream(self):
        calls = []
        app = self.app(lambda r: calls.append(r))
        for body in [b'{', b'\xff', b'NaN', b'[]', b'{}',
                     json.dumps({**BODY, "apiKey": "PRIVATE_VALUE"}).encode()]:
            response = await self.request(app, headers=HEADERS, content=body)
            self.assertEqual(response.status_code, 400)
            self.assertNotIn("PRIVATE_VALUE", response.text)
        self.assertFalse(calls)

    async def test_chunked_body_limit_and_deadline_release_capacity(self):
        app = self.app(max_body_bytes=64, body_timeout_seconds=0.02, max_concurrent=1)

        async def oversized():
            yield b'a' * 40
            yield b'b' * 40
        response = await self.request(app, headers=HEADERS, content=oversized())
        self.assertEqual(response.status_code, 413)

        async def slow():
            yield b'{'
            await asyncio.sleep(1)
        response = await self.request(app, headers=HEADERS, content=slow())
        self.assertEqual(response.status_code, 408)
        response = await self.request(app, headers=HEADERS, json=BODY)
        self.assertEqual(response.status_code, 200)

    async def test_concurrency_rejects_excess_then_releases_slots(self):
        started, release = asyncio.Event(), asyncio.Event()
        async def upstream(_):
            started.set()
            await release.wait()
            return httpx.Response(200, json=BATCH)
        app = self.app(upstream, max_concurrent=1)
        pending = asyncio.create_task(self.request(app, headers=HEADERS, json=BODY))
        try:
            await asyncio.wait_for(started.wait(), 1)
            response = await self.request(app, headers=HEADERS, json=BODY)
            self.assertEqual(response.status_code, 429)
        finally:
            release.set()
            self.assertEqual((await pending).status_code, 200)
        self.assertEqual((await self.request(app, headers=HEADERS, json=BODY)).status_code, 200)

    async def test_upstream_timeout_failure_redirect_and_invalid_response_are_sanitized(self):
        responses = [(httpx.Response(400, json={"error": "PRIVATE_VALUE"}), 400),
                     (httpx.Response(500, text="PRIVATE_VALUE"), 502),
                     (httpx.Response(302, headers={"Location": "https://example.com"}), 502),
                     (httpx.Response(200, text="PRIVATE_VALUE"), 502),
                     (httpx.Response(200, json={"error": "PRIVATE_VALUE"}), 502)]
        for upstream, expected in responses:
            response = await self.request(self.app(lambda _: upstream), headers=HEADERS, json=BODY)
            self.assertEqual(response.status_code, expected)
            self.assertNotIn("PRIVATE_VALUE", response.text)
        async def slow(_):
            await asyncio.sleep(1)
        response = await self.request(self.app(slow, upstream_timeout_seconds=0.02), headers=HEADERS, json=BODY)
        self.assertEqual(response.status_code, 504)
        def disconnected(_):
            raise httpx.ConnectError("PRIVATE_VALUE")
        response = await self.request(self.app(disconnected), headers=HEADERS, json=BODY)
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("PRIVATE_VALUE", response.text)
        response = await self.request(self.app(max_response_bytes=10), headers=HEADERS, json=BODY)
        self.assertEqual(response.status_code, 502)

    async def test_real_http_forwarding_preserves_host_and_body_without_browser_credentials(self):
        received = {}
        async def upstream(reader, writer):
            head = await reader.readuntil(b"\r\n\r\n")
            received["headers"] = head.decode("latin1").lower()
            length = next(int(line.split(":", 1)[1]) for line in received["headers"].splitlines()
                          if line.startswith("content-length:"))
            received["body"] = json.loads(await reader.readexactly(length))
            payload = json.dumps(BATCH).encode()
            writer.write(b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: "
                         + str(len(payload)).encode() + b"\r\nConnection: close\r\n\r\n" + payload)
            await writer.drain()
            writer.close()
            await writer.wait_closed()
        server = await asyncio.start_server(upstream, "127.0.0.1", 0)
        port = server.sockets[0].getsockname()[1]
        try:
            app = create_app(Settings("127.0.0.1", 8789, f"http://127.0.0.1:{port}", (HEADERS["Origin"],)))
            response = await self.request(app, headers={**HEADERS, "Authorization": "PRIVATE_VALUE",
                                                       "Cookie": "PRIVATE_VALUE"}, json=BODY)
            self.assertEqual(response.json(), BATCH)
            self.assertEqual(received["body"], BODY)
            self.assertIn("host: 127.0.0.1:5173", received["headers"])
            self.assertNotIn("private_value", received["headers"])
        finally:
            server.close()
            await server.wait_closed()


if __name__ == "__main__":
    unittest.main()
