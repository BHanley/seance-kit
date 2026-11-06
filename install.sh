#!/usr/bin/env bash
# seance-kit installer. Safe to run twice; it never overwrites your config.
#
#   ./install.sh [invoke|afk|theme|all] [--enable]
#
#   invoke   Python venv + requirements, config file from the sample, a systemd user unit (Linux)
#            or launchd agent (Mac) for the Invoke server and the end-of-day digest timer (Linux)
#   afk      launchd agent that watches for you coming back (Mac). On Linux there is nothing to install.
#   theme    copies the Claude Code themes, and a systemd path unit (Linux) or launchd agent (Mac)
#            that re-syncs when Seance changes its theme
#   --enable also starts the services (default: install the files and tell you the command)
set -euo pipefail

KIT="$(cd "$(dirname "$0")" && pwd)"
CONF="${SEANCE_KIT_CONFIG_DIR:-${XDG_CONFIG_HOME:-$HOME/.config}/seance-kit}"
DATA="${SEANCE_KIT_DATA_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/seance-kit}"
OS=$(uname)
what=all; enable=0
for a in "$@"; do
  case "$a" in
    invoke|afk|theme|all) what=$a ;;
    --enable) enable=1 ;;
    *) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
  esac
done

say() { printf '%s\n' "$*"; }
die() { printf 'install.sh: %s\n' "$*" >&2; exit 1; }
render() {  # render TEMPLATE DEST: fill in the placeholders
  mkdir -p "$(dirname "$2")"
  sed -e "s|__KIT__|$KIT|g" -e "s|__HOME__|$HOME|g" -e "s|__AFK__|$KIT/afk/afk|g" -e "s|__LOG__|$HOME/Library/Logs/seance-kit-afk-watch.log|g" "$1" > "$2"
}
need_python() {
  command -v python3 >/dev/null || die "python3 is not installed. Install Python 3.9 or newer, then run this again."
  python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)' || die "Python 3.9 or newer is needed (found $(python3 -V))."
}

do_config() {
  mkdir -p "$CONF" "$DATA"
  if [ ! -f "$CONF/config.env" ]; then
    cp "$KIT/config/config.env.sample" "$CONF/config.env"
    chmod 600 "$CONF/config.env"
    say "Wrote $CONF/config.env from the sample. Edit it: OWNER and ORIGIN are required."
  else
    say "Kept your existing $CONF/config.env."
  fi
}

do_invoke() {
  need_python
  do_config
  if [ ! -x "$DATA/venv/bin/python" ]; then
    say "Creating the Python environment in $DATA/venv ..."
    python3 -m venv "$DATA/venv" || die "couldn't create a venv. On Debian or Ubuntu: sudo apt install python3-venv."
  fi
  "$DATA/venv/bin/pip" install -q --disable-pip-version-check -r "$KIT/invoke/requirements.txt" || die "pip install failed (see the message above)."
  chmod +x "$KIT/invoke/seance-chat"
  if [ "$OS" = Darwin ]; then
    render "$KIT/invoke/launchd/dev.seance-kit.invoke.plist" "$HOME/Library/LaunchAgents/dev.seance-kit.invoke.plist"
    say "Installed ~/Library/LaunchAgents/dev.seance-kit.invoke.plist"
    start="launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/dev.seance-kit.invoke.plist"
  else
    command -v systemctl >/dev/null || die "systemctl not found. Run the server yourself: $DATA/venv/bin/python $KIT/invoke/seance-chat run"
    for u in seance-chat.service seance-digest.service seance-digest.timer; do
      render "$KIT/invoke/systemd/$u" "$HOME/.config/systemd/user/$u"
    done
    systemctl --user daemon-reload
    say "Installed systemd user units in ~/.config/systemd/user/"
    start="systemctl --user enable --now seance-chat seance-digest.timer"
  fi
  if [ "$enable" = 1 ]; then
    "$KIT/invoke/seance-chat" check >/dev/null 2>&1 || die "config is not complete yet. Run: $KIT/invoke/seance-chat check"
    eval "$start"
  else
    say "Check the config:   $KIT/invoke/seance-chat check"
    say "Then start it:      $start"
  fi
  say "Seance app Chat view: set SEANCE_INVOKE_URL, or write the server URL to ~/.config/seance/invoke-url"
  say "Then put https in front of it, for example: tailscale serve --bg --https=8443 http://127.0.0.1:9667"
}

do_afk() {
  chmod +x "$KIT/afk/afk" "$KIT/afk/afk-prompt-hook.py"
  do_config
  if [ "$OS" = Darwin ]; then
    mkdir -p "$HOME/Library/Logs"
    render "$KIT/afk/dev.seance-kit.afk-watch.plist" "$HOME/Library/LaunchAgents/dev.seance-kit.afk-watch.plist"
    say "Installed ~/Library/LaunchAgents/dev.seance-kit.afk-watch.plist"
    start="launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/dev.seance-kit.afk-watch.plist"
    if [ "$enable" = 1 ]; then eval "$start"; else say "Start the watcher: $start"; fi
    say "One-time sudoers step (so afk can keep the Mac awake), see afk/README.md."
  else
    say "afk: nothing to install on Linux. Put $KIT/afk/afk on your PATH if you like, and set MAC_SSH in $CONF/config.env."
  fi
}

do_theme() {
  need_python
  do_config
  chmod +x "$KIT/theme-sync/claude-theme"
  "$KIT/theme-sync/claude-theme" install
  if [ "$OS" = Darwin ]; then
    mkdir -p "$HOME/Library/Logs"
    render "$KIT/theme-sync/launchd/dev.seance-kit.claude-theme.plist" "$HOME/Library/LaunchAgents/dev.seance-kit.claude-theme.plist"
    start="launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/dev.seance-kit.claude-theme.plist"
  else
    for u in claude-theme.path claude-theme.service; do render "$KIT/theme-sync/systemd/$u" "$HOME/.config/systemd/user/$u"; done
    systemctl --user daemon-reload 2>/dev/null || true
    start="systemctl --user enable --now claude-theme.path"
  fi
  if [ "$enable" = 1 ]; then eval "$start"; else say "Start the watcher: $start"; fi
}

case "$what" in
  invoke) do_invoke ;;
  afk) do_afk ;;
  theme) do_theme ;;
  all) do_invoke; do_afk; do_theme ;;
esac
