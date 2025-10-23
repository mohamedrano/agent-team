#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ARTIFACTS_ARG="${1:-}"

usage() {
  cat <<'USAGE'
Usage: web-offline.sh [vendor-artifacts-directory]

Expect the directory to contain:
  - pnpm-store.tgz
  - ms-playwright.tgz

If no directory is provided, the script looks for ./vendor-artifacts at the
repository root. Run `.github/workflows/deps-vendor.yml` on a machine with
internet access, download the artifacts, place them in the directory, then
invoke this script.
USAGE
}

log() {
  echo "[web-offline] $*"
}

abort() {
  echo "[web-offline] ERROR: $*" >&2
  exit 1
}

if [[ -z "${ARTIFACTS_ARG}" ]]; then
  ARTIFACTS_DIR="${REPO_ROOT}/vendor-artifacts"
else
  ARTIFACTS_DIR="${ARTIFACTS_ARG}"
fi

if [[ ! -d "${ARTIFACTS_DIR}" ]]; then
  usage >&2
  abort "Artifact directory '${ARTIFACTS_DIR}' does not exist."
fi

ARTIFACTS_DIR="$(cd "${ARTIFACTS_DIR}" && pwd)"

PNPM_ARCHIVE="${ARTIFACTS_DIR}/pnpm-store.tgz"
PLAYWRIGHT_ARCHIVE="${ARTIFACTS_DIR}/ms-playwright.tgz"

missing=()
if [[ ! -f "${PNPM_ARCHIVE}" ]]; then
  missing+=("pnpm-store.tgz")
fi
if [[ ! -f "${PLAYWRIGHT_ARCHIVE}" ]]; then
  missing+=("ms-playwright.tgz")
fi

if (( ${#missing[@]} > 0 )); then
  abort "Missing required artifact(s): ${missing[*]}"
fi

if ! command -v pnpm >/dev/null 2>&1; then
  abort "pnpm is not available on PATH. Run 'pnpm run bootstrap' in an online environment first."
fi

OFFLINE_ROOT="${REPO_ROOT}/.offline-cache"
PNPM_STORE_DIR="${OFFLINE_ROOT}/pnpm-store"
PLAYWRIGHT_CACHE_DIR="${OFFLINE_ROOT}/ms-playwright"

log "Hydrating PNPM store and Playwright cache..."
rm -rf "${PNPM_STORE_DIR}" "${PLAYWRIGHT_CACHE_DIR}"
mkdir -p "${PNPM_STORE_DIR}" "${PLAYWRIGHT_CACHE_DIR}"

tar -xzf "${PNPM_ARCHIVE}" -C "${PNPM_STORE_DIR}"
tar -xzf "${PLAYWRIGHT_ARCHIVE}" -C "${PLAYWRIGHT_CACHE_DIR}"

export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_CACHE_DIR}"
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

log "Running offline install..."
(cd "${REPO_ROOT}" && pnpm install --offline --frozen-lockfile --store-dir "${PNPM_STORE_DIR}")

log "Building web app..."
(cd "${REPO_ROOT}" && pnpm web:build)

log "Running unit tests..."
(cd "${REPO_ROOT}" && pnpm web:test)

log "Running e2e tests..."
(cd "${REPO_ROOT}" && pnpm web:e2e)

log "Done. Offline build and test completed successfully."
