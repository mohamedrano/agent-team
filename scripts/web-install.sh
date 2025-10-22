#!/usr/bin/env bash
set -euo pipefail

try_install () {
  local REG="$1"
  echo "[web-install] trying registry: $REG"
  pnpm config set registry "$REG"
  npm  --prefix apps/web config set registry "$REG"
  # حاول التثبيت لحزمة الويب فقط
  bash scripts/pnpmw -F @agent-team/web install --frozen-lockfile && return 0
  return 1
}

# ترتيب المحاولة: npmjs → npmmirror → yarnpkg
try_install "https://registry.npmjs.org"        || \
try_install "https://registry.npmmirror.com"    || \
try_install "https://registry.yarnpkg.com"
