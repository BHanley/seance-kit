#!/usr/bin/env python3
"""SubagentStart/SubagentStop hook for Claude Code: tells Invoke a subagent started or stopped,
so it dances in its circle's crew. A no-op outside Seance (no SEANCE_WORKSPACE).
Fire and forget: a slow or missing Invoke never holds up Claude.

Needs the address of your Invoke: ORIGIN in ~/.config/seance-kit/config.env (the same file
Invoke reads), or the SEANCE_KIT_ORIGIN environment variable. With none set, it does nothing.
"""
import json
import os
import subprocess
import sys


def origin():
    if os.environ.get("SEANCE_KIT_ORIGIN"):
        return os.environ["SEANCE_KIT_ORIGIN"]
    conf = os.environ.get("SEANCE_KIT_CONFIG_DIR") or os.path.join(
        os.environ.get("XDG_CONFIG_HOME") or os.path.expanduser("~/.config"), "seance-kit")
    try:
        with open(os.path.join(conf, "config.env")) as f:
            for line in f:
                key, _, val = line.strip().partition("=")
                if key.strip() == "ORIGIN":
                    return val.strip().strip("\"'")
    except OSError:
        pass
    return ""


d = json.loads(sys.stdin.read() or "{}")
ws, agent, base = os.environ.get("SEANCE_WORKSPACE"), d.get("agent_id"), origin()
if ws and agent and base:
    body = {"ws": ws, "id": agent, "on": d.get("hook_event_name") == "SubagentStart"}
    subprocess.Popen(["curl", "-s", "-m", "4", "-o", "/dev/null", "-X", "POST", "-H", "Content-Type: application/json",
                      "-H", f"Origin: {base}", "-d", json.dumps(body), base.rstrip("/") + "/api/subagent"],
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
