#!/usr/bin/env bash
set -euo pipefail
# المتطلبات: وجود pnpm، وملفات pnpm-store.tgz و ms-playwright.tgz محليًا (نزّلها من تبويب Artifacts/Release).
ARTIFACTS_DIR="${1:-./vendor-artifacts}"
STORE_DIR="$(pnpm store path)"
mkdir -p "$STORE_DIR" ~/.cache/ms-playwright

missing=()

[[ -f "$ARTIFACTS_DIR/pnpm-store.tgz" ]] || missing+=("pnpm-store.tgz")
[[ -f "$ARTIFACTS_DIR/ms-playwright.tgz" ]] || missing+=("ms-playwright.tgz")

if (( ${#missing[@]} > 0 )); then
  {
    printf '[web-offline] missing required artifact(s): %s\n' "${missing[*]}"
    cat <<'EOF'
[web-offline] Run the deps-vendor workflow on a machine with internet access:
  gh workflow run deps-vendor.yml
  # أو من واجهة GitHub Actions اختر deps-vendor → Run workflow
[web-offline] بعد اكتمال المهمة قم بتحميل الـ artifacts (pnpm-store.tgz و ms-playwright.tgz)
          وضعها في مجلد مثل ./vendor-artifacts ثم أعد تشغيل السكربت:
  mkdir -p ./vendor-artifacts
  mv ~/Downloads/pnpm-store.tgz ./vendor-artifacts/
  mv ~/Downloads/ms-playwright.tgz ./vendor-artifacts/
  bash scripts/web-offline.sh ./vendor-artifacts
[web-offline] داخل CI يمكن تنزيل الـ artifacts آليًا:
  - uses: actions/download-artifact@v4
    with:
      name: pnpm-store
      path: ./vendor-artifacts
  # كرر للـ ms-playwright
EOF
  } >&2
  exit 1
fi

tar -C "$STORE_DIR" -xzf "$ARTIFACTS_DIR/pnpm-store.tgz"
tar -C ~/.cache -xzf "$ARTIFACTS_DIR/ms-playwright.tgz"

PNPM_FILTER="--filter @agent-team/web"
pnpm $PNPM_FILTER install --offline
PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright pnpm web:build
PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright pnpm web:test
PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright pnpm web:e2e
