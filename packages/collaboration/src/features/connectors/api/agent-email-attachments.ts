import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

export const emailAttachmentSchema = z.object({
	path: z.string().startsWith(".email-attachments/").max(4000),
	name: z
		.string()
		.min(1)
		.max(1000)
		.refine((name) => !/[\\/]/.test(name)),
	size: z.number().int().min(0).max(2_500_000),
	sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
export type AgentEmailAttachment = z.infer<typeof emailAttachmentSchema>;
const receiptSchema = emailAttachmentSchema.omit({ sha256: true }).extend({
	contentBase64: z.string().max(3_333_336),
});

/** File bytes go directly to the editor, without entering the model's tool history. */
export async function readAgentEmailAttachment(
	actions: InsightActions,
	attachment: AgentEmailAttachment,
): Promise<File> {
	const receipt = await callPixel(
		actions,
		pixel("WorkReadEmailAttachment", {
			path: attachment.path,
			sha256: attachment.sha256,
		}),
		receiptSchema,
	);
	if (
		receipt.path !== attachment.path ||
		receipt.name !== attachment.name ||
		receipt.size !== attachment.size
	)
		throw new Error(
			"The prepared email attachment could not be confirmed.",
		);
	const bytes = Uint8Array.from(atob(receipt.contentBase64), (c) =>
		c.charCodeAt(0),
	);
	if (bytes.length !== attachment.size)
		throw new Error(
			"The email attachment was incomplete. Ask the assistant to attach it again.",
		);
	return new File([bytes], attachment.name);
}
