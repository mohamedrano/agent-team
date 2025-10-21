import { z } from "zod";
import { defineTool } from "./ToolDefinition.js";

/**
 * Built-in tool: Echo
 */
export const echoTool = defineTool(
  "echo",
  "Echo back the input message",
  z.object({ message: z.string() }),
  z.object({ result: z.string() }),
  async (args) => {
    return { result: args.message };
  }
);

/**
 * Built-in tool: Read File (mock)
 */
export const readFileTool = defineTool(
  "readFile",
  "Read contents of a file",
  z.object({ path: z.string() }),
  z.object({ content: z.string(), exists: z.boolean() }),
  async (args) => {
    // Mock implementation
    return {
      content: `Mock content of ${args.path}`,
      exists: true
    };
  }
);

/**
 * Built-in tool: HTTP GET (mock)
 */
export const httpGetTool = defineTool(
  "httpGet",
  "Make an HTTP GET request",
  z.object({ url: z.string().url() }),
  z.object({ status: z.number(), body: z.string() }),
  async (args) => {
    // Mock implementation
    return {
      status: 200,
      body: `Mock response from ${args.url}`
    };
  }
);

/**
 * Built-in tool: Calculate
 */
export const calculateTool = defineTool(
  "calculate",
  "Perform a mathematical calculation",
  z.object({ expression: z.string() }),
  z.object({ result: z.number() }),
  async (args) => {
    try {
      // Very basic eval for demo - DO NOT use in production!
      // In production, use a proper math expression parser
      const result = Function(`"use strict"; return (${args.expression})`)();
      return { result: Number(result) };
    } catch {
      throw new Error("Invalid expression");
    }
  }
);

/**
 * Get all built-in tools
 */
export const builtInTools = [
  echoTool,
  readFileTool,
  httpGetTool,
  calculateTool
];
