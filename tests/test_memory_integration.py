"""Integration tests: memory API + service against the real Supabase project."""
import pytest

from backend.services import memory as m

pytestmark = pytest.mark.integration

PROTECTED = [
    ("GET", "/api/preferences"), ("PUT", "/api/preferences"), ("DELETE", "/api/preferences"),
    ("DELETE", "/api/preferences/pace"), ("GET", "/api/memory/context"),
    ("GET", "/api/conversations"), ("GET", "/api/conversations/00000000-0000-0000-0000-000000000000"),
    ("DELETE", "/api/conversations/00000000-0000-0000-0000-000000000000"),
]


@pytest.mark.parametrize("method, path", PROTECTED)
def test_memory_endpoints_require_login(client, method, path):
    assert client.open(path, method=method, json={}).status_code == 401


def test_preferences_persist_and_can_be_edited_and_deleted(client, make_user):
    u = make_user()
    r = client.get("/api/preferences", headers=u["headers"])
    assert r.status_code == 200 and r.json["preferences"] == {}

    prefs = {"interests": ["beaches", "cafes"], "activities": ["scuba diving"], "pace": "relaxed"}
    assert client.put("/api/preferences", headers=u["headers"], json={"preferences": prefs}).status_code == 200
    r = client.get("/api/preferences", headers=u["headers"])          # read back from the DB
    assert r.json["preferences"] == prefs and r.json["updated_at"]

    r = client.delete("/api/preferences/pace", headers=u["headers"])
    assert r.status_code == 200 and "pace" not in r.json["preferences"]
    assert "pace" not in client.get("/api/preferences", headers=u["headers"]).json["preferences"]

    assert client.delete("/api/preferences", headers=u["headers"]).status_code == 200
    assert client.get("/api/preferences", headers=u["headers"]).json["preferences"] == {}


def test_invalid_preferences_are_rejected_and_not_stored(client, make_user):
    u = make_user()
    r = client.put("/api/preferences", headers=u["headers"], json={"preferences": {"passport_number": "X1"}})
    assert r.status_code == 400 and "Unknown preference" in r.json["error"]
    assert client.put("/api/preferences", headers=u["headers"], json={"preferences": {"pace": "warp"}}).status_code == 400
    assert client.delete("/api/preferences/not_a_key", headers=u["headers"]).status_code == 400
    assert client.get("/api/preferences", headers=u["headers"]).json["preferences"] == {}


def test_merge_preferences_unions_lists_and_replaces_text(db, make_user):
    u = make_user()
    m.save_preferences(db, u["id"], {"interests": ["beaches"], "pace": "packed"})
    merged = m.merge_preferences(db, u["id"], {"interests": ["Beaches", "cafes"], "pace": "relaxed"})
    assert merged == {"interests": ["beaches", "cafes"], "pace": "relaxed"}
    assert m.get_preferences(db, u["id"])[0] == merged


def test_preferences_are_isolated_between_users(client, make_user):
    a, b = make_user("A"), make_user("B")
    client.put("/api/preferences", headers=a["headers"], json={"preferences": {"interests": ["museums"]}})
    assert client.get("/api/preferences", headers=b["headers"]).json["preferences"] == {}


def test_conversation_history_persists_and_is_private(client, db, make_user):
    a, b = make_user("A"), make_user("B")
    conv = m.create_conversation(db, a["id"], "Plan a 5-day trip to Bali under ₹60,000")
    m.add_message(db, conv["id"], "user", "Plan a 5-day trip to Bali under ₹60,000")
    m.add_message(db, conv["id"], "assistant", "Here's your Bali plan…", {"tools": [{"name": "weather", "status": "ok"}]})
    m.set_draft_itinerary(db, a["id"], conv["id"], {"destination": "Bali", "days": []})

    r = client.get("/api/conversations", headers=a["headers"])
    assert [c["id"] for c in r.json["conversations"]] == [conv["id"]]
    assert r.json["conversations"][0]["title"].startswith("Plan a 5-day trip to Bali")

    r = client.get(f"/api/conversations/{conv['id']}", headers=a["headers"])
    assert r.status_code == 200
    assert [x["role"] for x in r.json["messages"]] == ["user", "assistant"]
    assert r.json["messages"][1]["tool_metadata"]["tools"][0]["name"] == "weather"
    assert r.json["conversation"]["draft_itinerary"]["destination"] == "Bali"
    assert "user_id" not in r.json["conversation"]

    # B can neither list, read nor delete A's conversation
    assert client.get("/api/conversations", headers=b["headers"]).json["conversations"] == []
    assert client.get(f"/api/conversations/{conv['id']}", headers=b["headers"]).status_code == 404
    assert client.delete(f"/api/conversations/{conv['id']}", headers=b["headers"]).status_code == 404
    assert m.get_conversation(db, a["id"], conv["id"]) is not None

    assert client.get("/api/conversations/not-a-uuid", headers=a["headers"]).status_code == 404
    assert client.delete(f"/api/conversations/{conv['id']}", headers=a["headers"]).status_code == 200
    assert client.get(f"/api/conversations/{conv['id']}", headers=a["headers"]).status_code == 404
    assert db.table("conversation_messages").select("id").eq("conversation_id", conv["id"]).execute().data == []


def test_get_messages_returns_latest_in_order(db, make_user):
    u = make_user()
    conv = m.create_conversation(db, u["id"], "hi")
    for i in range(5):
        m.add_message(db, conv["id"], "user" if i % 2 == 0 else "assistant", f"msg {i}")
    assert [x["content"] for x in m.get_messages(db, conv["id"], limit=3)] == ["msg 2", "msg 3", "msg 4"]
    with pytest.raises(m.MemoryInputError):
        m.add_message(db, conv["id"], "system", "not allowed")


def test_context_comes_from_the_database(client, db, make_user):
    u = make_user("Asha Rao")
    db.table("users").update({"home_airport": "BLR"}).eq("id", u["id"]).execute()
    db.table("trips").insert({"user_email": u["email"], "destination": "Japan", "status": "upcoming",
                              "start_date": "2026-12-17", "days": 5}).execute()
    client.put("/api/preferences", headers=u["headers"], json={"preferences": {"interests": ["beaches", "cafes"]}})

    r = client.get("/api/memory/context", headers=u["headers"])
    assert r.status_code == 200
    ctx = r.json["context"]
    assert ctx["name"] == "Asha Rao" and ctx["home_airport"] == "BLR"
    assert ctx["preferences"]["interests"] == ["beaches", "cafes"]
    assert ctx["recent_trips"][0]["destination"] == "Japan"
    assert "Travel interests: beaches, cafes" in r.json["summary"]


def test_deleting_a_user_deletes_their_memory(db, make_user):
    u = make_user()
    m.save_preferences(db, u["id"], {"pace": "balanced"})
    conv = m.create_conversation(db, u["id"], "x")
    db.table("users").delete().eq("id", u["id"]).execute()
    assert db.table("user_preferences").select("user_id").eq("user_id", u["id"]).execute().data == []
    assert db.table("conversations").select("id").eq("id", conv["id"]).execute().data == []


def test_keepalive(client, db):
    r = client.get("/api/cron/keepalive")
    assert r.status_code == 200 and r.json["success"]
