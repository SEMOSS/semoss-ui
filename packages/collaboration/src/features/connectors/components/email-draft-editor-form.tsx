import { FilePenLine } from "lucide-react";
import { type ReactNode, useEffect, useRef, useSyncExternalStore } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	H3,
	P,
	toast,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import type {
	EmailDraftEditor,
	EmailDraftFieldErrors,
} from "@/features/connectors/api/email-draft-editor";
import {
	type EmailDraftValues,
	emailDraftSchema,
} from "@/features/connectors/api/email-draft-values";
import { safeSourceUrl } from "@/features/connectors/api/microsoft";
import { showEmailDraftSavedToast } from "@/features/connectors/components/email-draft-feedback";
import { EmailDraftForm } from "@/features/connectors/components/email-draft-form";
import type { EmailReplyContext } from "@/features/connectors/components/email-reply-field";
import { useReplyRecipients } from "@/features/connectors/hooks/use-reply-recipients";
import { draftText } from "@/features/email/email-html";
import type { InsightActions } from "@/lib/pixel";
import type { SavedEmailDraft } from "../types";

/** Form values are retained by the thread; submission survives this view unmounting. */
export function EmailDraftEditorForm({
	draft,
	replyContext,
	assistantContent,
	actions,
	insightId,
	retain,
	onEmailSent,
	onSaved,
	saveLabel,
}: {
	draft: EmailDraftEditor;
	replyContext?: EmailReplyContext;
	assistantContent?: ReactNode;
	saveLabel?: string;
	actions: InsightActions;
	insightId: string;
	retain?: () => () => void;
	onEmailSent?: () => void;
	onSaved?: (draft: SavedEmailDraft) => void;
}) {
	const snapshot = useSyncExternalStore(
		draft.subscribe,
		draft.getSnapshot,
		draft.getSnapshot,
	);
	const form = useForm<EmailDraftValues>({
		resolver: zodResolver(emailDraftSchema),
		defaultValues: snapshot.values,
	});

	const replacements = useRef({
		body: snapshot.bodyReplacement,
		envelope: snapshot.envelopeReplacement,
		files: snapshot.filesReplacement,
	});
	useEffect(() => {
		const previous = replacements.current;
		const bodyChanged = previous.body !== snapshot.bodyReplacement;
		const envelopeChanged =
			previous.envelope !== snapshot.envelopeReplacement;
		const filesChanged = previous.files !== snapshot.filesReplacement;
		if (!bodyChanged && !envelopeChanged && !filesChanged) return;
		replacements.current = {
			body: snapshot.bodyReplacement,
			envelope: snapshot.envelopeReplacement,
			files: snapshot.filesReplacement,
		};
		// Copy all externally changed fields together; form callbacks must never restore stale fields.
		form.reset(
			{
				...form.getValues(),
				...(bodyChanged ? { body: snapshot.values.body } : {}),
				...(envelopeChanged
					? {
							to: snapshot.values.to,
							cc: snapshot.values.cc,
							bcc: snapshot.values.bcc,
							subject: snapshot.values.subject,
						}
					: {}),
				...(filesChanged ? { files: snapshot.values.files } : {}),
			},
			{ keepDirty: true, keepErrors: true },
		);
	}, [form, snapshot]);
	useEffect(() => {
		for (const [field, message] of Object.entries(
			draft.getSnapshot().fieldErrors,
		))
			form.setError(field as keyof EmailDraftValues, { message });
		return form.subscribe({
			formState: { values: true, errors: true },
			callback: ({ values, errors }) => {
				draft.setValues(values);
				const retained: EmailDraftFieldErrors = {};
				for (const field of Object.keys(
					values,
				) as (keyof EmailDraftValues)[]) {
					const message = errors[field]?.message;
					if (typeof message === "string") retained[field] = message;
				}
				draft.setFieldErrors(retained);
			},
		});
	}, [draft, form]);
	const replyRecipients = useReplyRecipients({
		form,
		sourceUid: draft.seed.sourceUid,
		insightId: insightId,
		isEnabled: draft.seed.mode === "reply",
		isInitialized: snapshot.isReplyRecipientsInitialized,
		onInitialized: draft.initializeReplyRecipients,
	});
	const handleSend = async (values: EmailDraftValues): Promise<void> => {
		const release = retain?.() ?? (() => undefined);
		try {
			if (await draft.send(actions, values)) {
				form.reset(values);
				toast.success("Email sent");
				onEmailSent?.();
			} else if (draft.getSnapshot().error)
				form.setError("root.server", {
					message: draft.getSnapshot().error,
				});
		} finally {
			release();
		}
	};
	// Send pressed on the chat card runs here, once a reply knows its recipients
	const isRecipientsReady =
		draft.seed.mode !== "reply" || replyRecipients.isReady;
	const handleSendRef = useRef(handleSend);
	handleSendRef.current = handleSend;
	useEffect(() => {
		if (
			snapshot.isSubmitRequested &&
			isRecipientsReady &&
			draft.takeSubmitRequest()
		)
			void form.handleSubmit((values) => handleSendRef.current(values))();
	}, [draft, form, isRecipientsReady, snapshot.isSubmitRequested]);
	return (
		<section
			className="flex h-full min-h-0 min-w-0 flex-col bg-background"
			aria-label="Email draft editor"
		>
			<header className="flex shrink-0 items-center gap-2 border-border border-b px-4 py-2">
				<FilePenLine
					className="size-4 text-muted-foreground"
					aria-hidden="true"
				/>
				<H3 className="text-base">
					{draft.seed.mode === "new"
						? "New email draft"
						: draft.seed.mode === "reply"
							? "Reply draft"
							: "Forward draft"}
				</H3>
			</header>
			<EmailDraftForm
				form={form}
				mode={draft.seed.mode}
				requiresAcceptance={snapshot.requiresAcceptance}
				assistantContent={assistantContent}
				bodyReplacement={snapshot.bodyReplacement}
				saveVariant={
					draft.seed.mode === "reply" &&
					!draftText(snapshot.values.body, "html")
						? "outline"
						: "default"
				}
				saveLabel={
					saveLabel ??
					(snapshot.saved && snapshot.isDirty
						? "Save new copy to Outlook"
						: "Save to Outlook")
				}
				feedbackContent={
					<div className="shrink-0 space-y-2 px-4 py-2">
						{snapshot.pendingAttachments > 0 && (
							<output className="text-sm">
								Adding attachments…
							</output>
						)}
						{snapshot.attachmentError && (
							<Alert variant="destructive">
								<AlertDescription>
									{snapshot.attachmentError}
									<Button
										type="button"
										variant="outline"
										onClick={draft.dismissAttachmentError}
									>
										Continue without these files
									</Button>
								</AlertDescription>
							</Alert>
						)}
						{snapshot.error && (
							<Alert variant="destructive">
								<AlertDescription>
									{snapshot.error}
									{snapshot.isUncertain && (
										<Button
											type="button"
											variant="outline"
											className="min-h-9 pointer-coarse:min-h-11"
											onClick={() => {
												draft.allowRetry();
												form.clearErrors("root.server");
											}}
										>
											I checked Outlook—retry
										</Button>
									)}
								</AlertDescription>
							</Alert>
						)}
						{snapshot.sendApprovalToolId && !snapshot.isSent && (
							<P className="text-sm text-warning">
								Assistant asked to send this. Press Send to send
								it as it is.
							</P>
						)}
						{snapshot.isSent ? (
							<output>Email sent.</output>
						) : snapshot.saved ? (
							<Button
								asChild
								variant="link"
								className="min-h-9 pointer-coarse:min-h-11"
							>
								<a
									href={
										safeSourceUrl(snapshot.saved.webLink) ??
										"https://outlook.office.com/mail/drafts"
									}
									target="_blank"
									rel="noopener noreferrer"
								>
									Open in Outlook
								</a>
							</Button>
						) : (
							<P className="text-muted-foreground text-sm">
								Not saved to Outlook
							</P>
						)}
					</div>
				}
				sourceSubject={draft.seed.subject}
				replyContext={replyContext}
				replyRecipients={replyRecipients}
				hasSavedDraft={Boolean(snapshot.saved)}
				canSave={
					!snapshot.isSent &&
					!snapshot.hasPendingSend &&
					!snapshot.attachmentError &&
					(!snapshot.saved || snapshot.isDirty)
				}
				canSend={!snapshot.isSent && !snapshot.attachmentError}
				isReadOnly={snapshot.isSent || snapshot.hasPendingSend}
				isSending={snapshot.isSending}
				sendLabel={
					snapshot.isSent
						? "Sent"
						: snapshot.hasPendingSend
							? "Retry send"
							: "Send"
				}
				onSend={handleSend}
				isPending={
					snapshot.isSaving ||
					snapshot.isSending ||
					snapshot.pendingAttachments > 0
				}
				isUncertain={snapshot.isUncertain}
				onSave={async (values) => {
					if (
						draft.seed.mode === "reply" &&
						!draftText(values.body, "html")
					) {
						form.setError(
							"body",
							{ message: "Enter reply text." },
							{ shouldFocus: true },
						);
						return;
					}
					if (draft.seed.mode === "forward" && !values.to.trim()) {
						form.setError(
							"to",
							{ message: "Enter at least one recipient." },
							{ shouldFocus: true },
						);
						return;
					}
					const release = retain?.() ?? (() => undefined);
					try {
						const saved = await draft.save(actions, values);
						if (saved) {
							form.reset(values);
							showEmailDraftSavedToast(saved);
							onSaved?.(saved);
							return;
						}
						const failed = draft.getSnapshot();
						if (!failed.error) return;
						form.setError("root.server", {
							message: failed.error,
						});
					} finally {
						release();
					}
				}}
			/>
		</section>
	);
}
