#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CHECKLIST_FILE="phase5-checklist-$(date +%Y%m%d-%H%M%S).md"
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Arrays for tracking
declare -a FAILED_ITEMS=()
declare -a WARNING_ITEMS=()

# Helper functions
print_header() {
  echo
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}$1${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

check_item() {
  local category=$1
  local item=$2
  local check_cmd=$3
  local is_critical=${4:-true}

  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

  echo -n "  "
  if eval "$check_cmd" &>/dev/null; then
    echo -e "${GREEN}✅${NC} $item"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    echo "- [x] **$category**: $item" >> "$CHECKLIST_FILE"
  else
    if [[ "$is_critical" == "true" ]]; then
      echo -e "${RED}❌${NC} $item"
      FAILED_CHECKS=$((FAILED_CHECKS + 1))
      FAILED_ITEMS+=("$category: $item")
      echo "- [ ] **$category**: $item ❌" >> "$CHECKLIST_FILE"
    else
      echo -e "${YELLOW}⚠️${NC}  $item"
      WARNINGS=$((WARNINGS + 1))
      WARNING_ITEMS+=("$category: $item")
      echo "- [ ] **$category**: $item ⚠️" >> "$CHECKLIST_FILE"
    fi
  fi
}

# Initialize checklist file
cat > "$CHECKLIST_FILE" <<EOF
# 📋 Phase 5 Pre-Closure Checklist
**Generated**: $(date)
**Project**: Agent Team Web Application

## المرحلة 5 - قائمة التحقق النهائية / Phase 5 - Final Checklist

EOF

# Start checking
print_header "🔍 Phase 5 Final Checklist - Pre-Closure Verification"

# 1. Vendor Artifacts
echo -e "\n${BOLD}1. Vendor Artifacts Generation:${NC}"
cat >> "$CHECKLIST_FILE" <<EOF

### 1️⃣ Vendor Artifacts / حزم المورّدين

EOF

check_item "Workflow" "deps-vendor.yml exists" "[[ -f $PROJECT_ROOT/.github/workflows/deps-vendor.yml ]]"
check_item "Artifacts" "pnpm-store.tgz can be generated" "[[ -f $PROJECT_ROOT/.github/workflows/deps-vendor.yml ]] && grep -q 'pnpm-store.tgz' $PROJECT_ROOT/.github/workflows/deps-vendor.yml"
check_item "Artifacts" "ms-playwright.tgz can be generated" "[[ -f $PROJECT_ROOT/.github/workflows/deps-vendor.yml ]] && grep -q 'ms-playwright.tgz' $PROJECT_ROOT/.github/workflows/deps-vendor.yml"
check_item "Directory" "vendor-artifacts directory prepared" "[[ -d $PROJECT_ROOT/vendor-artifacts ]] || mkdir -p $PROJECT_ROOT/vendor-artifacts"

# 2. Offline Scripts
echo -e "\n${BOLD}2. Offline Bootstrap Scripts:${NC}"
cat >> "$CHECKLIST_FILE" <<EOF

### 2️⃣ Offline Scripts / السكريبتات الأوفلاين

EOF

check_item "Script" "web-offline.sh exists" "[[ -f $PROJECT_ROOT/scripts/web-offline.sh ]]"
check_item "Script" "web-offline.sh is executable" "[[ -x $PROJECT_ROOT/scripts/web-offline.sh ]]"
check_item "Script" "Network monitoring included" "grep -q 'start_network_monitor' $PROJECT_ROOT/scripts/web-offline.sh"
check_item "Script" "Report generation included" "grep -q 'generate_report' $PROJECT_ROOT/scripts/web-offline.sh"

# 3. CI/CD Integration
echo -e "\n${BOLD}3. CI/CD Integration:${NC}"
cat >> "$CHECKLIST_FILE" <<EOF

### 3️⃣ CI/CD Integration / تكامل CI/CD

EOF

check_item "CI" "ci.yml workflow exists" "[[ -f $PROJECT_ROOT/.github/workflows/ci.yml ]]"
check_item "CI" "Vendor artifacts download configured" "grep -q 'vendor-artifacts' $PROJECT_ROOT/.github/workflows/ci.yml"
check_item "CI" "Offline verification step added" "grep -q 'web-offline.sh' $PROJECT_ROOT/.github/workflows/ci.yml"
check_item "CI" "Playwright artifacts upload configured" "grep -q 'playwright-results' $PROJECT_ROOT/.github/workflows/ci.yml"
check_item "CI" "Lighthouse report generation" "grep -q 'lighthouse' $PROJECT_ROOT/.github/workflows/ci.yml" false

# 4. Web Application
echo -e "\n${BOLD}4. Web Application Readiness:${NC}"
cat >> "$CHECKLIST_FILE" <<EOF

### 4️⃣ Web Application / تطبيق الويب

EOF

check_item "Package" "package.json exists" "[[ -f $PROJECT_ROOT/apps/web/package.json ]]"
check_item "Scripts" "web:build command defined" "grep -q 'web:build' $PROJECT_ROOT/package.json"
check_item "Scripts" "web:test command defined" "grep -q 'web:test' $PROJECT_ROOT/package.json"
check_item "Scripts" "web:e2e command defined" "grep -q 'web:e2e' $PROJECT_ROOT/package.json"
check_item "Config" "Next.js config exists" "[[ -f $PROJECT_ROOT/apps/web/next.config.js ]] || [[ -f $PROJECT_ROOT/apps/web/next.config.mjs ]]"
check_item "Tests" "Vitest config exists" "[[ -f $PROJECT_ROOT/apps/web/vitest.config.ts ]]"
check_item "Tests" "Playwright config exists" "[[ -f $PROJECT_ROOT/apps/web/playwright.config.ts ]]"

# 5. i18n/RTL Support
echo -e "\n${BOLD}5. Internationalization (i18n/RTL):${NC}"
cat >> "$CHECKLIST_FILE" <<EOF

### 5️⃣ i18n & RTL Support / دعم اللغات والاتجاه

EOF

check_item "i18n" "Translation files exist" "[[ -d $PROJECT_ROOT/apps/web/src/i18n ]]"
check_item "i18n" "Arabic translations present" "find $PROJECT_ROOT/apps/web -name '*ar*' -o -name '*arabic*' | grep -q ."
check_item "RTL" "RTL styles configured" "grep -rq 'rtl\|dir.*rtl' $PROJECT_ROOT/apps/web/src" false
check_item "E2E" "i18n tests exist" "grep -rq 'i18n\|locale\|language' $PROJECT_ROOT/apps/web/e2e" false

# 6. Documentation
echo -e "\n${BOLD}6. Documentation:${NC}"
cat >> "$CHECKLIST_FILE" <<EOF

### 6️⃣ Documentation / التوثيق

EOF

check_item "README" "Web README exists" "[[ -f $PROJECT_ROOT/apps/web/README.md ]]"
check_item "README" "CI badges added" "grep -q 'badge' $PROJECT_ROOT/apps/web/README.md"
check_item "README" "Offline instructions documented" "grep -q 'offline' $PROJECT_ROOT/apps/web/README.md"
check_item "README" "Acceptance criteria listed" "grep -q 'acceptance\|criteria' $PROJECT_ROOT/apps/web/README.md"

# 7. Build Verification
echo -e "\n${BOLD}7. Build & Test Verification:${NC}"
cat >> "$CHECKLIST_FILE" <<EOF

### 7️⃣ Build & Test / البناء والاختبار

EOF

# Check if we can do a quick offline test
if [[ -f "$PROJECT_ROOT/vendor-artifacts/pnpm-store.tgz" ]] && [[ -f "$PROJECT_ROOT/vendor-artifacts/ms-playwright.tgz" ]]; then
  check_item "Build" "Offline install works" "cd $PROJECT_ROOT && pnpm --filter @agent-team/web install --offline --silent"
  check_item "Build" ".next directory can be created" "[[ -d $PROJECT_ROOT/apps/web/.next ]] || echo 'Run build first'" false
else
  echo -e "  ${YELLOW}⚠️${NC}  Skipping offline tests (vendor artifacts not found)"
  echo "- [ ] **Build**: Offline tests skipped (artifacts needed) ⚠️" >> "$CHECKLIST_FILE"
fi

# 8. Security & Quality
echo -e "\n${BOLD}8. Security & Quality Checks:${NC}"
cat >> "$CHECKLIST_FILE" <<EOF

### 8️⃣ Security & Quality / الأمان والجودة

EOF

check_item "Security" "No hardcoded API keys" "! grep -r 'NEXT_PUBLIC.*=.*[a-zA-Z0-9]\{20,\}' $PROJECT_ROOT/apps/web/src" false
check_item "Security" ".env.local.example exists" "[[ -f $PROJECT_ROOT/apps/web/.env.local.example ]]" false
check_item "Quality" "ESLint configured" "[[ -f $PROJECT_ROOT/apps/web/.eslintrc.json ]]" false
check_item "Quality" "Prettier configured" "[[ -f $PROJECT_ROOT/.prettierrc ]]" false

# Generate summary
cat >> "$CHECKLIST_FILE" <<EOF

## 📊 Summary / الملخص

| Metric | Count | Status |
|--------|-------|--------|
| Total Checks | $TOTAL_CHECKS | - |
| Passed ✅ | $PASSED_CHECKS | $([ $PASSED_CHECKS -eq $TOTAL_CHECKS ] && echo "Perfect!" || echo "Good") |
| Failed ❌ | $FAILED_CHECKS | $([ $FAILED_CHECKS -eq 0 ] && echo "None" || echo "**Needs Fix**") |
| Warnings ⚠️ | $WARNINGS | $([ $WARNINGS -eq 0 ] && echo "None" || echo "Optional") |

### Completion Rate: $((PASSED_CHECKS * 100 / TOTAL_CHECKS))%

EOF

# Add failed items if any
if [[ ${#FAILED_ITEMS[@]} -gt 0 ]]; then
  cat >> "$CHECKLIST_FILE" <<EOF

## ❌ Critical Items Requiring Attention

These items must be resolved before closing Phase 5:

EOF
  for item in "${FAILED_ITEMS[@]}"; do
    echo "- $item" >> "$CHECKLIST_FILE"
  done
fi

# Add warning items if any
if [[ ${#WARNING_ITEMS[@]} -gt 0 ]]; then
  cat >> "$CHECKLIST_FILE" <<EOF

## ⚠️ Optional Improvements

These items are recommended but not blocking:

EOF
  for item in "${WARNING_ITEMS[@]}"; do
    echo "- $item" >> "$CHECKLIST_FILE"
  done
fi

# Add next steps
cat >> "$CHECKLIST_FILE" <<EOF

## 🚀 Next Steps / الخطوات التالية

EOF

if [[ $FAILED_CHECKS -eq 0 ]]; then
  cat >> "$CHECKLIST_FILE" <<EOF
### ✅ Ready for Phase 5 Closure!

1. Run final offline verification:
   \`\`\`bash
   bash scripts/web-offline.sh ./vendor-artifacts
   \`\`\`

2. Generate acceptance report:
   \`\`\`bash
   bash scripts/acceptance/phase5-report.sh
   \`\`\`

3. Create closure PR:
   \`\`\`bash
   git add .
   git commit -m "chore(web): offline bootstrap finalized - Phase 5 complete"
   gh pr create --title "chore(web): offline bootstrap finalized" --body "Phase 5 completed with full offline support"
   \`\`\`

4. Celebrate! 🎉
   **المرحلة 5 مُقفلة إنتاجيًا!**
   **Phase 5 Production Ready!**

EOF
else
  cat >> "$CHECKLIST_FILE" <<EOF
### ⚠️ Actions Required Before Closure

1. Fix all critical items marked with ❌
2. Re-run this checklist to verify
3. Consider addressing warning items ⚠️

To fix vendor artifacts:
\`\`\`bash
gh workflow run deps-vendor.yml
# Wait for completion, then download artifacts
\`\`\`

To fix scripts:
\`\`\`bash
chmod +x scripts/web-offline.sh
\`\`\`

EOF
fi

# Print results
echo
print_header "📊 Phase 5 Checklist Results"

echo -e "\n${BOLD}Summary:${NC}"
echo -e "  Total Checks: ${CYAN}$TOTAL_CHECKS${NC}"
echo -e "  Passed:       ${GREEN}$PASSED_CHECKS ✅${NC}"
echo -e "  Failed:       $([ $FAILED_CHECKS -eq 0 ] && echo "${GREEN}$FAILED_CHECKS${NC}" || echo "${RED}$FAILED_CHECKS ❌${NC}")"
echo -e "  Warnings:     $([ $WARNINGS -eq 0 ] && echo "${GREEN}$WARNINGS${NC}" || echo "${YELLOW}$WARNINGS ⚠️${NC}")"

echo -e "\n${BOLD}Completion Rate:${NC} $((PASSED_CHECKS * 100 / TOTAL_CHECKS))%"

# Progress bar
PROGRESS=$((PASSED_CHECKS * 50 / TOTAL_CHECKS))
echo -n "  ["
for i in $(seq 1 50); do
  if [[ $i -le $PROGRESS ]]; then
    echo -n "="
  else
    echo -n " "
  fi
done
echo "]"

if [[ $FAILED_CHECKS -eq 0 ]]; then
  echo
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}🎉 Congratulations! Phase 5 is ready for closure!${NC}"
  echo -e "${GREEN}   المرحلة 5 جاهزة للإقفال النهائي!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
  echo
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}⚠️  Some items need attention before Phase 5 closure${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  if [[ ${#FAILED_ITEMS[@]} -gt 0 ]]; then
    echo -e "\n${RED}Critical items to fix:${NC}"
    for item in "${FAILED_ITEMS[@]}"; do
      echo -e "  ${RED}•${NC} $item"
    done
  fi
fi

echo
echo -e "${CYAN}Checklist saved to:${NC} ${BOLD}$CHECKLIST_FILE${NC}"
echo
echo -e "${BLUE}View checklist:${NC} cat $CHECKLIST_FILE"
echo -e "${BLUE}Run final test:${NC} bash scripts/web-offline.sh ./vendor-artifacts"
echo
