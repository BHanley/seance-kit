# Theme sync

Makes Claude Code's colors follow the theme Seance is using. `claude-theme gen` builds one Claude Code custom theme per Seance theme (`themes/seance-<id>.json`, ready-made copies are in `themes/`), and `claude-theme sync` points `settings.json` at the right one. A systemd path unit (Linux) or launchd agent (Mac) runs the sync when Seance changes its theme.

## Needs

- Claude Code (it reads custom themes from `~/.claude/themes/` and `"theme": "custom:<name>"` from `settings.json`).
- A Seance that writes its current theme id to a file, `{"scheme": "ouija"}`, by default `~/.local/share/seance/theme.json`. The twelve theme ids in `SCHEMES` (candlelit, abyssal, ectoplasm, ouija, monokai, tarot, mojave, riso, synth, fog, parlor, herbarium) come from a Seance build with named themes; stock Seance at https://github.com/zackham/seance had neither those themes nor that file when this kit was made (checked 2026-11-05, unverified for later versions). Without them, run `theme-sync/claude-theme sync ouija` by hand, or edit `SCHEMES` to match your own themes.
- Python 3.

## Install

```
./install.sh theme          # copies the themes, installs the watcher files
theme-sync/claude-theme check   # run from the repo folder, or put the file on your PATH. Says what is missing
```

Then start the watcher it prints (`systemctl --user enable --now claude-theme.path`, or the `launchctl bootstrap` line). Your `settings.json` needs an existing `"theme": "..."` line; the script changes only that line and tells you if it is missing.

## Configure (`~/.config/seance-kit/config.env`)

- `CLAUDE_DIR` Claude's folder, default `~/.claude`.
- `SAVED_THEME` the file Seance writes, default `~/.local/share/seance/theme.json`.
- `MAC_SSH`, `MAC_SSH_KEY`, `MAC_CLAUDE_THEME` optional: from a Linux machine, also sync a Mac over ssh (`MAC_CLAUDE_THEME` is the path of `claude-theme` on the Mac).

## Add a theme

Add a row to `SCHEMES` (id, light?, terminal background, terminal text, second accent as hex numbers), run `claude-theme gen`.
