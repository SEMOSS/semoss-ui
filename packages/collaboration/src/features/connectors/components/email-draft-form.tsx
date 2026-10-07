import type { ReactNode } from "react";
import { Button, Form, P, Spinner, type UseFormReturn } from "@semoss/ui/next";
import { EmailAddressRow } from "@/features/email/email-address-row";
import type { EmailDraftValues } from "../api/email-draft-values";
import type { ReplyRecipientsState } from "../hooks/use-reply-recipients";
import type { EmailDraftInput } from "../types";
import { ConnectorFormInput } from "./connector-form-input";
import { DraftAttachmentField } from "./draft-attachment-field";
import { EmailAddressFields } from "./email-address-fields";
import { EmailBodyField } from "./email-body-field";
import { EmailFromRow } from "./email-from-row";
import { EmailRecipientField } from "./email-recipient-field";
import { type EmailReplyContext, EmailReplyField } from "./email-reply-field";

interface EmailDraftFormProps {
	/** The host owns values, transaction state, and draft identity. */
	form: UseFormReturn<EmailDraftValues>;
	mode: EmailDraftInput["mode"];
	hasSavedDraft?: boolean;
	canSave?: boolean;
	isReadOnly?: boolean;
	isSending?: boolean;
	canSend?: boolean;
	sendLabel?: string;
	onSend?: (values: EmailDraftValues) => Promise<void>;
	isPending?: boolean;
	isUncertain: boolean;
	/** Original subject for native replies and forwards. */
	sourceSubject?: string;
	replyContext?: EmailReplyContext;
	replyRecipients?: ReplyRecipientsState;
	/** Require activation of Save Draft; typing shortcuts cannot accept a proposal. */
	requiresAcceptance?: boolean;
	/** Contextual controls share the compose surface's single scroll region. */
	assistantContent?: ReactNode;
	feedbackContent?: ReactNode;
	saveLabel?: string;
	saveVariant?: "default" | "outline";
	bodyReplacement?: number;
	onSave: (values: EmailDraftValues) => Promise<void>;
}

/** The subject Outlook gives a reply or forward; it adds the prefix itself, once. */
export function answerSubject(
	mode: "reply" | "forward",
	subject: string,
): string {
	const prefix = mode === "reply" ? "RE:" : "FW:";
	const already = mode === "reply" ? /^re\s*:/i : /^(fw|fwd)\s*:/i;
	return already.test(subject) ? subject : `${prefix} ${subject}`;
}

/** A shared compose surface with one scrolling work area and a reachable save action. */
export function EmailDraftForm({
	form,
	mode,
	hasSavedDraft = false,
	canSave = true,
	isReadOnly = false,
	isSending = false,
	canSend = true,
	sendLabel = "Send",
	onSend,
	isPending = false,
	isUncertain,
	sourceSubject,
	replyRecipients,
	requiresAcceptance = false,
	assistantContent,
	feedbackContent,
	saveLabel = "Save Draft",
	saveVariant = "default",
	bodyReplacement,
	onSave,
}: EmailDraftFormProps) {
	const isSubmitting = isPending || form.formState.isSubmitting;
	const fieldsDisabled = isSubmitting || isReadOnly;
	const isSaveDisabled =
		isSubmitting ||
		isUncertain ||
		!canSave ||
		(mode === "reply" && !replyRecipients?.isReady);
	return (
		<Form
			form={form}
			onSubmit={onSave}
			noValidate
			className="@container/compose flex min-h-0 min-w-0 flex-1 flex-col [@media(max-height:40rem)]:overflow-y-auto"
			aria-busy={isSubmitting}
			onKeyDown={(event) => {
				if (
					requiresAcceptance &&
					!hasSavedDraft &&
					event.key === "Enter"
				) {
					if (
						event.ctrlKey ||
						event.metaKey ||
						event.target instanceof HTMLInputElement
					)
						event.preventDefault();
					return;
				}
				if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
					event.preventDefault();
					if (!isSaveDisabled) event.currentTarget.requestSubmit();
				}
			}}
		>
			{/* Short windows scroll the whole form so the save action remains reachable. */}
			<div className="flex min-h-0 flex-1 flex-col overflow-y-auto [@media(max-height:40rem)]:flex-none [@media(max-height:40rem)]:overflow-visible">
				<div className="shrink-0 px-4">
					<div className="border-border/60 border-b">
						<EmailFromRow />
					</div>
					{mode === "new" && (
						<EmailAddressFields
							form={form}
							disabled={fieldsDisabled}
						/>
					)}
					{mode === "forward" && (
						<EmailRecipientField
							name="to"
							label="To (required)"
							required
							disabled={fieldsDisabled}
						/>
					)}
					{mode === "reply" && (
						<EmailReplyField
							disabled={fieldsDisabled}
							recipients={
								replyRecipients ?? {
									isReady: false,
									error: "Reply recipients are unavailable.",
									retry: () => undefined,
								}
							}
						/>
					)}
					{mode === "new" ? (
						<div className="py-1">
							<ConnectorFormInput
								name="subject"
								label="Subject"
								presentation="mail"
								placeholder="Add a subject"
								disabled={fieldsDisabled}
							/>
						</div>
					) : (
						<EmailAddressRow label="Subject">
							<span className="break-words py-1 font-medium">
								{sourceSubject
									? answerSubject(mode, sourceSubject)
									: "Original email subject"}
							</span>
						</EmailAddressRow>
					)}
					{mode === "forward" && (
						<P className="pb-2 text-base text-muted-foreground">
							Outlook includes the original message and
							attachments below your note.
						</P>
					)}
				</div>
				{assistantContent}
				<EmailBodyField
					bodyReplacement={bodyReplacement}
					label={
						mode === "reply"
							? "Reply text (required)"
							: mode === "forward"
								? "Note above forwarded message"
								: "Message"
					}
					required={mode === "reply"}
					disabled={fieldsDisabled}
				/>
				<div className="shrink-0 px-4 pb-2">
					<DraftAttachmentField disabled={fieldsDisabled} />
				</div>
				{feedbackContent}
			</div>
			<footer className="flex shrink-0 flex-wrap justify-end gap-2 border-border border-t bg-background px-4 py-2">
				<Button
					type="submit"
					variant={onSend ? "outline" : saveVariant}
					aria-label={
						isSubmitting ? `${saveLabel}, saving` : undefined
					}
					className="h-auto min-h-9 pointer-coarse:min-h-11 @min-lg/compose:w-auto w-full whitespace-normal"
					disabled={isSaveDisabled}
				>
					{isSubmitting && !isSending && (
						<Spinner aria-label="Saving draft" />
					)}
					{saveLabel}
				</Button>
				{onSend && (
					<Button
						type="button"
						className="min-h-9 pointer-coarse:min-h-11"
						disabled={
							isSubmitting ||
							isUncertain ||
							!canSend ||
							(mode === "reply" && !replyRecipients?.isReady)
						}
						onClick={() => void form.handleSubmit(onSend)()}
					>
						{isSending && <Spinner aria-label="Sending email" />}
						{isSending ? "Sending\u2026" : sendLabel}
					</Button>
				)}
			</footer>
		</Form>
	);
}
