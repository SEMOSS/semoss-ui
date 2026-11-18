import { useEffect } from "react";
import type { MCPToolResponse } from "@semoss/sdk";
import type { RoomStore } from "../../room/store/room.store";
import { decideAgentToolAction } from "../../room/turns/agent-turn-runner";

/** What a framed tool view posts to the window when the user runs its tool. */
interface ExecToolMessage {
	type: "SMSS_EXEC_TOOL";
	tool: MCPToolResponse;
}

/**
 * Whether a post came from the tool view frame that shows the call it names
 * (`ToolsView` marks its frame with `data-tool-call-id`). A tool's page can
 * only settle its own call: a post from any other window, or about another
 * call, is not one.
 *
 * @param source - The window the post came from.
 * @param toolId - The call the post names.
 * @returns True for the frame showing that call.
 */
const isFromToolFrame = (
	source: MessageEventSource | null,
	toolId: unknown,
): boolean => {
	if (!source || typeof toolId !== "string" || !toolId) {
		return false;
	}
	for (const frame of document.querySelectorAll<HTMLIFrameElement>(
		"iframe[data-tool-call-id]",
	)) {
		if (frame.contentWindow === source) {
			return frame.dataset.toolCallId === toolId;
		}
	}
	return false;
};

/**
 * Run the tool results that framed tool views post to the window
 * (`SMSS_EXEC_TOOL`) in the room. Only the frame showing a call may post its
 * result. A call an agent run paused on resumes the run with the decision;
 * any other call saves its result into the room. A malformed, failed or
 * foreign post is ignored, so it never breaks the listener.
 *
 * @param room - The room the posted calls belong to.
 */
export const useToolViewMessageBridge = (room: RoomStore): void => {
	useEffect(() => {
		const handleMessage = async (event: MessageEvent<ExecToolMessage>) => {
			try {
				if (!event.data || event.data.type !== "SMSS_EXEC_TOOL") {
					return;
				}

				const tool = event.data.tool;
				if (!isFromToolFrame(event.source, tool?.id)) {
					return;
				}

				// An agent-run tool paused on a decision must resume through
				// the AGENT_RUN_ACTION row, not room.processTool's legacy
				// room-write path — see decideAgentToolAction.
				const liveTool = room.getTool(tool.id);
				if (liveTool?.pendingAction) {
					const isCancelled =
						tool.tool_status === "cancelled" ||
						tool.tool_status === "paused";
					await decideAgentToolAction(
						liveTool,
						isCancelled ? "reject" : "submit",
						tool.executedParameters ?? {},
					);
					return;
				}

				room.processTool(
					tool.message,
					tool.id,
					tool.response,
					// "paused" is retired — fold any legacy iframe status into cancelled
					tool.tool_status === "paused"
						? "cancelled"
						: tool.tool_status,
					tool.executedParameters ?? {},
				);
			} catch {
				// a malformed or failed post must not break the listener
			}
		};

		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [room]);
};
