import { useState, useSyncExternalStore } from "react";
import { Alert, AlertDescription, Button, Muted } from "@semoss/ui/next";
import type { EmailDraftEditor } from "@/features/connectors/api/email-draft-editor";

/** Send or turn down a paused SendEmail call from the chat; Send runs the editor's own Send. */
export function EmailSendActions({
	draft,
	onSend,
	onReject,
}: {
	draft: EmailDraftEditor;
	onSend: () => void;
	onReject: () => Promise<void>;
}) {
	const snapshot = useSyncExternalStore(
		draft.subscribe,
		draft.getSnapshot,
		draft.getSnapshot,
	);
	const [isRejecting, setIsRejecting] = useState(false);
	const [error, setError] = useState("");
	const isBusy = snapshot.isSending || snapshot.isSaving || isRejecting;
	return (
		<div className="flex flex-wrap items-center gap-2 border-border/60 border-t px-3 py-2">
			<Muted className="min-w-0 flex-1 truncate text-xs">
				{snapshot.values.to
					? `To ${snapshot.values.to}`
					: "No recipients yet"}
				{snapshot.values.subject
					? ` \u00b7 ${snapshot.values.subject}`
					: ""}
			</Muted>
			<Button
				type="button"
				variant="outline"
				className="min-h-9 pointer-coarse:min-h-11"
				disabled={isBusy}
				onClick={async () => {
					setIsRejecting(true);
					setError("");
					try {
						await onReject();
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
			{error && (
				<Alert variant="destructive" className="basis-full">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<Button
				type="button"
				className="min-h-9 pointer-coarse:min-h-11"
				disabled={isBusy || snapshot.isSent}
				onClick={onSend}
			>
				{snapshot.isSending ? "Sending\u2026" : "Send"}
			</Button>
		</div>
	);
}
