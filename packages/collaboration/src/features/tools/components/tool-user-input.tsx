import { useState } from "react";
import { parseUserInputRequest } from "@semoss/sdk";
import {
	AgentUserInputCard,
	Alert,
	AlertDescription,
	Button,
} from "@semoss/ui/next";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import { useToolWorkbench } from "../tool-workbench.context";

/** Answer agent questions using the same structured request contract as Playground. */
export function ToolUserInput({ action }: { action: PendingToolApproval }) {
	const { onApproveTool, onRejectTool, closeTool } = useToolWorkbench();
	const [error, setError] = useState<string | null>(null);
	const [isUpdating, setIsUpdating] = useState(false);
	const request = parseUserInputRequest({ toolArgs: action.arguments });
	const decide = async (answers?: Record<string, unknown>): Promise<void> => {
		if (isUpdating || action.isDeciding) return;
		setIsUpdating(true);
		setError(null);
		try {
			if (answers) await onApproveTool(action, answers);
			else await onRejectTool(action);
			closeTool(action.toolId);
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "Could not save your response.",
			);
		} finally {
			setIsUpdating(false);
		}
	};
	return (
		<div
			className="min-h-0 flex-1 space-y-3 overflow-auto p-3"
			aria-busy={isUpdating}
		>
			{request ? (
				<AgentUserInputCard
					request={request}
					disabled={isUpdating || action.isDeciding}
					onSubmit={decide}
				/>
			) : (
				<Alert variant="destructive">
					<AlertDescription>
						The agent sent an invalid question request. Reject it or
						reconnect to refresh the request.
					</AlertDescription>
				</Alert>
			)}
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<Button
				type="button"
				variant="outline"
				disabled={isUpdating || action.isDeciding}
				onClick={() => void decide()}
			>
				Reject
			</Button>
		</div>
	);
}
