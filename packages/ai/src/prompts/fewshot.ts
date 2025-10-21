/**
 * Few-shot examples for different tasks
 */

export const FEWSHOTS = {
  classify: [
    {
      input: "صِف مهمة بسيطة",
      output: JSON.stringify({ task: "classify", labels: ["A", "B"] })
    },
    {
      input: "راجع هذا الكود",
      output: JSON.stringify({ task: "code_review", labels: ["quality", "security"] })
    }
  ],

  code_gen: [
    {
      input: "اكتب دالة لحساب مضروب عدد",
      output: `function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}`
    }
  ],

  json_extract: [
    {
      input: "استخرج الاسم والعمر من: أحمد عمره 25 سنة",
      output: JSON.stringify({ name: "أحمد", age: 25 })
    }
  ],

  task_planning: [
    {
      input: "أنشئ تطبيق ويب بسيط",
      output: JSON.stringify({
        steps: [
          { id: "1", task: "تصميم الواجهة", duration: "2h" },
          { id: "2", task: "تطوير الباك إند", duration: "4h" },
          { id: "3", task: "الربط والاختبار", duration: "2h" }
        ]
      })
    }
  ],

  debugging: [
    {
      input: "لماذا هذا الكود يعطي null: const x = arr.find(i => i > 10)",
      output: JSON.stringify({
        issue: "find() يعيد undefined وليس null عندما لا يجد عنصر",
        solution: "استخدم قيمة افتراضية أو تحقق من undefined",
        fixed_code: "const x = arr.find(i => i > 10) ?? defaultValue"
      })
    }
  ]
};

/**
 * Get few-shot examples for a task type
 */
export function getFewShots(taskType: string): Array<{ input: string; output: string }> {
  return FEWSHOTS[taskType as keyof typeof FEWSHOTS] ?? [];
}
