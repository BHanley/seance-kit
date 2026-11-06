# AFK mode

`afk` keeps a Mac awake with its lid closed, marks AFK on the machines, and tells Claude sessions to reach you through Invoke. It ends itself when the Mac's keyboard or trackpad is used after a minute away, or when the battery drops under 15%.

Two roles, which can be the same machine:

- **the Mac** is kept awake (`pmset disablesleep`) and watched for your return;
- **the server** runs Invoke, so it can text you ("AFK on", "AFK off", battery).

## Needs

- A Mac. Staying awake with the lid closed and the return watcher use `pmset`, `ioreg` and `launchd`, so they are macOS only.
- `invoke/` for the texts and the AFK button (the texts are skipped if Invoke isn't reachable).
- If the server is a different machine: key based ssh both ways, no password prompt.
- A Claude Code hook (below) for the "reach me through Invoke" note.

## Install

1. Config, in `~/.config/seance-kit/config.env` on each machine that runs `afk`:
   - on the **Mac**: `SERVER_SSH=your-server` (an ssh host that reaches the machine running Invoke), or `SERVER_SSH=local` if Invoke runs on this Mac. `INVOKE_BIN=/path/on/the/server/to/seance-kit/invoke/seance-chat` if the server's checkout isn't where the Mac's is.
   - on the **server**: `MAC_SSH=you@your-mac` (and `MAC_SSH_KEY` if needed). Needed so the server's Invoke button and `afk` there can reach the Mac.
   - one machine only: `MAC_SSH=local` and `SERVER_SSH=local`.
   If one is missing, `afk on` says exactly which key to set.
2. On the Mac: `./install.sh afk`, then run the `launchctl bootstrap` line it prints. This runs `afk check` every 15 seconds.
3. On the Mac, once, allow your user to run exactly two commands without a password. Run `sudo visudo -f /etc/sudoers.d/afk` and put in (change `youruser`):

   ```
   youruser ALL=(root) NOPASSWD: /usr/bin/pmset -a disablesleep 0, /usr/bin/pmset -a disablesleep 1
   ```

   Without this, `afk` still marks AFK for Claude and says the Mac can't be kept awake.
4. Claude hook: in `~/.claude/settings.json` on each machine, add `afk/afk-prompt-hook.py` as a `UserPromptSubmit` hook (the command is `python3 /path/to/seance-kit/afk/afk-prompt-hook.py`). While AFK is on, it adds one note to each prompt telling Claude to reach you with a pad note through Invoke. This hook was written for the kit and is only tested as a script, not inside Claude Code.

## Use

```
afk            on
afk off        off
afk status     is it on here?
```

Sending `afk` or `afk off` as a message in any Invoke thread does the same, and Invoke's top bar has a button. The mark expires after 12 hours.

State: `~/.local/share/seance-kit/afk/` (`on`, `away`, `mac-awake`).
