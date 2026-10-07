import { useEffect } from "react";
import { usePixel } from "@semoss/sdk/react";
import type { UseFormReturn } from "@semoss/ui/next";
import type { EmailDraftValues } from "../api/email-draft-values";
import {
	type ReplyRecipients,
	replyRecipientsPixel,
	replyRecipientsResponseSchema,
} from "../api/reply-recipients";

export interface ReplyRecipientsState {
	/** Saving and address editing wait until the original envelope is resolved. */
	isReady: boolean;
	error?: string;
	retry: () => void;
}

/** Initialize only the envelope; the host retains initialization across view lifetimes. */
export function useReplyRecipients({
	form,
	sourceUid,
	insightId,
	isEnabled,
	isInitialized,
	onInitialized,
}: {
	form: UseFormReturn<EmailDraftValues>;
	sourceUid?: string;
	insightId?: string;
	isEnabled: boolean;
	isInitialized: boolean;
	onInitialized: (recipients: ReplyRecipients) => void;
}): ReplyRecipientsState {
	const result = usePixel<unknown>(
		isEnabled && !isInitialized && sourceUid
			? replyRecipientsPixel(sourceUid)
			: "",
		undefined,
		insightId,
	);
	useEffect(() => {
		if (!isEnabled || isInitialized || result.status !== "SUCCESS") return;
		const parsed = replyRecipientsResponseSchema.safeParse(result.data);
		if (!parsed.success || parsed.data.uid !== sourceUid) return;
		const recipients = parsed.data.replyRecipients;
		// A dialog's portal can mount its fields after the read resolves. Reset the
		// complete current value so initialization also works before registration.
		// lists the assistant already set win, as in EmailDraftEditor.initializeReplyRecipients
		const current = form.getValues();
		form.reset(
			{
				...current,
				to: current.to || recipients.to.join(", "),
				cc: current.cc || recipients.cc.join(", "),
			},
			{ keepDirty: true, keepErrors: true, keepTouched: true },
		);
		onInitialized(recipients);
	}, [
		form,
		isEnabled,
		isInitialized,
		onInitialized,
		result.data,
		result.status,
		sourceUid,
	]);
	let error: string | undefined;
	if (isEnabled && !isInitialized) {
		if (!sourceUid)
			error = "Select the source email before loading recipients.";
		else if (result.status === "ERROR")
			error = result.error?.message || "Could not load reply recipients.";
		else if (result.status === "SUCCESS") {
			const parsed = replyRecipientsResponseSchema.safeParse(result.data);
			if (!parsed.success || parsed.data.uid !== sourceUid)
				error =
					"Reply recipients could not be verified. Try loading them again.";
		}
	}
	return { isReady: isInitialized, error, retry: result.refresh };
}
