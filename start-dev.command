#!/bin/bash
# Double-click this file on your Mac: installs packages and starts the PalGo dev server.
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/share/pnpm:$PATH"
if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Install it with: npm install -g pnpm"; read -r -p "Press Enter to close"; exit 1
fi
pnpm install && pnpm start
