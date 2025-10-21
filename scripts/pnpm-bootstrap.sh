#!/usr/bin/env bash
set -euo pipefail

echo "[bootstrap] trying corepack..."
if command -v corepack >/dev/null 2>&1; then
  corepack enable || true
  corepack prepare pnpm@9.12.3 --activate || true
fi

ensure_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    if pnpm -v >/dev/null 2>&1; then
      return 0
    fi
  fi

  echo "[bootstrap] corepack unavailable or blocked. installing pnpm globally..."
  npm config set fund false
  npm config set audit false
  npm config set progress false

  if ! npm i -g pnpm@9.12.3 >/dev/null 2>&1; then
    echo "[bootstrap] switching npm registry to npmmirror due to network restrictions..."
    # بدائل ريجستري عند الحجب (اختر المتاح):
    npm config set registry https://registry.npmmirror.com
    if ! npm i -g pnpm@9.12.3; then
      echo "[bootstrap] failed to install pnpm via npm. please install pnpm@9.12.3 manually."
      exit 1
    fi
  fi
}

ensure_pnpm

pnpm -v
