#!/usr/bin/env python3
"""Claude Code UserPromptSubmit hook: while AFK mode is on, tell the session to reach you
through Invoke instead of waiting at the terminal.

AFK is "on" when <data dir>/afk/on holds a Unix time less than 12 hours old (afk writes it).
Prints one short note, which Claude Code adds to the prompt; prints nothing when AFK is off.

Wire it in ~/.claude/settings.json:
  "hooks": {"UserPromptSubmit": [{"hooks": [{"type": "command",
      "command": "python3 /path/to/seance-kit/afk/afk-prompt-hook.py"}]}]}
"""
import os
import time

data = os.environ.get("SEANCE_KIT_DATA_DIR") or os.path.join(
    os.environ.get("XDG_DATA_HOME") or os.path.expanduser("~/.local/share"), "seance-kit")
try:
    with open(os.path.join(data, "afk", "on")) as f:
        since = int(f.read().strip() or 0)
except (OSError, ValueError):
    raise SystemExit(0)
if time.time() - since > 12 * 3600:
    raise SystemExit(0)
print("AFK mode is on: the user is away from this computer and reading Invoke on their phone. "
      "If you need them (a question, a decision, a blocked command, a finished result), reach them there: "
      "add a pad note whose first line is only \U0001F4F1, then the message, with `seance ctl note --stdin`. "
      "Keep it short and plain. Do not wait at the terminal for an answer you can ask for there.")
