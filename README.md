# seance-kit

Three add-ons for [Seance](https://github.com/zackham/seance) (a multi-pane terminal where Claude Code sessions run in "circles"), cleaned up so someone else can use them:

| Folder | What it is |
| --- | --- |
| `invoke/` | **Invoke**: phone chat for your Seance circles, with push notifications. Spec cards, a pull request chip, buttons for permission prompts, peek, stop, search, photos and files, reminders. |
| `afk/` | **AFK mode**: keeps a Mac awake with the lid closed and routes Claude to your phone while you are away. |
| `theme-sync/` | Makes Claude Code's colors follow the Seance theme. |
| `tune/` | A slider panel (`?tune`) for setting visual values by hand. Also shipped inside Invoke's client. |

Each folder has its own README. Start with `invoke/README.md`.

This repo is a private, one-way export of a working setup. It has no keys, no message history and no personal notes. Seance itself is not included.

## Requirements

- Seance with its `seance ctl` command, for Invoke. Seance's daemon is Linux; macOS is a thin client for a remote daemon (see Seance's README).
- Python 3.9+ and `bash`. `curl` for the optional crew hook.
- For the phone: https plus a login header. Tailscale does both (`tailscale serve`); anything that sets `Tailscale-User-Login` and strips it from outside requests also works.
- Optional: `gh` (PR chip), `claude` (summaries), a Mac (AFK, photo copies).

## What needs a Linux box, and what works on a Mac alone

Read from the code, not tried on every combination:

- **Invoke needs a working `seance ctl` on the machine it runs on.** That means the machine with the Seance daemon, which is Linux. On a Mac with only the thin client, `seance ctl` may or may not reach a remote daemon; that was not checked here. Without `seance` on PATH, Invoke starts but shows no circles.
- **Invoke itself is portable.** Python 3 plus two pip packages, no Linux-only calls. Service files are provided for systemd (Linux) and launchd (Mac).
- **Reaching it from the phone needs https and your login.** Tailscale's `serve` gives both on Linux and Mac. `LOCAL_MODE=1` skips that and serves a browser on the same machine only.
- **AFK is Mac only** where it matters: `pmset` (stay awake with the lid closed), `ioreg` (keyboard and trackpad idle time) and `launchd` (the 15-second watcher). The server side (marking AFK, texting you) runs on anything with bash.
- **Photo copies to a Mac, and "you're at the Mac" quiet mode** use ssh to a Mac and macOS `ioreg`. Off unless `MAC_SSH` is set.
- **Theme sync** needs a Seance that writes its theme id to a file. Stock Seance does not (as checked 2026-11-05); see `theme-sync/README.md`.
- **Spec cards, the `choice:`/`image:`/`run:` buttons, reminders and the to-do list** only need Invoke and Seance.
- **The PR chip** needs `gh` logged in.

## Install

```
gh repo clone BHanley/seance-kit && cd seance-kit   # the repo is private for now: you need access
./install.sh all          # installs all three: invoke, afk and theme-sync (or name one: invoke, afk, theme)
$EDITOR ~/.config/seance-kit/config.env
invoke/seance-chat check
```

The installer writes files and prints the start commands; it only starts things with `--enable`. It never overwrites your config.

## Configure

One file for everything: `~/.config/seance-kit/config.env` (sample: `config/config.env.sample`). Keys can also be set as `SEANCE_KIT_<KEY>` in the environment. The two required ones for Invoke are `OWNER` (your Tailscale login) and `ORIGIN` (the https address you open on the phone). Everything else is optional and listed in the sample. Missing or sample-valued required settings print a plain message and the server will not start.

Locations: config and generated keys in `~/.config/seance-kit/`; state in `~/.local/share/seance-kit/`. Override with `SEANCE_KIT_CONFIG_DIR` and `SEANCE_KIT_DATA_DIR` (XDG variables are honored).

## More

- `docs/tune-panel.md`: the tune panel.
- `docs/left-out.md`: what the original setup had that is not in this kit, and why.
- `docs/testing.md`: what was tested and how.

## License

MIT, see `LICENSE`. Invoke builds on Seance, which is MIT and by zackham (https://github.com/zackham/seance).
