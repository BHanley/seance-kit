# What was tested

Run in a throwaway home folder, with no `seance` command on PATH unless a stub is named.

- Every Python file compiles (`python3 -m py_compile`) and `pyflakes` is clean. `bash -n` passes on `afk/afk` and `install.sh`. Plist files pass `plutil -lint`.
- `install.sh invoke` in a fresh home: made the venv, installed `cryptography` and `py-vapid`, wrote the config from the sample, rendered the launchd file.
- `seance-chat check` and `run` with no config print a plain list of what is missing (`OWNER`, `ORIGIN`) and exit 1. Sample values count as missing.
- With `LOCAL_MODE=1` on a spare port: the server started; `/` (HTML), `/manifest.json`, `/sw.js`, `/tune.js`, icons, `/api/vapid`, `/api/circles` and `/api/thread` answered 200 with empty state and one log line saying `seance` was not found. A wrong `Host`, a login header in local mode, and a POST with no `Origin` all got 403. `vapid.pem` and `alert-token` were created. `seance-chat alert` posted to the Alerts thread and said no phone had subscribed.
- With `OWNER` set: the matching `Tailscale-User-Login` got 200, another login and none got 403.
- With a stub `seance` that lists one circle: `/api/circles` style lookup found it; a `spec:` reply became a card with `Go` and `Change`; Go saved a `SPECS.md` entry in the mapped folder; `choice:` lines became buttons; the PR chip filing put a PR whose link was in the circle's folder under that circle and the other under Alerts (and everything under Alerts with no `CIRCLES_MAP`).
- `author:@me` in the GitHub search used by the PR chip works with `gh api graphql`.
- `claude-theme`: `install`, `gen` (matches the shipped files), `sync` and `check`, with clear errors for a missing theme, saved theme file, or `theme` line.
- `afk-prompt-hook.py`: prints nothing with no mark or an old mark, prints the note with a fresh one.

Not tested: real web push to a phone, `tailscale serve`, the real `seance ctl` (only a stub), the systemd units, `afk on`/`afk off` (they run `sudo pmset`, which this test did not touch), the launchd agents, the crew hook inside Claude Code, and the PR chip with a live `gh` call from inside the server.
