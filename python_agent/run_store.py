from __future__ import annotations

import os
import sqlite3
from contextlib import closing
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

# Only finite labels and numbers are persisted. In particular model names, raw
# provider messages, prompts, request IDs, question text and student IDs are absent.
STATUSES = {"READY", "FALLBACK", "REJECTED", "FAILED", "UNKNOWN"}
PROVIDERS = {"MOCK", "OPENAI_COMPATIBLE"}
FALLBACK_REASONS = {
    "CONFIG_ERROR", "AUTH_ERROR", "RATE_LIMIT", "TIMEOUT", "NETWORK_ERROR", "MODEL_ERROR",
    "INVALID_RESPONSE", "STRUCTURED_OUTPUT_ERROR", "SCHEMA_ERROR", "UNKNOWN",
    "GENERATION_ATTEMPTS_EXHAUSTED",
}
ERROR_CODES = {
    "AGENT_REQUEST_REJECTED", "AGENT_ACCESS_DENIED", "REQUEST_TOO_LARGE", "REQUEST_TIMEOUT",
    "AGENT_BUSY", "AGENT_UPSTREAM_INVALID", "AGENT_UPSTREAM_TIMEOUT", "AGENT_UPSTREAM_UNAVAILABLE",
}
APPLICATION_ID = 0x4B495241
SCHEMA_VERSION = 1


@dataclass(frozen=True)
class AgentRun:
    run_id: str
    created_at: str
    status: str
    provider: str | None
    fallback_used: bool | None
    fallback_reason: str | None
    question_count: int
    latency_ms: int
    error_code: str | None

    def __post_init__(self):
        if str(UUID(self.run_id)) != self.run_id or self.status not in STATUSES:
            raise ValueError("AGENT_RUN_INVALID")
        if self.provider is not None and self.provider not in PROVIDERS:
            raise ValueError("AGENT_RUN_INVALID")
        if self.fallback_reason is not None and self.fallback_reason not in FALLBACK_REASONS:
            raise ValueError("AGENT_RUN_INVALID")
        if self.error_code is not None and self.error_code not in ERROR_CODES:
            raise ValueError("AGENT_RUN_INVALID")
        if self.fallback_used is not None and type(self.fallback_used) is not bool:
            raise ValueError("AGENT_RUN_INVALID")
        if type(self.question_count) is not int or not 0 <= self.question_count <= 100:
            raise ValueError("AGENT_RUN_INVALID")
        if type(self.latency_ms) is not int or not 0 <= self.latency_ms <= 86400000:
            raise ValueError("AGENT_RUN_INVALID")
        if len(self.created_at) > 40 or datetime.fromisoformat(self.created_at).tzinfo is None:
            raise ValueError("AGENT_RUN_INVALID")


class RunStore:
    """Append-only local metadata; separate from student/family storage."""

    def __init__(self, path: str | Path, *, retention: int = 1000) -> None:
        if str(path) == ":memory:" or not str(path).strip() or not 1 <= retention <= 10000:
            raise ValueError("AGENT_RUN_DATABASE_INVALID")
        self.path = str(path)
        self.retention = retention
        Path(self.path).parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        # Exclusively create with private permissions; never change existing files.
        try:
            descriptor = os.open(self.path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        except FileExistsError:
            pass
        else:
            os.close(descriptor)
        with closing(self._connect()) as connection, connection:
            connection.execute("BEGIN IMMEDIATE")
            version = connection.execute("PRAGMA user_version").fetchone()[0]
            application = connection.execute("PRAGMA application_id").fetchone()[0]
            tables = connection.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
            if not tables and application == 0 and version == 0:
                connection.execute("""
                    CREATE TABLE agent_runs (
                      run_id TEXT PRIMARY KEY, created_at TEXT NOT NULL, status TEXT NOT NULL,
                      provider TEXT, fallback_used INTEGER CHECK (fallback_used IN (0, 1)),
                      fallback_reason TEXT, question_count INTEGER NOT NULL CHECK (question_count >= 0),
                      latency_ms INTEGER NOT NULL CHECK (latency_ms >= 0), error_code TEXT
                    )
                """)
                connection.execute("CREATE INDEX agent_runs_recent ON agent_runs(created_at DESC, run_id DESC)")
                connection.execute(f"PRAGMA application_id={APPLICATION_ID}")
                connection.execute(f"PRAGMA user_version={SCHEMA_VERSION}")
            elif application != APPLICATION_ID or version != SCHEMA_VERSION:
                raise ValueError("AGENT_RUN_DATABASE_VERSION_UNSUPPORTED")

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=0.2)
        connection.row_factory = sqlite3.Row
        return connection

    def record(self, run: AgentRun) -> None:
        with closing(self._connect()) as connection, connection:
            connection.execute("""
                INSERT INTO agent_runs
                (run_id, created_at, status, provider, fallback_used, fallback_reason,
                 question_count, latency_ms, error_code)
                VALUES (:run_id, :created_at, :status, :provider, :fallback_used, :fallback_reason,
                        :question_count, :latency_ms, :error_code)
            """, asdict(run))
            connection.execute("""
                DELETE FROM agent_runs WHERE run_id IN (
                    SELECT run_id FROM agent_runs ORDER BY created_at DESC, run_id DESC LIMIT -1 OFFSET ?
                )
            """, (self.retention,))

    @staticmethod
    def _decode(row) -> AgentRun:
        values = dict(row)
        if values["fallback_used"] is not None:
            values["fallback_used"] = bool(values["fallback_used"])
        return AgentRun(**values)

    def list_recent(self, limit: int = 20) -> list[AgentRun]:
        if type(limit) is not int or not 1 <= limit <= 100:
            raise ValueError("AGENT_RUN_LIMIT_INVALID")
        with closing(self._connect()) as connection:
            rows = connection.execute(
                "SELECT * FROM agent_runs ORDER BY created_at DESC, run_id DESC LIMIT ?", (limit,)
            ).fetchall()
        return [self._decode(row) for row in rows]

    def get(self, run_id: str) -> AgentRun | None:
        with closing(self._connect()) as connection:
            row = connection.execute("SELECT * FROM agent_runs WHERE run_id = ?", (run_id,)).fetchone()
        return self._decode(row) if row else None


def summarize_run(run_id: str, *, payload: dict | None, latency_ms: int, error_code: str | None) -> AgentRun:
    payload = payload or {}
    telemetry = payload.get("telemetry")
    telemetry = telemetry if isinstance(telemetry, dict) else {}
    generator = payload.get("generator")
    generator = generator if isinstance(generator, dict) else {}
    validation = payload.get("validation")
    validation = validation if isinstance(validation, dict) else {}
    status = telemetry.get("status")
    # A 200 response (or absence of telemetry) is not proof of generation success.
    if error_code == "AGENT_REQUEST_REJECTED":
        status = "REJECTED"
    elif error_code:
        status = "FAILED"
    elif validation.get("status") == "REJECTED":
        status = "REJECTED"
    elif not (isinstance(status, str) and status in {"READY", "FALLBACK", "REJECTED"}):
        status = "UNKNOWN"
    elif status in {"READY", "FALLBACK"} and validation.get("status") != "VALID":
        status = "UNKNOWN"
    provider = generator.get("provider")
    provider = provider if isinstance(provider, str) and provider in PROVIDERS else None
    reason = telemetry.get("fallbackReason")
    reason = (reason if isinstance(reason, str) and reason in FALLBACK_REASONS else "UNKNOWN") if reason is not None else None
    fallback = telemetry.get("fallbackUsed")
    fallback = fallback if type(fallback) is bool else None
    questions = payload.get("questions")
    return AgentRun(
        run_id, datetime.now(timezone.utc).isoformat(timespec="milliseconds"), status, provider,
        fallback, reason, min(len(questions), 100) if isinstance(questions, list) else 0,
        max(0, min(latency_ms, 86400000)), error_code,
    )
