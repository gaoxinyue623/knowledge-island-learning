from __future__ import annotations

import json
import sqlite3
import tempfile
import unittest
from dataclasses import asdict, replace
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

import httpx

from .app import create_app
from .config import Settings, settings_from_env
from .run_store import APPLICATION_ID, RunStore, summarize_run

HEADERS = {'Origin': 'http://127.0.0.1:5173', 'Host': '127.0.0.1:5173', 'X-Knowledge-LLM': '1'}
BATCH = {
    'questions': [{'stem': 'PRIVATE_QUESTION'}],
    'generator': {'provider': 'OPENAI_COMPATIBLE', 'model': 'PRIVATE_MODEL'},
    'validation': {'status': 'VALID'},
    'telemetry': {'status': 'FALLBACK', 'fallbackUsed': True, 'fallbackReason': 'CONFIG_ERROR',
                  'events': [{'data': 'PRIVATE_TRACE'}]},
}


def record(payload=None):
    return summarize_run(str(uuid4()), payload=BATCH if payload is None else payload, latency_ms=42, error_code=None)


class RunStoreTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name, 'runs.sqlite')

    def test_restart_read_order_retention_and_duplicate_protection(self):
        store = RunStore(self.path, retention=2)
        records = [replace(record(), created_at=f'2026-09-22T01:00:0{i}+00:00') for i in range(3)]
        for item in records:
            store.record(item)
        reopened = RunStore(self.path, retention=2)
        self.assertEqual(reopened.list_recent(), records[:0:-1])
        self.assertEqual(reopened.list_recent(1), [records[-1]])
        self.assertIsNone(reopened.get(records[0].run_id))
        self.assertEqual(reopened.get(records[-1].run_id), records[-1])
        with self.assertRaises(sqlite3.IntegrityError):
            store.record(replace(records[-1], question_count=50))
        self.assertEqual(store.get(records[-1].run_id).question_count, 1)
        self.assertEqual(self.path.stat().st_mode & 0o777, 0o600)

    def test_other_databases_and_future_versions_are_untouched(self):
        connection = sqlite3.connect(self.path)
        connection.execute('CREATE TABLE family (id INTEGER)')
        connection.execute('INSERT INTO family VALUES (7)')
        connection.commit()
        connection.close()
        with self.assertRaisesRegex(ValueError, 'VERSION_UNSUPPORTED'):
            RunStore(self.path)
        connection = sqlite3.connect(self.path)
        self.assertEqual(connection.execute('SELECT id FROM family').fetchone()[0], 7)
        self.assertEqual(connection.execute('PRAGMA user_version').fetchone()[0], 0)
        connection.close()
        other = Path(self.temp.name, 'future.sqlite')
        RunStore(other)
        connection = sqlite3.connect(other)
        self.assertEqual(connection.execute('PRAGMA application_id').fetchone()[0], APPLICATION_ID)
        connection.execute('PRAGMA user_version=2')
        connection.close()
        with self.assertRaisesRegex(ValueError, 'VERSION_UNSUPPORTED'):
            RunStore(other)
        connection = sqlite3.connect(other)
        self.assertEqual(connection.execute('PRAGMA user_version').fetchone()[0], 2)
        connection.close()

    def test_summary_has_only_finite_metadata_and_never_assumes_ready(self):
        private = {
            'questions': [{'stem': 'PRIVATE_QUESTION'}],
            'generator': {'provider': 'PRIVATE_PROVIDER', 'model': 'PRIVATE_MODEL'},
            'validation': {'status': 'VALID'},
            'telemetry': {'status': 'PRIVATE_STATUS', 'fallbackReason': 'PRIVATE_REASON',
                          'usage': ['PRIVATE_USAGE'], 'events': ['PRIVATE_TRACE']},
        }
        summary = record(private)
        self.assertEqual(summary.status, 'UNKNOWN')
        self.assertIsNone(summary.provider)
        self.assertIsNone(summary.fallback_used)
        self.assertEqual(summary.fallback_reason, 'UNKNOWN')
        store = RunStore(self.path)
        store.record(summary)
        self.assertNotIn('PRIVATE', json.dumps(asdict(store.get(summary.run_id))))
        self.assertNotIn(b'PRIVATE', self.path.read_bytes())
        self.assertEqual(record({'questions': [], 'generator': {}, 'validation': {}}).status, 'UNKNOWN')
        self.assertEqual(record({**BATCH, 'validation': {'status': 'REJECTED'}}).status, 'REJECTED')
        self.assertEqual(record({**BATCH, 'telemetry': {'status': ['invalid']}}).status, 'UNKNOWN')

    def test_persistence_opt_in_and_relative_database_resolution(self):
        self.assertIsNone(settings_from_env(self.temp.name, {}).run_database)
        env = {'FASTAPI_AGENT_RUN_PERSISTENCE': 'true'}
        self.assertEqual(settings_from_env(self.temp.name, env).run_database,
                         str(Path(self.temp.name, '.data/learning-agent.sqlite')))
        with self.assertRaises(ValueError):
            settings_from_env(self.temp.name, {'FASTAPI_AGENT_RUN_PERSISTENCE': 'typo'})
        with self.assertRaises(ValueError):
            settings_from_env(self.temp.name, {**env, 'FASTAPI_AGENT_RUN_DATABASE': ''})


class RunAPITests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = str(Path(self.temp.name, 'runs.sqlite'))

    def app(self, handler=None, **kwargs):
        config = Settings('127.0.0.1', 8789, 'http://127.0.0.1:8788', (HEADERS['Origin'],),
                          run_database=self.path, **kwargs)
        return create_app(config, upstream_transport=httpx.MockTransport(
            handler or (lambda _: httpx.Response(200, json=BATCH))))

    async def request(self, app, method='GET', path='/api/agent/runs', headers=None, client_host='127.0.0.1', **kwargs):
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app, client=(client_host, 1234)),
                                     base_url='http://127.0.0.1:5173') as client:
            return await client.request(method, path, headers=HEADERS if headers is None else headers, **kwargs)

    async def generate(self, app):
        return await self.request(app, 'POST', '/api/agent/questions',
                                  json={'request': {'profileId': 'PRIVATE_STUDENT'}, 'recentSummaries': []})

    async def test_persist_success_error_query_and_restart(self):
        app = self.app()
        generated = await self.generate(app)
        self.assertEqual(generated.json(), BATCH)
        self.assertEqual(generated.headers['x-agent-run-persistence'], 'saved')
        run_id = generated.headers['x-agent-run-id']
        # New application / repository, same file: reading does not call the Node core.
        reopened = self.app(lambda _: self.fail('history must not call upstream'))
        detail = await self.request(reopened, path='/api/agent/runs/' + run_id)
        self.assertEqual(detail.json()['status'], 'FALLBACK')
        self.assertTrue(detail.json()['fallback_used'])
        self.assertEqual(detail.json()['fallback_reason'], 'CONFIG_ERROR')
        self.assertNotIn('PRIVATE', detail.text)
        error_app = self.app(lambda _: httpx.Response(500, text='PRIVATE_ERROR'))
        failed = await self.generate(error_app)
        self.assertEqual(failed.status_code, 502)
        failed_detail = await self.request(reopened, path='/api/agent/runs/' + failed.headers['x-agent-run-id'])
        self.assertEqual(failed_detail.json()['status'], 'FAILED')
        self.assertEqual(failed_detail.json()['error_code'], 'AGENT_UPSTREAM_INVALID')
        response = await self.request(reopened)
        self.assertEqual(len(response.json()['runs']), 2)
        self.assertEqual(response.headers['cache-control'], 'no-store')
        self.assertNotIn(b'PRIVATE', Path(self.path).read_bytes())

    async def test_read_access_limit_not_found_and_disabled_routes(self):
        app = self.app()
        for headers in [{}, {**HEADERS, 'Origin': 'http://evil.example'},
                        {**HEADERS, 'Host': 'evil.example', 'X-Forwarded-Host': HEADERS['Host']},
                        {'X-Knowledge-LLM': '1', 'Sec-Fetch-Site': 'cross-site'}]:
            self.assertEqual((await self.request(app, headers=headers)).status_code, 403)
        self.assertEqual((await self.request(app, client_host='192.0.2.1')).status_code, 403)
        browser_headers = {'X-Knowledge-LLM': '1', 'Sec-Fetch-Site': 'same-origin'}
        self.assertEqual((await self.request(app, headers=browser_headers)).status_code, 200)
        for value in ['0', '101', '-1', 'nan', '1%20OR%201=1']:
            self.assertEqual((await self.request(app, path='/api/agent/runs?limit=' + value)).status_code, 400)
        self.assertEqual((await self.request(app, path='/api/agent/runs/' + str(uuid4()))).status_code, 404)
        self.assertEqual((await self.request(app, path='/api/agent/runs/not-a-uuid')).status_code, 404)
        self.assertEqual((await self.request(self.app(enabled=False))).status_code, 403)
        config = Settings('127.0.0.1', 8789, 'http://127.0.0.1:8788', (HEADERS['Origin'],))
        disabled = create_app(config, upstream_transport=httpx.MockTransport(lambda _: httpx.Response(200, json=BATCH)))
        self.assertEqual((await self.request(disabled)).json()['error'], 'AGENT_RUN_PERSISTENCE_DISABLED')
        self.assertNotIn('x-agent-run-id', (await self.generate(disabled)).headers)

    async def test_storage_failure_never_changes_generation_and_queries_are_sanitized(self):
        app = self.app()
        with patch.object(RunStore, 'record', side_effect=sqlite3.OperationalError('PRIVATE_PATH')):
            response = await self.generate(app)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), BATCH)
        self.assertEqual(response.headers['x-agent-run-persistence'], 'failed')
        self.assertNotIn('x-agent-run-id', response.headers)
        with patch.object(RunStore, 'list_recent', side_effect=sqlite3.OperationalError('PRIVATE_PATH')):
            response = await self.request(app)
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {'error': 'AGENT_RUN_STORE_UNAVAILABLE'})
        self.assertNotIn('PRIVATE_PATH', response.text)

    async def test_invalid_requests_do_not_create_records(self):
        app = self.app()
        response = await self.request(app, 'POST', '/api/agent/questions', json={})
        self.assertEqual(response.status_code, 400)
        self.assertEqual((await self.request(app)).json()['runs'], [])
