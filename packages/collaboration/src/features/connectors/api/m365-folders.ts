import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

export const topicM365FolderSchema = z.object({
	linkId: z.string(),
	kind: z.enum(["drive_folder", "channel_files"]),
	displayName: z.string(),
	driveId: z.string().optional().nullable(),
	itemId: z.string().optional().nullable(),
	teamId: z.string().optional().nullable(),
	channelId: z.string().optional().nullable(),
	siteId: z.string().optional().nullable(),
	webUrl: z.string().optional().nullable(),
	state: z.enum(["ok", "no_access"]),
	checkedAt: z.string().optional().nullable(),
});
export type TopicM365Folder = z.infer<typeof topicM365FolderSchema>;

const folderPointerSchema = z.object({
	kind: z.enum(["drive_folder", "channel_files"]),
	displayName: z.string(),
	linkId: z.string().optional(),
	driveId: z.string().optional(),
	itemId: z.string().optional(),
	teamId: z.string().optional(),
	channelId: z.string().optional(),
	siteId: z.string().optional(),
	webUrl: z.string().optional(),
});
export type FolderPointer = z.infer<typeof folderPointerSchema>;

// OneDrive folder browser
const oneDriveFolderSchema = z.object({
	id: z.string(),
	name: z.string(),
	driveId: z.string(),
	itemId: z.string(),
	webUrl: z.string().optional(),
});
export type OneDriveFolder = z.infer<typeof oneDriveFolderSchema>;

const oneDriveFoldersSchema = z.object({
	files: z.array(oneDriveFolderSchema),
});

// Teams browser
const teamSchema = z.object({
	id: z.string(),
	displayName: z.string(),
});
export type Team = z.infer<typeof teamSchema>;

const teamsListSchema = z.object({
	teams: z.array(teamSchema),
});

const teamChannelSchema = z.object({
	id: z.string(),
	displayName: z.string(),
	webUrl: z.string().optional(),
});
export type TeamChannel = z.infer<typeof teamChannelSchema>;

const channelsListSchema = z.object({
	channels: z.array(teamChannelSchema),
});

const listLinksSchema = z.object({
	topicId: z.string(),
	folders: z.array(topicM365FolderSchema),
});

const linkResultSchema = z.object({
	topicId: z.string(),
	folders: z.array(topicM365FolderSchema),
});

/** List the M365 folders linked to a topic (OneDrive, Teams channels). */
export async function listTopicM365Folders(
	actions: InsightActions,
	topicId: string,
): Promise<TopicM365Folder[]> {
	return (
		await callPixel(
			actions,
			pixel("BrainListTopicM365Folders", { topicId }),
			listLinksSchema,
		)
	).folders;
}

/** List OneDrive folders available to the user (from their drive and shared folders). */
export async function listAvailableOneDriveFolders(
	actions: InsightActions,
): Promise<OneDriveFolder[]> {
	return (
		await callPixel(
			actions,
			pixel("MicrosoftOneDriveListFiles"),
			oneDriveFoldersSchema,
		)
	).files;
}

/** List Microsoft Teams available to the user. */
export async function listAvailableTeams(
	actions: InsightActions,
): Promise<Team[]> {
	return (
		await callPixel(
			actions,
			pixel("MicrosoftTeamsListTeams"),
			teamsListSchema,
		)
	).teams;
}

/** List channels in a Microsoft Teams team. */
export async function listTeamChannels(
	actions: InsightActions,
	teamId: string,
): Promise<TeamChannel[]> {
	return (
		await callPixel(
			actions,
			pixel("MicrosoftTeamsListChannels", { teamId }),
			channelsListSchema,
		)
	).channels;
}

/** Link an M365 folder (OneDrive or Teams channel) to a topic. */
export function linkTopicM365Folder(
	actions: InsightActions,
	topicId: string,
	folder: FolderPointer,
): Promise<TopicM365Folder[]> {
	return callPixel(
		actions,
		pixel("BrainLinkTopicM365Folder", { topicId, ...folder }),
		linkResultSchema,
	).then((result) => result.folders);
}

/** Unlink an M365 folder from a topic. */
export function unlinkTopicM365Folder(
	actions: InsightActions,
	topicId: string,
	linkId: string,
): Promise<TopicM365Folder[]> {
	return callPixel(
		actions,
		pixel("BrainLinkTopicM365Folder", { topicId, linkId, remove: true }),
		linkResultSchema,
	).then((result) => result.folders);
}
