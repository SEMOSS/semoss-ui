import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

export const topicFolderSchema = z.object({
	id: z.string(),
	path: z.string(),
	origin: z.string().nullish(),
});
export type TopicFolder = z.infer<typeof topicFolderSchema>;

const mailFolderSchema = z.object({
	id: z.string(),
	name: z.string(),
	path: z.string(),
	total: z.number().default(0),
	topicIds: z.array(z.string()).default([]),
});
export type MailFolder = z.infer<typeof mailFolderSchema>;

const folderListSchema = z.object({ folders: z.array(mailFolderSchema) });

const linkSchema = z.object({
	topicId: z.string(),
	folders: z.array(topicFolderSchema),
	filed: z.number().default(0),
});

/** The Outlook folders the owner made, read on the last import or sync. */
export async function listMailFolders(
	actions: InsightActions,
): Promise<MailFolder[]> {
	return (
		await callPixel(
			actions,
			pixel("BrainListMailFolders"),
			folderListSchema,
		)
	).folders;
}

/** Link a folder to a topic (mail in it is filed there), or remove the link. */
export function linkTopicFolder(
	actions: InsightActions,
	topicId: string,
	folderId: string,
	remove = false,
): Promise<z.infer<typeof linkSchema>> {
	return callPixel(
		actions,
		pixel("BrainLinkTopicFolder", { topicId, folderId, remove }),
		linkSchema,
	);
}
