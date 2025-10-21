/**
 * Format prompt to request JSON output
 */
export const asJson = (schemaName: string, instruction: string): string => {
  return `أعد JSON يطابق المخطط ${schemaName} بدون شرح:
${instruction}

تأكد من:
- JSON صالح ومنسق
- جميع الحقول المطلوبة موجودة
- الأنواع صحيحة`;
};

/**
 * Format prompt with context
 */
export const withContext = (context: string, question: string): string => {
  return `السياق:
${context}

السؤال:
${question}

أجب بناءً على السياق المقدم فقط.`;
};

/**
 * Format prompt with examples
 */
export const withExamples = (task: string, examples: Array<{ input: string; output: string }>): string => {
  const examplesStr = examples
    .map((ex, i) => `مثال ${i + 1}:\nالمدخل: ${ex.input}\nالمخرج: ${ex.output}`)
    .join("\n\n");

  return `المهمة: ${task}

${examplesStr}

الآن، نفذ المهمة:`;
};

/**
 * Format prompt for code task
 */
export const forCodeTask = (language: string, task: string, constraints?: string[]): string => {
  let prompt = `اكتب كود ${language} لـ:
${task}`;

  if (constraints && constraints.length > 0) {
    prompt += `\n\nالقيود:\n${constraints.map(c => `- ${c}`).join("\n")}`;
  }

  prompt += `\n\nأعد الكود فقط، بدون شرح إضافي.`;

  return prompt;
};

/**
 * Format prompt for structured extraction
 */
export const forExtraction = (text: string, fields: string[]): string => {
  return `استخرج الحقول التالية من النص:
${fields.map(f => `- ${f}`).join("\n")}

النص:
${text}

أعد JSON بهذا التنسيق:
${JSON.stringify(Object.fromEntries(fields.map(f => [f, "string"])), null, 2)}`;
};
