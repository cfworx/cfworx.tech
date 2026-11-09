#!/usr/bin/env bash
# Planedex: set up the 5-minute push on this PC. Run once, as yourself
# (not root):  bash scripts/planedex/install.sh
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
conf="$HOME/.config/planedex"
units="$HOME/.config/systemd/user"
token_drop="$HOME/Documents/adsb-logs/.planedex-token"

mkdir -p "$conf" "$units"
chmod 700 "$conf"

# The upload key: Claude left it in the log folder; move it somewhere private.
if [ ! -f "$conf/env" ]; then
  if [ ! -f "$token_drop" ]; then
    echo "No upload key at $token_drop (and no $conf/env yet). Ask Claude for a new key." >&2
    exit 1
  fi
  (umask 077; printf 'PLANEDEX_TOKEN=%s\n' "$(tr -d '[:space:]' < "$token_drop")" > "$conf/env")
  rm -f "$token_drop"
  echo "Upload key moved to $conf/env"
fi
chmod 600 "$conf/env"

sed "s|@SCRIPT@|$here/planedex_push.py|" "$here/planedex-push.service" > "$units/planedex-push.service"
cp "$here/planedex-push.timer" "$units/planedex-push.timer"
systemctl --user daemon-reload
systemctl --user enable --now planedex-push.timer

# Keep pushing while you're logged out (optional).
if ! loginctl show-user "$USER" -p Linger 2>/dev/null | grep -q '=yes'; then
  loginctl enable-linger "$USER" 2>/dev/null \
    || echo "Optional: run 'sudo loginctl enable-linger $USER' so pushes keep going while you're logged out."
fi

echo
echo "First push:"
python3 "$here/planedex_push.py" || echo "The first push didn't go through; the timer will retry every 5 minutes."
echo
systemctl --user list-timers planedex-push.timer --no-pager
