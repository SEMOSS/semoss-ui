import { toJS } from "mobx";
import type {
	ToolViewCall,
	ToolViewCallStatus,
	ToolViewMode,
} from "@semoss/shared";
import { readToolResponseDetail } from "@/features/chat-tools/tools/tool-response-detail";
import type { ToolStore } from "@/stores/tool/tool.store";
import { isAskExecutionMode } from "@/utility/mcp-utils";

/** A tool's status, as a tool view reads it. */
const CALL_STATUSES: Record<ToolStore["status"], ToolViewCallStatus> = {
	INITIAL: "pending",
	LOADING: "running",
	SUCCESS: "succeeded",
	ERROR: "failed",
	CANCELLED: "declined",
};

/**
 * A tool call, as a `component://` view receives it. A failed or stopped
 * call's result is its details, without the guidance the model reads with
 * them.
 *
 * @param tool - The call.
 * @return The call for the view.
 */
export const toToolViewCall = (tool: ToolStore): ToolViewCall => {
	const status = CALL_STATUSES[tool.status];
	const json = tool.json;
	const response = tool.response;
	return {
		id: tool.id,
		functionName:
			json._meta?.SMSS_FUNCTION_NAME || json.original_name || json.name,
		arguments: toJS(tool.parameters ?? {}),
		result: response
			? status === "succeeded"
				? response
				: readToolResponseDetail(response)
			: undefined,
		status: status,
	};
};

/**
 * Whether a call waits for the user's decision. In an agent run it waits
 * while the run holds a pending action for it; in chat, while an ask call
 * has not run.
 *
 * @param tool - The call.
 * @return `approval` while it waits, `result` otherwise.
 */
export const toToolViewMode = (tool: ToolStore): ToolViewMode => {
	if (tool.status !== "INITIAL") {
		return "result";
	}
	if (tool.room.mode === "agent") {
		return tool.pendingAction ? "approval" : "result";
	}
	return isAskExecutionMode(tool.json._meta?.SMSS_MCP_EXECUTION) &&
		tool.message
		? "approval"
		: "result";
};
