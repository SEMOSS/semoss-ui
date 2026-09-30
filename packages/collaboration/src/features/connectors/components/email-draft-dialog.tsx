import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import { EmailDraftEditor } from "../api/email-draft-editor";
import type { SavedEmailDraft } from "../types";
import { EmailDraftEditorForm } from "./email-draft-editor-form";
import type { EmailReplyContext } from "./email-reply-field";

export interface EmailDraftDialogProps {
	/** Controlled visibility; closing retains unsaved content while the component remains mounted. */
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	/** Required for a native reply or forward; never guessed from a subject. */
	sourceUid?: string;
	mode: "new" | "reply" | "forward";
	initialBody?: string;
	initialSubject?: string;
	initialTo?: string;
	/** Known source sender for the native reply envelope. */
	replyContext?: EmailReplyContext;
	onSaved?: (draft: SavedEmailDraft) => void;
}

/** The shared retained editor separates saving from an explicit Send action. */
export function EmailDraftDialog({
	isOpen,
	onOpenChange,
	sourceUid,
	mode,
	initialBody = "",
	initialSubject = "",
	initialTo = "",
	replyContext,
	onSaved,
}: EmailDraftDialogProps) {
	const { actions, insightId } = useInsight();
	const drafts = useRef(new Map<string, EmailDraftEditor>());
	const returnFocus = useRef<HTMLElement | null>(null);
	const draft = useMemo(() => {
		const id = JSON.stringify([insightId, mode, sourceUid ?? "new"]);
		const existing = drafts.current.get(id);
		if (existing) return existing;
		const created = new EmailDraftEditor({
			id,
			mode,
			sourceUid,
			body: initialBody,
			subject: initialSubject,
			to: initialTo,
		});
		drafts.current.set(id, created);
		return created;
	}, [insightId, mode, sourceUid, initialBody, initialSubject, initialTo]);
	const snapshot = useSyncExternalStore(
		draft.subscribe,
		draft.getSnapshot,
		draft.getSnapshot,
	);
	const isPending = snapshot.isSaving || snapshot.isSending;
	useEffect(() => {
		const owned = drafts.current;
		return () => {
			for (const item of owned.values()) item.dispose();
		};
	}, []);
	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!isPending) onOpenChange(open);
			}}
		>
			<DialogContent
				className="flex max-h-dvh flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
				showCloseButton={!isPending}
				onOpenAutoFocus={() => {
					returnFocus.current =
						document.activeElement instanceof HTMLElement
							? document.activeElement
							: null;
				}}
				onEscapeKeyDown={(event) => {
					if (isPending) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isPending) event.preventDefault();
				}}
				onCloseAutoFocus={(event) => {
					if (returnFocus.current?.isConnected) {
						event.preventDefault();
						returnFocus.current.focus();
					}
				}}
			>
				<DialogHeader className="sr-only">
					<DialogTitle>
						{mode === "new"
							? "New email draft"
							: mode === "reply"
								? "Reply draft"
								: "Forward draft"}
					</DialogTitle>
					<DialogDescription>
						Review your email, then save a draft or choose Send.
					</DialogDescription>
				</DialogHeader>
				<EmailDraftEditorForm
					saveLabel="Save Draft"
					key={draft.seed.id}
					draft={draft}
					actions={actions}
					insightId={insightId}
					replyContext={replyContext}
					onSaved={onSaved}
				/>
			</DialogContent>
		</Dialog>
	);
}
