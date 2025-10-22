#!/usr/bin/env bash
set -euo pipefail
# المتطلبات: وجود pnpm، وملفات pnpm-store.tgz و ms-playwright.tgz محليًا (نزّلها من تبويب Artifacts/Release).
ARTIFACTS_DIR="${1:-./vendor-artifacts}"
STORE_DIR="$(pnpm store path)"
mkdir -p "$STORE_DIR" ~/.cache/ms-playwright

if [[ ! -f "$ARTIFACTS_DIR/pnpm-store.tgz" ]]; then
  echo "[web-offline] missing pnpm-store.tgz in $ARTIFACTS_DIR" >&2
  exit 1
fi

if [[ ! -f "$ARTIFACTS_DIR/ms-playwright.tgz" ]]; then
  echo "[web-offline] missing ms-playwright.tgz in $ARTIFACTS_DIR" >&2
  exit 1
fi

tar -C "$STORE_DIR" -xzf "$ARTIFACTS_DIR/pnpm-store.tgz"
tar -C ~/.cache -xzf "$ARTIFACTS_DIR/ms-playwright.tgz"

PNPM_FILTER="--filter @agent-team/web"
pnpm $PNPM_FILTER install --offline
PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright pnpm web:build
PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright pnpm web:test
PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright pnpm web:e2e
