import { useContext, useState } from "react";
import { Alert, AlertDescription, Button, P } from "@semoss/ui/next";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import { EmailSendActions } from "@/features/tools/components/email-send-actions";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { RoomEmailContext } from "./room-email.context";

/** An editor send always uses its reviewed saved draft, including from tool details. */
export function RoomEmailApproval({
	action,
	draftId,
}: {
	action: PendingToolApproval;
	draftId: string;
}) {
	const room = useContext(RoomEmailContext);
	const { onRejectTool } = useToolWorkbench();
	const [isRejecting, setIsRejecting] = useState(false);
	const [error, setError] = useState("");
	const draft = room?.store
		.getSnapshot()
		.emailDrafts.find((item) => item.seed.id === draftId);
	if (room && draft)
		return (
			<div className="space-y-3 p-4">
				<P>Review the email in its editor before sending.</P>
				<Button
					type="button"
					variant="outline"
					onClick={() => room.openDraft(draftId)}
				>
					Open email draft
				</Button>
				<EmailSendActions
					draft={draft}
					onSend={() => room.requestSend(draft)}
					onReject={() => onRejectTool(action)}
				/>
			</div>
		);
	return (
		<div className="space-y-3 p-4">
			<Alert variant="destructive">
				<AlertDescription>
					{error ||
						"This email editor is unavailable. Reconnect to restore the draft before sending."}
				</AlertDescription>
			</Alert>
			<Button
				type="button"
				variant="outline"
				disabled={isRejecting}
				onClick={async () => {
					setIsRejecting(true);
					setError("");
					try {
						await onRejectTool(action);
					} catch (cause) {
						setError(
							cause instanceof Error
								? cause.message
								: "Could not reject this send. Try again.",
						);
					} finally {
						setIsRejecting(false);
					}
				}}
			>
				Don't send
			</Button>
		</div>
	);
}
