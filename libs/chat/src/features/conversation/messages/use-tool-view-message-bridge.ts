import { useEffect } from "react";
import type { MCPToolResponse } from "@semoss/sdk";
import type { RoomStore } from "../../room/store/room.store";
import { decideAgentToolAction } from "../store/agent-harness";

/** What a framed tool view posts to the window when the user runs its tool. */
interface ExecToolMessage {
	type: "SMSS_EXEC_TOOL";
	tool: MCPToolResponse;
}

/**
 * Run the tool results that framed tool views post to the window
 * (`SMSS_EXEC_TOOL`) in the room. A call an agent run paused on resumes the
 * run with the decision; any other call saves its result into the room. A
 * malformed or failed post is ignored, so it never breaks the listener.
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
