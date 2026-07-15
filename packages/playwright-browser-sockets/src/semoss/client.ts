import { Env, Insight } from "@semoss/sdk";
import type { McpToolContext } from "../types/browserEvents";
import { runPixel } from "./pixel";

type EnvWithTool = typeof Env & { TOOL?: unknown };
type McpToolStatus = "success" | "error" | "cancelled" | "paused";
type InsightWithMcpResponse = typeof insight & {
  actions: typeof insight.actions & {
    sendMCPResponseToPlayground?: (
      response: string,
      status: McpToolStatus,
      executedParameters: Record<string, unknown>,
    ) => void;
  };
};

type McpToolResponse = {
  type: "SMSS_EXEC_TOOL";
  tool: {
    type: "MCP";
    message: string;
    id: string;
    name: string;
    response: string;
    roomId: string;
    tool_status: McpToolStatus;
    executedParameters: Record<string, unknown>;
  };
};

const semossEnvScript = document.getElementById("semoss-env");

if (semossEnvScript?.textContent) {
  try {
    Env.update(JSON.parse(semossEnvScript.textContent));
  } catch (error) {
    console.warn("Unable to parse SEMOSS environment payload", error);
  }
}

export const insight = new Insight();

let initialized = false;
let toolContext = normalizeToolContext((Env as EnvWithTool).TOOL);
let boundRoomId = "";
let boundInsightId = "";
let roomBinding: Promise<void> | null = null;
const subscribers = new Set<(context: McpToolContext | null) => void>();

function normalizeToolContext(rawTool: unknown): McpToolContext | null {
  if (!rawTool || typeof rawTool !== "object") {
    return null;
  }

  const tool = rawTool as Record<string, unknown>;
  const parameters =
    tool.parameters &&
    typeof tool.parameters === "object" &&
    !Array.isArray(tool.parameters)
      ? (tool.parameters as Record<string, unknown>)
      : {};

  const executedParameters =
    tool.executedParameters &&
    typeof tool.executedParameters === "object" &&
    !Array.isArray(tool.executedParameters)
      ? (tool.executedParameters as Record<string, unknown>)
      : undefined;

  return {
    type: typeof tool.type === "string" ? tool.type : "MCP",
    id: typeof tool.id === "string" ? tool.id : "",
    name:
      typeof tool.name === "string"
        ? tool.name
        : typeof tool.original_name === "string"
        ? tool.original_name
        : "",
    originalName:
      typeof tool.original_name === "string"
        ? tool.original_name
        : typeof tool.name === "string"
        ? tool.name
        : "",
    message: typeof tool.message === "string" ? tool.message : "",
    roomId: typeof tool.roomId === "string" ? tool.roomId : "",
    parameters,
    executedParameters,
    toolResponse: tool.tool_response,
  };
}

function setToolContext(nextToolContext: unknown) {
  toolContext = normalizeToolContext(nextToolContext);
  subscribers.forEach((subscriber) => {
    try {
      subscriber(toolContext);
    } catch (error) {
      console.warn("Unable to notify MCP tool context subscriber", error);
    }
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    if (!event?.data || event.data.type !== "SMSS_INIT_TOOL") {
      return;
    }
    setToolContext(event.data.tool);
  });
}

export async function initSemoss(): Promise<McpToolContext | null> {
  if (initialized) {
    return toolContext;
  }

  try {
    const initializedContext = await insight.initialize();
    setToolContext(
      (initializedContext as { tool?: unknown } | undefined)?.tool ||
        (Env as EnvWithTool).TOOL ||
        toolContext,
    );
  } catch (error) {
    console.warn(
      "SEMOSS initialization failed; continuing without MCP context",
      error,
    );
  } finally {
    initialized = true;
  }

  return toolContext;
}

export function getMcpToolContext(): McpToolContext | null {
  return toolContext;
}

export function getSemossInsightId(): string {
  return boundInsightId || insight.insightId;
}

export async function resolvePlaywrightRoomRecording<T = unknown>(
  roomId: string,
  parameters: {
    recordingNameHint?: string;
    recordingFile?: string;
    projectId?: string;
  },
): Promise<T> {
  const { pixelReturn } = await runPixel<unknown>(
    `ResolvePlaywrightRoomRecording(roomId=${JSON.stringify(
      roomId,
    )}, recording_name_hint=${JSON.stringify(
      parameters.recordingNameHint || "",
    )}, recording_file=${JSON.stringify(
      parameters.recordingFile || "",
    )}, project_id=${JSON.stringify(parameters.projectId || "")});`,
    getSemossInsightId(),
  );

  const output = pixelReturn?.[0]?.output;
  if (typeof output === "string") {
    return JSON.parse(output) as T;
  }
  return output as T;
}

export async function bindSemossInsightToRoom(roomId: string): Promise<void> {
  const normalizedRoomId = roomId.trim();
  if (!normalizedRoomId) {
    throw new Error("Room ID is required to bind the SEMOSS insight");
  }
  if (boundRoomId === normalizedRoomId) {
    return;
  }
  if (roomBinding) {
    await roomBinding;
    if (boundRoomId === normalizedRoomId) {
      return;
    }
  }

  roomBinding = (async () => {
    const response = await runPixel(
      `SetRoomForInsight(roomId=${JSON.stringify(normalizedRoomId)});`,
    );
    if (response.insightID) {
      boundInsightId = response.insightID;
    }
    boundRoomId = normalizedRoomId;
  })();

  try {
    await roomBinding;
  } finally {
    roomBinding = null;
  }
}

export function subscribeToMcpToolContext(
  listener: (context: McpToolContext | null) => void,
): () => void {
  subscribers.add(listener);
  listener(toolContext);
  return () => subscribers.delete(listener);
}

export function sendMcpResponseToPlayground(
  response: unknown,
  toolStatus: McpToolStatus = "success",
  executedParameters: Record<string, unknown> = {},
): void {
  const payload =
    typeof response === "string" ? response : JSON.stringify(response);
  const action = (insight as InsightWithMcpResponse).actions
    .sendMCPResponseToPlayground;
  if (action) {
    action(payload, toolStatus, executedParameters);
    return;
  }

  if (!toolContext) {
    throw new Error("No MCP tool execution context found");
  }
  if (typeof window === "undefined" || typeof window.parent === "undefined") {
    throw new Error(
      "Cannot send MCP tool response outside of embedded browser",
    );
  }

  const message: McpToolResponse = {
    type: "SMSS_EXEC_TOOL",
    tool: {
      type: "MCP",
      message: toolContext.message,
      id: toolContext.id,
      name: toolContext.name,
      response: payload,
      roomId: toolContext.roomId,
      tool_status: toolStatus,
      executedParameters,
    },
  };

  window.parent.postMessage(message, "*");
}
