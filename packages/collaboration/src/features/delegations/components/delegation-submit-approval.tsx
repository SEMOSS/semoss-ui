import { useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Spinner,
	Textarea,
} from "@semoss/ui/next";
import type { ConversationTool } from "@/features/messages/types/message";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";

const SUBMIT_TOOL_KIND = "semoss_submit_delegation";

/** Whether a tool is the delegation room's send-back step. */
export function isDelegationSubmit(tool: ConversationTool): boolean {
	return tool.metadata?.SMSS_TOOL_KIND === SUBMIT_TOOL_KIND;
}

function text(value: unknown): string {
	return typeof value === "string" ? value : "";
}

/** Inline review of exactly what goes back to the requester before it is sent. */
export function DelegationSubmitApproval({
	tool,
	action,
}: {
	tool: ConversationTool;
	action: PendingToolApproval;
}) {
	const { onApproveTool, onRejectTool, closeTool } = useToolWorkbench();
	const declining = action.arguments.decline === true;
	const field = declining ? "reason" : "response";
	const [value, setValue] = useState(text(action.arguments[field]));
	const [busy, setBusy] = useState<"send" | "keep" | null>(null);
	const [error, setError] = useState<string | null>(null);
	const empty = !declining && !value.trim();

	const resolve = async (kind: "send" | "keep") => {
		setBusy(kind);
		setError(null);
		try {
			if (kind === "send")
				await onApproveTool(action, {
					...action.arguments,
					[field]: value,
				});
			else await onRejectTool(action);
			closeTool(tool.id);
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "Could not update this request.",
			);
		} finally {
			setBusy(null);
		}
	};

	return (
		<div className="flex flex-col gap-3 border-t p-3">
			<p className="text-muted-foreground text-xs">
				{declining
					? "You're declining. This reason goes back to the requester:"
					: "This is exactly what goes back to the requester. Edit it if needed."}
			</p>
			<Textarea
				aria-label={declining ? "Decline reason" : "Answer to send"}
				className="min-h-28 text-sm leading-6"
				value={value}
				disabled={busy !== null}
				onChange={(event) => setValue(event.target.value)}
			/>
			{error && (
				<Alert variant="destructive" className="text-xs">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<div className="flex flex-wrap justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={busy !== null}
					onClick={() => void resolve("keep")}
				>
					{busy === "keep" && (
						<Spinner aria-hidden="true" className="size-4" />
					)}
					Keep working
				</Button>
				<Button
					type="button"
					size="sm"
					disabled={busy !== null || empty}
					onClick={() => void resolve("send")}
				>
					{busy === "send" && (
						<Spinner aria-hidden="true" className="size-4" />
					)}
					{declining ? "Send decline" : "Send answer"}
				</Button>
			</div>
		</div>
	);
}
