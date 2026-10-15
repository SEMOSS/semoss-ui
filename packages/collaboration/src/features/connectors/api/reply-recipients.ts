import { z } from "@semoss/ui/next";
import { pixel } from "@/lib/pixel";

/** Explicit lists distinguish cleared recipients from provider-selected defaults. */
export const replyRecipientsSchema = z.object({
	to: z.array(z.email()),
	cc: z.array(z.email()),
});
export type ReplyRecipients = z.infer<typeof replyRecipientsSchema>;

/** Read the original envelope independently of assistant context. */
export function replyRecipientsPixel(sourceUid: string): string {
	return pixel("MicrosoftOutlookGetMail", {
		id: sourceUid,
		maxBodyChars: 1,
		includeAttachments: false,
		includeReplyRecipients: true,
	});
}

export const replyRecipientsResponseSchema = z.object({
	id: z.string().min(1),
	replyRecipients: replyRecipientsSchema,
});

/** Compare mailboxes case-insensitively without depending on provider ordering. */
export function sameRecipientAddresses(a: string[], b: string[]): boolean {
	const left = new Set(a.map((address) => address.toLowerCase()));
	const right = new Set(b.map((address) => address.toLowerCase()));
	return (
		left.size === right.size &&
		[...left].every((address) => right.has(address))
	);
}
