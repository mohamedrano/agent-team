import { describe, it, expect } from "vitest";
import { asJson, withContext, withExamples, forCodeTask, forExtraction } from "../src/prompts/formatters.js";

describe("Prompt Formatters - JSON Shape", () => {
  it("should format JSON request prompt", () => {
    const prompt = asJson("User", "Create a user object");

    expect(prompt).toContain("JSON");
    expect(prompt).toContain("User");
    expect(prompt).toContain("Create a user object");
  });

  it("should include validation requirements in JSON prompt", () => {
    const prompt = asJson("Schema", "Generate data");

    expect(prompt).toContain("JSON");
    // Should include validation requirements (in Arabic)
    expect(prompt.length).toBeGreaterThan(20);
  });

  it("should format context-based prompt", () => {
    const context = "The system is running on production servers.";
    const question = "What is the deployment environment?";

    const prompt = withContext(context, question);

    expect(prompt).toContain(context);
    expect(prompt).toContain(question);
    expect(prompt).toContain("السياق");
    expect(prompt).toContain("السؤال");
  });

  it("should format prompt with examples", () => {
    const examples = [
      { input: "hello", output: "مرحبا" },
      { input: "goodbye", output: "وداعا" }
    ];

    const prompt = withExamples("Translate to Arabic", examples);

    expect(prompt).toContain("Translate to Arabic");
    expect(prompt).toContain("hello");
    expect(prompt).toContain("مرحبا");
    expect(prompt).toContain("goodbye");
    expect(prompt).toContain("وداعا");
    expect(prompt).toContain("مثال");
  });

  it("should format code task prompt", () => {
    const prompt = forCodeTask("TypeScript", "Create a function to sort an array");

    expect(prompt).toContain("TypeScript");
    expect(prompt).toContain("Create a function to sort an array");
  });

  it("should include constraints in code task prompt", () => {
    const constraints = [
      "Use functional programming",
      "No mutations",
      "Type-safe"
    ];

    const prompt = forCodeTask("TypeScript", "Implement map function", constraints);

    expect(prompt).toContain("TypeScript");
    expect(prompt).toContain("Implement map function");
    expect(prompt).toContain("Use functional programming");
    expect(prompt).toContain("No mutations");
    expect(prompt).toContain("Type-safe");
  });

  it("should format extraction prompt with fields", () => {
    const text = "John Doe, age 30, lives in New York, email: john@example.com";
    const fields = ["name", "age", "city", "email"];

    const prompt = forExtraction(text, fields);

    expect(prompt).toContain(text);
    expect(prompt).toContain("name");
    expect(prompt).toContain("age");
    expect(prompt).toContain("city");
    expect(prompt).toContain("email");
    expect(prompt).toContain("JSON");
  });

  it("should generate valid JSON shape in extraction prompt", () => {
    const fields = ["name", "age", "city"];
    const prompt = forExtraction("Some text", fields);

    // Should contain a JSON example with the requested fields
    expect(prompt).toContain("name");
    expect(prompt).toContain("age");
    expect(prompt).toContain("city");
    expect(prompt).toContain("{");
    expect(prompt).toContain("}");
  });

  it("should handle empty examples array", () => {
    const prompt = withExamples("Task description", []);
    
    expect(prompt).toContain("Task description");
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should handle multiple examples", () => {
    const examples = [
      { input: "1", output: "one" },
      { input: "2", output: "two" },
      { input: "3", output: "three" }
    ];

    const prompt = withExamples("Number to word", examples);

    expect(prompt).toContain("1");
    expect(prompt).toContain("one");
    expect(prompt).toContain("2");
    expect(prompt).toContain("two");
    expect(prompt).toContain("3");
    expect(prompt).toContain("three");
  });

  it("should format code task without constraints", () => {
    const prompt = forCodeTask("Python", "Sort a list");

    expect(prompt).toContain("Python");
    expect(prompt).toContain("Sort a list");
    expect(prompt).not.toContain("القيود"); // Should not have constraints section
  });

  it("should create distinct prompts for different inputs", () => {
    const prompt1 = asJson("Schema1", "Task 1");
    const prompt2 = asJson("Schema2", "Task 2");

    expect(prompt1).not.toBe(prompt2);
    expect(prompt1).toContain("Schema1");
    expect(prompt2).toContain("Schema2");
  });

  it("should format extraction with single field", () => {
    const prompt = forExtraction("Extract the name: Alice", ["name"]);

    expect(prompt).toContain("name");
    expect(prompt).toContain("Alice");
  });

  it("should handle special characters in context", () => {
    const context = 'Data: {"key": "value", "count": 42}';
    const question = "What is the count?";

    const prompt = withContext(context, question);

    expect(prompt).toContain('"key"');
    expect(prompt).toContain('"value"');
    expect(prompt).toContain("42");
  });

  it("should preserve Arabic text in prompts", () => {
    const prompt1 = asJson("مخطط البيانات", "أنشئ كائن مستخدم");
    expect(prompt1).toContain("مخطط البيانات");
    expect(prompt1).toContain("أنشئ كائن مستخدم");

    const prompt2 = withContext("السياق العربي", "السؤال العربي");
    expect(prompt2).toContain("السياق العربي");
    expect(prompt2).toContain("السؤال العربي");
  });

  it("should create consistent output format across formatters", () => {
    // All formatters should return strings
    expect(typeof asJson("S", "T")).toBe("string");
    expect(typeof withContext("C", "Q")).toBe("string");
    expect(typeof withExamples("T", [])).toBe("string");
    expect(typeof forCodeTask("L", "T")).toBe("string");
    expect(typeof forExtraction("T", ["f"])).toBe("string");
  });

  it("should handle empty strings gracefully", () => {
    expect(() => asJson("", "")).not.toThrow();
    expect(() => withContext("", "")).not.toThrow();
    expect(() => forCodeTask("", "")).not.toThrow();
    expect(() => forExtraction("", [])).not.toThrow();
  });
});
