"""FastAPI -> actual Node generation -> validator, with no external model calls."""
import asyncio
import json
import shutil
import unittest
from pathlib import Path

import httpx

from .app import create_app
from .config import Settings


class NodeCoreIntegrationTests(unittest.IsolatedAsyncioTestCase):
    async def test_unconfigured_generation_is_blocked_and_domain_rejected_through_gateway(self):
        root = Path(__file__).resolve().parent.parent
        process = await asyncio.create_subprocess_exec(
            shutil.which("node") or "node", "node_modules/tsx/dist/cli.mjs", "--tsconfig",
            "tsconfig.app.json", "tests/fixtures/fastapiCore.ts", cwd=root,
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.DEVNULL,
        )
        try:
            fixture = json.loads(await asyncio.wait_for(process.stdout.readline(), 15))
            app = create_app(Settings("127.0.0.1", 8789, f"http://127.0.0.1:{fixture['port']}",
                                      ("http://127.0.0.1:5173",)))
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app, client=("127.0.0.1", 1234)),
                base_url="http://127.0.0.1:5173",
            ) as client:
                health = (await client.get("/api/agent/health")).json()
                self.assertTrue(health["upstreamAvailable"])
                self.assertEqual(health["provider"], "MOCK")
                headers = {"Origin": "http://127.0.0.1:5173", "X-Knowledge-LLM": "1"}
                result = await client.post("/api/agent/questions", headers=headers, json=fixture["input"])
                self.assertEqual(result.status_code, 200)
                batch = result.json()
                self.assertNotEqual(batch["validation"]["status"], "VALID")
                self.assertEqual(batch["questions"], [])
                self.assertFalse(batch["telemetry"]["fallbackUsed"])
                self.assertEqual(batch["telemetry"]["status"], "REJECTED")
                self.assertEqual(batch["telemetry"]["usage"][0]["errorType"], "CONFIG_ERROR")
                fixture["input"]["request"]["profileId"] = "REAL_STUDENT"
                rejected = await client.post("/api/agent/questions", headers=headers, json=fixture["input"])
                self.assertEqual(rejected.status_code, 400)
                self.assertEqual(rejected.json(), {"error": "AGENT_REQUEST_REJECTED"})
        finally:
            if process.returncode is None:
                process.terminate()
                try:
                    await asyncio.wait_for(process.wait(), 5)
                except asyncio.TimeoutError:
                    process.kill()
                    await process.wait()
