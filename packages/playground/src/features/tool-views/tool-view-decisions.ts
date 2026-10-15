import { runInAction } from "mobx";
import type { ToolViewProps } from "@semoss/shared";
import { decideAgentToolAction } from "@/stores/message/agent-harness";
import type { ToolStore } from "@/stores/tool/tool.store";

/** How a `component://` view decides its call. */
export type ToolViewDecisions = Pick<
	ToolViewProps,
	"onApprove" | "onDecline" | "onRespond"
>;

/**
 * How a view decides a call, in either kind of room.
 *
 * - Approve: in an agent run, the run's pending action is approved, as an
 *   edit when the arguments changed. In chat, the call runs through the
 *   room's toolbox with the edited arguments, which are saved with its
 *   result.
 * - Decline: the run's action is rejected, or the chat call is declined, and
 *   the model reads that the user declined it.
 * - Respond: the call is resolved with what the user did instead, as its
 *   result, without running it, so the conversation continues from there.
 *
 * @param tool - The call.
 * @return The decisions.
 */
export const createToolViewDecisions = (
	tool: ToolStore,
): ToolViewDecisions => ({
	onApprove: async (editedArguments) => {
		if (tool.pendingAction) {
			await decideAgentToolAction(tool, "submit", editedArguments);
			return;
		}
		const message = tool.message;
		if (!message || tool.status !== "INITIAL") {
			return;
		}
		if (editedArguments) {
			runInAction(() => {
				tool.parameters = editedArguments;
			});
		}
		await message.runMcpToolCall(tool);
	},
	onDecline: async () => {
		if (tool.pendingAction) {
			await decideAgentToolAction(tool, "reject");
			return;
		}
		await tool.room.chatTools.declineChatTool(tool);
	},
	onRespond: async (outcome) => {
		if (tool.pendingAction) {
			await decideAgentToolAction(tool, "respond", { ...outcome });
			return;
		}
		const message = tool.message;
		if (!message || tool.status !== "INITIAL") {
			return;
		}
		await message.saveToolExecution(
			tool,
			JSON.stringify(outcome),
			"success",
			tool.parameters,
		);
	},
});
