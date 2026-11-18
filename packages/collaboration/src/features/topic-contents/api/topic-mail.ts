import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

const editedTopicSchema = z.object({ changes: z.array(z.string()) });

/**
 * Files Outlook emails under a topic, by the ids the mailbox lists them with. Brain reads an email it does
 * not hold from the mailbox first, through the owner's rules, and refuses one they keep out or one in a
 * folder it does not read.
 */
export async function addMailToTopic(
	actions: InsightActions,
	topicId: string,
	messageIds: string[],
): Promise<void> {
	await callPixel(
		actions,
		pixel("BrainEditTopic", { topicId, addEmails: messageIds }),
		editedTopicSchema,
	);
}
