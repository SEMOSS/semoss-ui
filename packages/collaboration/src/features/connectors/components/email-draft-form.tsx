import type { ReactNode } from "react";
import { Button, Form, P, Spinner, type UseFormReturn } from "@semoss/ui/next";
import { EmailAddressRow } from "@/features/email/email-address-row";
import type { EmailDraftValues } from "../api/email-draft-values";
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
	isPending?: boolean;
	isUncertain: boolean;
	/** Original subject for native replies and forwards. */
	sourceSubject?: string;
	replyContext?: EmailReplyContext;
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

/** A shared compose surface with one scrolling work area and a reachable save action. */
export function EmailDraftForm({
	form,
	mode,
	hasSavedDraft = false,
	canSave = true,
	isPending = false,
	isUncertain,
	sourceSubject,
	replyContext,
	requiresAcceptance = false,
	assistantContent,
	feedbackContent,
	saveLabel = "Save Draft",
	saveVariant = "default",
	bodyReplacement,
	onSave,
}: EmailDraftFormProps) {
	const isSubmitting = isPending || form.formState.isSubmitting;
	const isSaveDisabled = isSubmitting || isUncertain || !canSave;
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
				<div className="shrink-0 @min-lg/compose:px-6 px-4">
					<div className="border-border/60 border-b">
						<EmailFromRow />
					</div>
					{mode === "new" && (
						<EmailAddressFields
							form={form}
							disabled={isSubmitting}
						/>
					)}
					{mode === "forward" && (
						<EmailRecipientField
							name="to"
							label="To (required)"
							required
							disabled={isSubmitting}
						/>
					)}
					{mode === "reply" && (
						<EmailReplyField
							disabled={isSubmitting}
							context={replyContext}
						/>
					)}
					{mode === "new" ? (
						<div className="py-2">
							<ConnectorFormInput
								name="subject"
								label="Subject"
								presentation="mail"
								placeholder="Add a subject"
								disabled={isSubmitting}
							/>
						</div>
					) : (
						<EmailAddressRow label="Subject">
							<span className="break-words py-1 font-medium">
								{sourceSubject || "Original email subject"}
							</span>
						</EmailAddressRow>
					)}
					{mode === "forward" && (
						<P className="pb-3 text-muted-foreground text-sm">
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
					disabled={isSubmitting}
				/>
				{mode === "new" && (
					<div className="shrink-0 @min-lg/compose:px-6 px-4 pb-4">
						<DraftAttachmentField disabled={isSubmitting} />
					</div>
				)}
				{feedbackContent}
			</div>
			<footer className="flex shrink-0 justify-end border-border border-t bg-background @min-lg/compose:px-6 px-4 py-3">
				<Button
					type="submit"
					variant={saveVariant}
					aria-label={
						isSubmitting ? `${saveLabel}, saving` : undefined
					}
					className="h-auto min-h-11 @min-lg/compose:w-auto w-full whitespace-normal"
					disabled={isSaveDisabled}
				>
					{isSubmitting && <Spinner aria-label="Saving draft" />}
					{saveLabel}
				</Button>
			</footer>
		</Form>
	);
}
