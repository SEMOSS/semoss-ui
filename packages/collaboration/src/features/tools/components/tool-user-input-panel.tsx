import {
	isRequestUserInputAction,
	type PendingAgentAction,
	parseUserInputRequest,
} from "@semoss/sdk";
import {
	AgentUserInputCard,
	Alert,
	AlertDescription,
	ScrollArea,
} from "@semoss/ui/next";
import { useToolWorkbench } from "../tool-workbench.context";

/** Playground's structured RequestUserInput experience inside a tool panel. */
export function ToolUserInputPanel({ action }: { action: PendingAgentAction }) {
	const { onDecideAction } = useToolWorkbench();
	const request = isRequestUserInputAction(action)
		? parseUserInputRequest(action)
		: null;

	if (!request) {
		return (
			<div className="p-3">
				<Alert variant="destructive">
					<AlertDescription>
						The assistant sent an input request that could not be
						displayed.
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<ScrollArea className="min-h-0 flex-1">
			<div className="p-3">
				<AgentUserInputCard
					request={request}
					onSubmit={(answers) =>
						onDecideAction(action, "respond", answers)
					}
				/>
			</div>
		</ScrollArea>
	);
}
