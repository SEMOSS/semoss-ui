import { z } from "@semoss/ui/next";
import { uploadRoomFiles } from "@/features/rooms/api/upload-room-files";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

/** Metadata shared by topic listings, editors and answer evidence. */
export const topicSourceSchema = z.object({
	sourceId: z.string().min(1),
	version: z.number().int().positive(),
	title: z.string().min(1),
	kind: z.enum(["document", "note", "link"]),
	status: z.string(),
	truncated: z.boolean().optional(),
	fileName: z.string().nullish(),
	url: z.string().nullish(),
	updatedAt: z.string().nullish(),
	topicIds: z.array(z.string()).nullish(),
});

export type TopicSource = z.infer<typeof topicSourceSchema>;

export const topicSourceListSchema = z.object({
	topicId: z.string().nullish(),
	sources: z.array(topicSourceSchema),
});

export const topicSourceDetailSchema = topicSourceSchema.extend({
	content: z.string(),
});

export type TopicSourceDetail = z.infer<typeof topicSourceDetailSchema>;

/** Stable evidence saved with an answer, independent of later source edits. */
export const topicSourceCitationSchema = z.object({
	sourceId: z.string().min(1),
	version: z.number().int().positive(),
	topicId: z.string().min(1),
	title: z.string(),
	excerpt: z.string(),
	locator: z.string(),
	citationId: z.string().min(1),
});

export type TopicSourceCitation = z.infer<typeof topicSourceCitationSchema>;

export interface SaveTopicSource {
	topicId: string;
	sourceId?: string;
	expectedVersion?: number;
	title: string;
	kind: TopicSource["kind"];
	content?: string;
	filePath?: string;
	url?: string;
	roomId?: string;
}

/** Import a temporary upload; Monolith returns paths relative to a virtual '/' root. */
export async function saveTopicDocument(
	actions: InsightActions,
	insightId: string,
	topicId: string,
	file: File,
	source?: TopicSource,
): Promise<string> {
	if (file.size > 10 * 1024 * 1024)
		throw new Error(`${file.name} is over the 10 MB source limit.`);
	const [uploaded] = await uploadRoomFiles(insightId, [file]);
	if (!uploaded) throw new Error("The file upload was not confirmed.");
	return saveTopicSource(actions, {
		topicId,
		kind: "document",
		title: source?.title ?? file.name,
		sourceId: source?.sourceId,
		expectedVersion: source?.version,
		filePath: uploaded.fileLocation.replace(/^\/+/, ""),
	});
}

/** Save only validated acknowledgements; failed saves leave the editor open. */
export async function saveTopicSource(
	actions: InsightActions,
	input: SaveTopicSource,
): Promise<string> {
	const saved = await callPixel(
		actions,
		pixel("BrainSaveTopicSource", { ...input }),
		z.object({ sourceId: z.string().min(1) }),
	);
	if (input.sourceId && saved.sourceId !== input.sourceId)
		throw new Error("The saved source does not match this source.");
	return saved.sourceId;
}

/** Link or unlink a source; unlinking preserves its other topic associations. */
export async function linkTopicSource(
	actions: InsightActions,
	topicId: string,
	sourceId: string,
	remove = false,
): Promise<void> {
	const saved = await callPixel(
		actions,
		pixel("BrainLinkTopicSource", { topicId, sourceId, remove }),
		topicSourceListSchema,
	);
	if (
		saved.topicId !== topicId ||
		saved.sources.some((source) => source.sourceId === sourceId) === remove
	)
		throw new Error(
			"The source link was not confirmed. Refresh and try again.",
		);
}
