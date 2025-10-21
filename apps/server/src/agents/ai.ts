/**
 * AI Agent Integration
 * Handles AI-related tasks and tool calling
 */

import {
  ToolRuntime,
  builtInTools,
  invokeLLM,
  SYSTEM_BASE,
  SYSTEM_CODE_GEN,
  SYSTEM_CLASSIFY
} from "@agent-team/ai";
import type { MessageEnvelope } from "@agent-team/communication";

// Initialize tool runtime
const toolRuntime = new ToolRuntime();

// Register built-in tools
for (const tool of builtInTools) {
  toolRuntime.register(tool as any);
}

console.log("✅ AI Tools registered:", toolRuntime.list());

/**
 * Handle TASK message
 */
export async function handleTask(msg: MessageEnvelope): Promise<any> {
  const payload = msg.payload as any;

  switch (payload.kind) {
    case "generate":
      return handleGenerate(payload);

    case "classify":
      return handleClassify(payload);

    case "code_gen":
      return handleCodeGen(payload);

    default:
      return {
        success: false,
        error: `Unknown task kind: ${payload.kind}`
      };
  }
}

/**
 * Handle generate task
 */
async function handleGenerate(payload: any): Promise<any> {
  try {
    const result = await invokeLLM(
      {
        taskType: "generate",
        speedHint: payload.speedHint,
        costHint: payload.costHint
      },
      {
        input: payload.prompt,
        system: payload.system ?? SYSTEM_BASE,
        temperature: payload.temperature,
        maxTokens: payload.maxTokens,
        json: payload.json
      }
    );

    return {
      success: true,
      output: result.output,
      model: result.modelUsed,
      attempts: result.attempts
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle classify task
 */
async function handleClassify(payload: any): Promise<any> {
  try {
    const result = await invokeLLM(
      {
        taskType: "classify",
        speedHint: "high",
        costHint: "low"
      },
      {
        input: payload.text,
        system: SYSTEM_CLASSIFY,
        json: true,
        temperature: 0.1
      }
    );

    return {
      success: true,
      classification: result.raw,
      model: result.modelUsed
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle code generation task
 */
async function handleCodeGen(payload: any): Promise<any> {
  try {
    const result = await invokeLLM(
      {
        taskType: "code_generation",
        complexityHint: "med"
      },
      {
        input: payload.prompt,
        system: SYSTEM_CODE_GEN,
        temperature: 0.3,
        maxTokens: 2048
      }
    );

    return {
      success: true,
      code: result.output,
      model: result.modelUsed
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle TOOL_CALL message
 */
export async function handleToolCall(msg: MessageEnvelope): Promise<any> {
  const payload = msg.payload as any;

  try {
    const result = await toolRuntime.invoke(payload.name, payload.args);

    return {
      success: result.success,
      output: result.output,
      error: result.error
    };
  } catch (error: any) {
    return {
      success: false,
      error: `tool_error: ${error.message}`
    };
  }
}

/**
 * Get tool runtime for external access
 */
export function getToolRuntime(): ToolRuntime {
  return toolRuntime;
}
