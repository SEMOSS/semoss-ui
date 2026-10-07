import {
	Alert,
	AlertDescription,
	Button,
	Small,
	Spinner,
} from "@semoss/ui/next";
import type { ReplyRecipientsState } from "../hooks/use-reply-recipients";
import { EmailRecipientField } from "./email-recipient-field";

/** Retained for callers that also know the source sender's display identity. */
export interface EmailReplyContext {
	name?: string;
	address?: string;
}

/** Show the complete editable reply envelope in the compose surface. */
export function EmailReplyField({
	disabled,
	recipients,
}: {
	disabled: boolean;
	recipients: ReplyRecipientsState;
}) {
	return (
		<div>
			{!recipients.isReady &&
				(recipients.error ? (
					<Alert variant="destructive" className="my-2">
						<AlertDescription>
							{recipients.error}
							<Button
								type="button"
								variant="outline"
								className="min-h-11"
								onClick={recipients.retry}
								disabled={disabled}
							>
								Retry loading recipients
							</Button>
						</AlertDescription>
					</Alert>
				) : (
					<div className="flex items-center gap-2 py-3 text-muted-foreground text-sm">
						<Spinner aria-label="Loading reply recipients" />
						<Small>Loading recipients…</Small>
					</div>
				))}
			<EmailRecipientField
				name="to"
				label="To"
				disabled={disabled || !recipients.isReady}
			/>
			<EmailRecipientField
				name="cc"
				label="Cc"
				disabled={disabled || !recipients.isReady}
			/>
		</div>
	);
}
