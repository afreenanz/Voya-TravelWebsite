"""Voya agent tools.

Each tool is a plain Python function with a structured result. Tools never
raise for external failures: they return {"status": "unavailable", "message": …}
so the agent can tell the user honestly instead of inventing data.
Status values: "ok" | "partial" | "unavailable" | "error" (bad input).
"""
