import { useEffect, useSyncExternalStore } from "react";
import { asString } from "@semoss/utility";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import type { ToolWorkbenchContextValue } from "@/features/tools/types/tool-workbench";
import {
	getToolComponent,
	TOOL_COMPONENTS,
} from "@/features/tools/utils/tool-components";
import type { WorkComposerSession } from "./work-composer-session";

const STILL_GOING = new Set(["INPUT_REQUIRED", "QUEUED", "RUNNING"]);

/** A SendEmail call naming this editor email; its Send buttons are the card and the editor. */
export function isEditorSend(
	approval: PendingToolApproval,
	tools: ToolWorkbenchContextValue["tools"],
	emailId: string,
): boolean {
	const tool = tools[approval.toolId];
	return (
		!approval.requiresResponse &&
		tool !== undefined &&
		getToolComponent(tool) === TOOL_COMPONENTS.emailSend &&
		asString(approval.arguments.openEmailId) === emailId
	);
}

/** Bind each paused SendEmail call to the editor email it names, and report how it ended. */
export function useEmailSendApprovals(
	composer: WorkComposerSession,
	workbench: Pick<
		ToolWorkbenchContextValue,
		"pendingApprovals" | "tools" | "onApproveTool" | "onRejectTool"
	>,
): void {
	const memory = useSyncExternalStore(
		composer.subscribe,
		composer.getSnapshot,
		composer.getSnapshot,
	);
	const { pendingApprovals, tools, onApproveTool, onRejectTool } = workbench;
	useEffect(() => {
		for (const draft of memory.emailDrafts) {
			const approval = pendingApprovals.find((item) =>
				isEditorSend(item, tools, draft.seed.id),
			);
			if (approval) {
				draft.setSendApproval({
					toolId: approval.toolId,
					// the editor's saved draft is what goes out, not the call's copy
					approve: (draftId) =>
						onApproveTool(approval, {
							...approval.arguments,
							draftId,
						}),
					reject: () => onRejectTool(approval),
				});
				continue;
			}
			const bound = draft.getSnapshot().sendApprovalToolId;
			if (!bound) continue;
			const tool = tools[bound];
			if (tool && STILL_GOING.has(tool.status)) continue;
			if (tool?.status === "COMPLETED")
				draft.settleApprovedSend({ sent: true });
			else if (tool?.status === "FAILED")
				draft.settleApprovedSend({
					sent: false,
					error:
						tool.error ||
						"The email could not be sent. Check Outlook before retrying.",
					isNotSent: false,
				});
			else
				draft.settleApprovedSend({
					sent: false,
					error: "The send was turned down, so nothing was sent.",
					isNotSent: true,
				});
			draft.setSendApproval(null);
		}
	}, [memory, pendingApprovals, tools, onApproveTool, onRejectTool]);
}
