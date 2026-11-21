"""Shared fixtures.

Unit tests need nothing. Integration tests (marked `integration`) talk to the
real Supabase project from .env, create throwaway users, and delete everything
they created afterwards. They are skipped if .env or the Voya 2.0 tables are missing.
"""
import os
import sys
import uuid

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from backend import app as voya  # noqa: E402


@pytest.fixture(autouse=True)
def no_photo_lookups(monkeypatch):
    """Tests never call Wikimedia (it throttles); photo tests opt back in explicitly."""
    monkeypatch.setattr(voya.photos_tool, "find_photo", lambda place: None)


@pytest.fixture
def client():
    voya.app.config["TESTING"] = True
    return voya.app.test_client()


def _db_ready():
    if not (voya.SUPABASE_URL and voya.SUPABASE_KEY and voya.APP_SECRET_KEY):
        return "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / APP_SECRET_KEY not set"
    try:
        voya.db().table("user_preferences").select("user_id").limit(1).execute()
        voya.db().table("conversation_messages").select("id").limit(1).execute()
    except Exception as e:  # table missing → migration not run
        return f"Voya 2.0 tables missing — run supabase/migrations/001_agent_memory.sql ({e})"
    return None


@pytest.fixture(scope="session")
def db():
    reason = _db_ready()
    if reason:
        pytest.skip(reason)
    return voya.db()


@pytest.fixture
def make_user(db):
    """Create throwaway users; returns a factory -> dict(id, email, headers)."""
    created = []

    def factory(name="Test User"):
        email = f"voya.pytest.{uuid.uuid4().hex[:10]}@example.com"
        row = db.table("users").insert({"email": email, "name": name, "full_name": name}).execute().data[0]
        created.append(email)
        token = voya.issue_token(email, name)
        return {"id": row["id"], "email": email, "headers": {"Authorization": f"Bearer {token}"}}

    yield factory
    for email in created:  # memory rows cascade from users; trips/searches are keyed by email
        db.table("trips").delete().eq("user_email", email).execute()
        db.table("searches").delete().eq("user_email", email).execute()
        db.table("users").delete().eq("email", email).execute()
