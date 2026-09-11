import { useMemo } from "react";
import { parseUserInputRequest } from "@semoss/sdk";
import { AgentUserInputCard } from "@semoss/ui/next";
import { useWorkbench } from "@/hooks/use-workbench";
import type { BuildPendingAction, BuildRun } from "@/stores/workbench";

interface WorkbenchAssistantUserInputCardProps {
	/** The run awaiting the user's answers */
	run: BuildRun;

	/** The pending RequestUserInput action whose args define the form */
	action: BuildPendingAction;
}

/**
 * Workbench-specific wiring around the platform-shared AgentUserInputCard:
 * parses this action's args and submits answers back through the
 * workbench's own respondUserInput.
 *
 * @name WorkbenchAssistantUserInputCard
 * @param run - The run awaiting the user's answers.
 * @param action - The pending RequestUserInput action defining the form.
 * @return The user-input form card, or an invalid-request notice.
 */
export const WorkbenchAssistantUserInputCard = ({
	run,
	action,
}: WorkbenchAssistantUserInputCardProps) => {
	const respondUserInput = useWorkbench(
		(state) => state.assistant.respondUserInput,
	);
	const request = useMemo(() => parseUserInputRequest(action), [action]);

	if (!request) {
		return (
			<div className="rounded-lg border border-border bg-card p-3 text-destructive text-xs">
				The assistant sent an invalid input request and it cannot be
				displayed.
			</div>
		);
	}

	return (
		<AgentUserInputCard
			request={request}
			disabled={!action.actionId}
			onSubmit={(answers) => {
				if (!action.actionId) {
					throw new Error(
						"This input request is missing its action ID.",
					);
				}
				return respondUserInput(run.runId, action.actionId, answers);
			}}
		/>
	);
};
