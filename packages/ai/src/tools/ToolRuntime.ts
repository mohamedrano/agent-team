import type { ToolDef } from "./ToolDefinition.js";

/**
 * Tool execution result
 */
export interface ToolResult<O = unknown> {
  success: boolean;
  output?: O;
  error?: string;
}

/**
 * Tool runtime for managing and executing tools
 */
export class ToolRuntime {
  private tools = new Map<string, ToolDef<any, any>>();

  /**
   * Register a tool
   */
  register<I, O>(tool: ToolDef<I, O>): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Unregister a tool
   */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * List all registered tools
   */
  list(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get tool definition
   */
  getTool(name: string): ToolDef<any, any> | undefined {
    return this.tools.get(name);
  }

  /**
   * Invoke a tool by name
   */
  async invoke<O = unknown>(name: string, args: any): Promise<ToolResult<O>> {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        success: false,
        error: `tool_not_found: ${name}`
      };
    }

    try {
      // Validate input
      const validatedArgs = tool.input.parse(args);

      // Execute tool
      const result = await tool.run(validatedArgs);

      // Validate output
      const validatedOutput = tool.output.parse(result);

      return {
        success: true,
        output: validatedOutput
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message ?? "Tool execution failed"
      };
    }
  }

  /**
   * Get tool schemas for LLM consumption
   */
  getSchemas(): Array<{ name: string; description: string; schema: any }> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.desc,
      schema: tool.input
    }));
  }

  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear();
  }
}
