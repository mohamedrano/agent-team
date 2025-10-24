# أمر توجيهي صارم وإلزامي - تغطية اختبارات شاملة لمشاريع TypeScript
## ⚠️ تحذير: هذا أمر إلزامي وغير قابل للتفاوض

هذا الأمر التوجيهي يفرض تغطية اختبارات شاملة على كل ملف قابل للاختبار في مشروع **Agent Team** بدون أي استثناءات. أي انتهاك لهذه القواعد سيؤدي لرفض الكود تلقائياً.

## 📋 المبادئ الأساسية غير القابلة للتفاوض

### 1. التغطية الشاملة الإلزامية
**قاعدة صارمة:** كل ملف TypeScript (`.ts`/`.tsx`) في المشروع يجب أن يحتوي على اختبارات شاملة.
- ❌ **لا استثناءات.** لا أعذار. لا ملفات بدون اختبارات.

**الملفات المستهدفة إلزامياً:**
- ✅ جميع الملفات في `packages/*/src/`
- ✅ جميع الملفات في `apps/*/src/`
- ✅ كل دالة، كلاس، هوك، مكون، خدمة، معالج
- ✅ كل فرع منطقي (if/else, switch, ternary)
- ✅ كل حالة خطأ محتملة
- ✅ كل حالة حدية (edge case)

### 2. الحدود الدنيا الإلزامية (لا تسامح)

#### الحدود العامة (Global Minimums)
| المقياس | الحد الأدنى | التعليق |
|---------|-------------|---------|
| **Lines** | ≥85% | تغطية الأسطر |
| **Functions** | ≥90% | تغطية الدوال |
| **Branches** | ≥85% | تغطية الفروع |
| **Statements** | ≥85% | تغطية العبارات |

#### حدود خاصة حسب الحزمة (Package-Specific)
| الحزمة | Lines | Functions | Branches | Statements |
|--------|-------|-----------|----------|------------|
| **@agent-team/ai** | ≥95% | ≥100% | ≥95% | ≥95% |
| **@agent-team/orchestration** | ≥95% | ≥100% | ≥95% | ≥95% |
| **@agent-team/communication** | ≥90% | ≥95% | ≥90% | ≥90% |
| **apps/server** | ≥85% | ≥90% | ≥85% | ≥85% |
| **المساعدات** | ≥95% | ≥95% | ≥95% | ≥95% |
| **النواة** | ≥95% | ≥100% | ≥95% | ≥95% |
| **الخدمات** | ≥90% | ≥95% | ≥90% | ≥90% |

## 🛠️ الإعداد الإلزامي

### 1. ملف Vitest Configuration الصارم
```typescript
// vitest.config.ts - إعداد Vitest الصارم
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      all: true,
      include: [
        "packages/*/src/**/*.{ts,tsx}",
        "apps/*/src/**/*.{ts,tsx}"
      ],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/*.d.ts",
        "**/index.ts", // Only if simple export-only files
        "**/types.ts", // Only if pure interfaces/types
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/__tests__/**",
        "**/__mocks__/**"
      ],
      // MANDATORY THRESHOLDS - NO EXCEPTIONS ALLOWED
      thresholds: {
        global: {
          branches: 85, functions: 90, lines: 85, statements: 85,
        },
        "packages/ai/src/**/*.{ts,tsx}": {
          branches: 95, functions: 100, lines: 95, statements: 95,
        },
        // ... باقي الحدود
      },
    },
  },
});
```

### 2. Package.json Scripts الإلزامية
```json
{
  "scripts": {
    "test": "vitest run --coverage",
    "test:ci": "vitest run --coverage --reporter=verbose --reporter=json",
    "test:coverage": "vitest run --coverage --reporter=verbose --reporter=json",
    "enforce:coverage": "tsx scripts/enforce-coverage.ts",
    "enforce:all-files-tested": "tsx scripts/find-untested-files.ts",
    "enforce:strict": "pnpm run test:coverage && pnpm run enforce:coverage && pnpm run enforce:all-files-tested",
    "pre-commit": "pnpm run typecheck && pnpm run lint && pnpm run enforce:strict",
    "pre-push": "pnpm run test:ci",
    "verify:all": "pnpm run typecheck && pnpm run lint && pnpm run test:ci && pnpm run enforce:coverage && pnpm run enforce:all-files-tested"
  }
}
```

## 🔒 سكريبتات الإنفاذ الإلزامية

### 1. سكريبت فحص التغطية الصارم
```typescript
// scripts/enforce-coverage.ts
// يتحقق من أن جميع الحدود مستوفاة - فشل فوري عند عدم الامتثال
```

### 2. سكريبت كشف الملفات بدون اختبارات
```typescript
// scripts/find-untested-files.ts
// يكشف أي ملف TypeScript بدون ملف اختبار مقابل
```

### 3. سكريبت ملخص التغطية
```typescript
// scripts/coverage-summary.ts
// يولد تقرير مفصل عن حالة التغطية
```

## 🚦 آلية الإنفاذ التلقائي

### أ. فحص تلقائي قبل كل Commit
```bash
# .husky/pre-commit (إلزامي - يرفض الكود غير المطابق)
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Enforcing mandatory test coverage..."

# فحص التغطية على الملفات المتغيرة
pnpm run enforce:strict

# إذا فشلت التغطية، يُرفض الـ commit
if [ $? -ne 0 ]; then
  echo "❌ COMMIT REJECTED: Coverage thresholds not met"
  exit 1
fi

echo "✅ Coverage check passed - proceeding with commit"
```

### ب. فحص صارم في CI/CD
```yaml
# .github/workflows/mandatory-tests.yml
name: 🚨 Mandatory Test Coverage Enforcement

on: [pull_request, push]

jobs:
  mandatory-coverage-enforcement:
    runs-on: ubuntu-latest
    steps:
      - name: 🧪 Run ALL tests with coverage
        run: pnpm run test:coverage

      - name: 📊 Enforce Mandatory Coverage Thresholds
        run: pnpm run enforce:coverage

      - name: ⛔ Block Merge if Coverage Insufficient
        if: failure()
        run: |
          echo "::error::Coverage requirements not met - merge blocked"
          exit 1
```

## 📊 الوضع الحالي للمشروع

### حالة التغطية الحالية (قبل التحسين)
| الحزمة | Lines | Functions | Branches | Statements | الحالة |
|--------|-------|-----------|----------|------------|--------|
| **@agent-team/ai** | 0% | 0% | 0% | 0% | ❌ فشل |
| **@agent-team/orchestration** | 39.67% | 52% | 63.63% | 39.67% | ❌ فشل |
| **@agent-team/communication** | 31.18% | 85.29% | 86.25% | 31.18% | ❌ فشل |
| **apps/server** | 57.03% | 48.71% | 70.12% | 57.03% | ❌ فشل |

### الملفات التي تحتاج اختبارات (35 ملف)
- ❌ `ai/src/exec/Invoke.ts`
- ❌ `orchestration/src/metrics/Metrics.ts`
- ❌ `ai/src/prompts/system.ts`
- ❌ `ai/src/tools/ToolRuntime.ts`
- و 31 ملف إضافي...

## 🚨 الوضع الحرج

**النظام يعمل بشكل صحيح!** ✅

- ✅ الاختبارات تعمل
- ✅ التغطية تُحسب
- ✅ الحدود تُفرض
- ✅ الملفات غير المختبرة تُكتشف
- ✅ الـ commit يُرفض عند عدم الامتثال

**لكن:** جميع المقاييس **تحت الحدود الدنيا** - هذا يتطلب **عمل فوري**.

## 📋 قائمة التحقق الإلزامية

### قبل كل Commit
- [ ] **تم تشغيل الاختبارات:** `pnpm test` ✅ نجح بدون أخطاء
- [ ] **التغطية المطلوبة:** جميع الملفات المتغيرة لديها تغطية ≥85%
- [ ] **لا ملفات بدون اختبارات:** `pnpm run enforce:all-files-tested` ✅ نجح
- [ ] **فحص التغطية الصارم:** `pnpm run enforce:coverage` ✅ نجح
- [ ] **Type Check:** `pnpm run typecheck` ✅ بدون أخطاء
- [ ] **Lint:** `pnpm run lint` ✅ بدون أخطاء

### قبل كل Pull Request
- [ ] **CI/CD Pipeline:** جميع Checks خضراء ✅
- [ ] **Code Coverage Report:** متوفر ومراجع
- [ ] **Coverage Thresholds:** جميع الحدود مستوفاة
- [ ] **No Untested Files:** صفر ملفات بدون اختبارات

## 🎯 الخطة العاجلة للتحسين

### المرحلة 1: الإصلاح الفوري (أسبوع 1)
1. **إنشاء اختبارات للملفات الحرجة** (الـ 10 الأكبر حجماً)
2. **تحسين تغطية الحزم الأساسية** (ai, orchestration)
3. **الوصول للحدود الدنيا** (≥85% للجميع)

### المرحلة 2: التحسين المستمر (أسبوع 2-4)
1. **الوصول للحدود المستهدفة** (≥90% للخدمات، ≥95% للذكاء الاصطناعي)
2. **تحسين جودة الاختبارات** (edge cases, error handling)
3. **إضافة اختبارات الأداء**

### المرحلة 3: الصيانة (مستمر)
1. **مراقبة التغطية أسبوعياً**
2. **تحديث الاختبارات مع التطوير**
3. **مراجعة وتحسين الاختبارات القائمة**

## 🔧 الأدوات المتوفرة

### أوامر فورية للمطورين
```bash
# فحص سريع
pnpm run test:coverage          # تشغيل الاختبارات مع التغطية
pnpm run enforce:coverage       # فحص الحدود الصارم
pnpm run enforce:all-files-tested # كشف الملفات بدون اختبارات

# فحص شامل
pnpm run enforce:strict         # جميع الفحوصات الصارمة
pnpm run verify:all             # التحقق الكامل

# تطوير
pnpm run test:watch             # وضع المراقبة للاختبارات
pnpm run coverage:summary       # ملخص التغطية
```

## 🎯 الخلاصة: القواعد الذهبية

1. **كل ملف TypeScript = ملف اختبار مقابل** (بدون استثناءات)
2. **كل دالة/method = اختبارات شاملة** (Happy + Edge + Error)
3. **كل branch منطقي = اختبار منفصل**
4. **التغطية < 85% = رفض تلقائي**
5. **CI/CD فاشل = لا merge ممكن**
6. **لا TODO في الاختبارات** بدون تتبع
7. **كل Commit يمر بفحص pre-commit الصارم**
8. **كل PR يمر بمراجعة CI/CD الشاملة**
9. **لا استثناءات - لا أعذار - لا مساومات**
10. **الجودة أولاً - دائماً**

## ⚠️ تذكير أخير

هذا ليس "دليل توصيات" - هذا **أمر إلزامي** لضمان جودة الكود والموثوقية.
**لا مساومة. لا استثناءات. التزام كامل.**

🎯 **الهدف:** صفر عيوب في Production - **نحن على الطريق الصحيح!**

---

## 📈 التقدم المطلوب

| المرحلة | التاريخ | الهدف | الحالي | المطلوب |
|---------|---------|-------|--------|----------|
| **الإصلاح الفوري** | أسبوع 1 | ≥85% للجميع | 0-57% | +28-85% |
| **الحدود المستهدفة** | أسبوع 2-4 | ≥90-100% | - | +5-43% |
| **التميز** | مستمر | ≥95% للحرج | - | +5-38% |

**🚀 النظام جاهز - الآن نحتاج للتنفيذ العاجل!**
