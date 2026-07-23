"""MCP entry points for the Playwright Sockets app."""

from __future__ import annotations

from typing import Any


def open_playwright_sockets(
    start_url: str = "",
    recording_name_hint: str = "",
    recording_file: str = "",
    project_id: str = "",
    intent: str = "",
    paramValues: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Open Playwright Sockets for a new recording or an exact-file replay."""
    return {
        "status": "ui_required",
        "mode": "play_recording" if recording_file else "record",
        "start_url": start_url,
        "recording_name_hint": recording_name_hint,
        "recording_file": recording_file,
        "project_id": project_id,
        "intent": intent,
        "paramValues": paramValues or {},
    }
