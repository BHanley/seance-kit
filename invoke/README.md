# Invoke

Phone chat for Seance circles. A message in a circle's thread becomes a task for that circle's lead (the Claude pane Seance runs for it). The lead's answer comes back to the thread with a push notification. Also: buttons for a pane's permission prompts, peek at a pane, stop it, search, files and photos, reminders, a to-do list per lead, spec cards, a pull request chip, and a little creature "crew" that dances while a circle works.

Invoke is one Python script (`seance-chat`, standard library plus two packages for web push) and a plain web client (`web/`). It talks to Seance only through the `seance ctl` command.

## Needs

- **Seance** running on the same machine, with `seance` on PATH. https://github.com/zackham/seance (MIT). Seance's daemon runs on Linux; on macOS it is a thin client for a remote daemon (see Seance's README), so Invoke belongs on the machine that runs the daemon.
- **Python 3.9+**. `install.sh invoke` makes a venv and installs `requirements.txt` (`cryptography`, `py-vapid`).
- **A way to reach it from your phone over https**, with a login header. The easy way is Tailscale: `tailscale serve` gives https and adds `Tailscale-User-Login`. Any proxy that sets that header (and strips it from outside requests) works. Web push needs https.
- Optional: `gh` (for the PR chip), `claude` (for the "Catch me up" and end-of-day summaries), `afk/` (the AFK button), a Mac over ssh (photo copies, "you're at the Mac" quiet mode).

Without `seance` on PATH, Invoke still starts. It shows no circles and prints one clear line saying so.

## Install from nothing

```
gh repo clone BHanley/seance-kit && cd seance-kit   # the repo is private for now: you need access
./install.sh invoke            # venv, requirements, config file, service files
$EDITOR ~/.config/seance-kit/config.env     # set OWNER and ORIGIN (see below)
invoke/seance-chat check       # says what is still missing
```

Start it:

- Linux: `systemctl --user enable --now seance-chat seance-digest.timer`
- macOS: `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/dev.seance-kit.invoke.plist`
- Anywhere, by hand: `~/.local/share/seance-kit/venv/bin/python invoke/seance-chat run` (from the repo folder)

Then give it https, for example `tailscale serve --bg --https=8443 http://127.0.0.1:9667`. Open the `ORIGIN` address on your phone, install it to the home screen, and turn on notifications; a test notification is sent when you allow them. If you never get it, check that `ORIGIN` is the exact https address you opened.

`install.sh` never starts anything unless you pass `--enable`, and never overwrites your config.

## Configure

Everything is in `~/.config/seance-kit/config.env` (sample: `config/config.env.sample`). Any key can also be set as `SEANCE_KIT_<KEY>` in the environment.

| Key | What it is |
| --- | --- |
| `OWNER` | The Tailscale login allowed in. Required (unless `LOCAL_MODE`). |
| `ORIGIN` | The https address you open on your phone. Required (unless `LOCAL_MODE`). |
| `LOCAL_MODE=1` | Browser on the same machine only, no login. For trying it out. |
| `HOST`, `PORT` | Listen address, default `127.0.0.1:9667`. |
| `VAPID_SUBJECT` | Web push contact (`mailto:` or https). |
| `SEANCE_BIN`, `GH_BIN`, `CLAUDE_BIN` | Paths, if not on PATH under systemd or launchd. |
| `USAGE_FILE` | Optional JSON for the Claude plan usage strip. |
| `PR_AUTHOR`, `CIRCLES_MAP`, `PR_SHARED_CIRCLE` | PR chip and spec cards, below. |
| `MAC_SSH`, `MAC_SSH_KEY`, `MAC_FILES`, `MAC_PANE_TAG` | Optional Mac helper, below. |

Missing or sample-valued required settings give a plain message listing each one, and the server exits instead of running half set up.

Files: config and keys in `~/.config/seance-kit/` (`vapid.pem` and `alert-token` are made on first run, mode 600; delete `vapid.pem` to rotate, phones then re-subscribe). State (messages, read marks, push subscriptions, open tasks, photos) in `~/.local/share/seance-kit/`. Set `SEANCE_KIT_CONFIG_DIR` and `SEANCE_KIT_DATA_DIR` to move them. Nothing is sent anywhere except to your own phones' push services.

## What a lead can put in an answer

A lead replies with `seance ctl finish` (or a pad note whose first line is only the phone emoji). Invoke reads these lines in the reply:

- `image: /absolute/path.png` shows the picture (or an mp4/webm/mov) in the thread.
- `choice: <answer>` makes a tap button, up to 6, the first is the lead's pick. A tap comes back as your message.
- `run: <command>` makes a button that types that exact command into the lead's pane (a `!` shell command or a `/command`).
- `spec: <title>`: see below.

The instructions that tell the lead about these lines are in the `TASK` and `NOTE` texts at the top of `seance-chat`. Edit them to taste.

## Try it with curl

Replace OWNER with your config value. In `LOCAL_MODE` the port is the one in your config.

```
curl -H 'Tailscale-User-Login: OWNER' http://127.0.0.1:PORT/api/circles
curl -H 'Tailscale-User-Login: OWNER' 'http://127.0.0.1:PORT/api/thread?ws=alerts'
```

Every POST must also send an `Origin` header equal to your `ORIGIN` setting (in `LOCAL_MODE`, `http://127.0.0.1:PORT`). Browsers do this by themselves.

## Spec cards

Quick way to see a card without a lead: run `seance-chat alert $'spec: Rename the widget\nchanges: label\nstays: layout'` and open the Alerts thread. The command can print that no phone took the notification; the card was still posted.


Before a lead hands work to another pane, or does something wider than you literally asked, it can send a message with a line `spec: <title>` and 3 to 5 short lines under it (what changes, where, what stays, how you will see it). Invoke draws it as a card with the title on top and two buttons, **Go** and **Change**.

- **Go** sends "Go" back to the lead as your message.
- **Change** puts the cursor in the message box so you can say what to change in your own words; it sends nothing itself.
- The title stays as the first line of the message, so a client that doesn't draw cards still reads it.
- If `CIRCLES_MAP` names a project folder for the circle, Go also appends the spec to `SPECS.md` in that folder, newest first. Without `CIRCLES_MAP` nothing is saved.

The lead's `TASK` text already tells it to use this ("Exact asks skip it").

## The PR chip

A chip in the thread's title bar shows how many of your open pull requests belong to this circle, colored by check state (red failing, amber running, green passing). Tap it for a list with review state and links.

- Invoke runs `gh api graphql` every 10 minutes for `author:PR_AUTHOR` (default `@me`, whoever `gh` is logged in as). Run `gh auth login` once as the user the service runs as.
- `CIRCLES_MAP` decides which circle gets which PR: a tab-separated file `circle-slug<TAB>folder`, folders relative to the file. A PR belongs to a circle when its URL appears in a `.md` file in that circle's folder. `PR_SHARED_CIRCLE` names a catch-all circle that only keeps PRs no other circle claims.
- Without `CIRCLES_MAP`, every PR shows in the Alerts thread.
- A failed `gh` call keeps the last good list and logs one line.

## Optional Mac helper

If you run Claude panes on a Mac while Invoke runs on a Linux box, set `MAC_SSH=you@your-mac` (key login, no password prompt), `MAC_FILES=/Users/you/.cache/invoke`, and name Mac panes so their Seance pane name contains `MAC_PANE_TAG` (default `· Mac`). Then:

- a photo you send is copied to the Mac so a Mac pane can read it;
- `image:` lines from a Mac pane are fetched from the Mac;
- while the Mac saw keyboard or trackpad input in the last 3 minutes (and AFK is off) the phone stays quiet, because you are reading Seance there.

`MAC_SSH=local` is for Invoke running on the Mac itself. With `MAC_SSH` empty, all of this is off.

## The crew hook (optional)

`crew-subagent.py` tells Invoke when a Claude subagent starts or stops so it dances in its circle's crew. Add it to `~/.claude/settings.json` for both events:

```
"hooks": {
  "SubagentStart": [{"hooks": [{"type": "command", "command": "python3 /path/to/seance-kit/invoke/crew-subagent.py"}]}],
  "SubagentStop":  [{"hooks": [{"type": "command", "command": "python3 /path/to/seance-kit/invoke/crew-subagent.py"}]}]
}
```

It reads `ORIGIN` from the same config file and does nothing outside a Seance pane or with no `ORIGIN`. With `LOCAL_MODE`, set `SEANCE_KIT_ORIGIN=http://127.0.0.1:9667` in the environment.

## Tune sliders on the client

`web/tune.js` adds a slider panel when the page URL has `?tune`. See `../docs/tune-panel.md`.

## Commands

```
seance-chat run          the server
seance-chat check        check the config, exit 1 if something is missing
seance-chat alert TEXT   post TEXT to the Alerts thread and push it (local only, uses the alert token)
seance-chat digest       post the end-of-day summary (needs the `claude` command); the timer runs this at 18:00
```
