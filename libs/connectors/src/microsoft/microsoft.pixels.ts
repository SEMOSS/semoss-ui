import { call, id, text } from "../core/reactor-call";

/*
 * The pixels the Microsoft 365 viewers run. Each Microsoft reactor reads the
 * first value of each key and applies its own default when a key is left out,
 * so optional values that are empty are dropped rather than sent blank.
 */

/** The pixel for each operation a viewer runs. */
export const MICROSOFT_PIXELS = {
	/**
	 * A folder's children, or the drive's top level with no folder. The folder
	 * is named by its ids, or by its path from the drive's top.
	 *
	 * @param options - The folder, its drive, and how many items to read.
	 * @return The pixel.
	 */
	oneDriveListFolder: (options: {
		driveId?: string;
		itemId?: string;
		path?: string;
		limit: number;
	}): string =>
		call("MicrosoftOneDriveListFiles", {
			driveId: id(options.driveId),
			itemId: id(options.itemId),
			path: text(options.path),
			limit: options.limit,
		}),

	/**
	 * Files others shared with the user.
	 *
	 * @param limit - How many items to read.
	 * @return The pixel.
	 */
	oneDriveListShared: (limit: number): string =>
		call("MicrosoftOneDriveListSharedFiles", { limit: limit }),

	/**
	 * Search the user's drive, or what is shared with them.
	 *
	 * @param options - The search, where to look, and how many items to read.
	 * @return The pixel.
	 */
	oneDriveSearch: (options: {
		search: string;
		scope: "drive" | "shared";
		limit: number;
	}): string =>
		call("MicrosoftOneDriveSearchFiles", {
			search: text(options.search),
			scope: options.scope,
			limit: options.limit,
		}),

	/**
	 * Save a drive file into the insight's folder.
	 *
	 * @param options - The file, its drive, and the name to save it as.
	 * @return The pixel.
	 */
	oneDriveDownload: (options: {
		driveId?: string;
		itemId: string;
		fileName: string;
	}): string =>
		call("MicrosoftOneDriveDownloadFile", {
			driveId: id(options.driveId),
			itemId: id(options.itemId),
			fileName: text(options.fileName),
		}),

	/** @return The pixel for the teams the user belongs to. */
	teamsListTeams: (): string => call("MicrosoftTeamsListTeams"),

	/**
	 * A team's channels.
	 *
	 * @param teamId - The team.
	 * @return The pixel.
	 */
	teamsListChannels: (teamId: string): string =>
		call("MicrosoftTeamsListChannels", { teamId: id(teamId) }),

	/**
	 * A channel's newest threads, each with its replies.
	 *
	 * @param options - The channel and how many threads to read.
	 * @return The pixel.
	 */
	teamsListChannelMessages: (options: {
		teamId: string;
		channelId: string;
		limit: number;
	}): string =>
		call("MicrosoftTeamsListChannelMessages", {
			teamId: id(options.teamId),
			channelId: id(options.channelId),
			includeReplies: true,
			limit: options.limit,
		}),

	/**
	 * A folder in a channel's files, or the channel's top level.
	 *
	 * @param options - The channel, and the folder as a path of names.
	 * @return The pixel.
	 */
	teamsListFiles: (options: {
		teamId: string;
		channelId: string;
		folderPath?: string;
	}): string =>
		call("MicrosoftTeamsListFiles", {
			teamId: id(options.teamId),
			channelId: id(options.channelId),
			folderPath: text(options.folderPath),
		}),

	/**
	 * Save a channel file into the insight's folder.
	 *
	 * @param options - The file, its drive, and the name to save it as.
	 * @return The pixel.
	 */
	teamsDownloadFile: (options: {
		itemId: string;
		driveId: string;
		fileName: string;
	}): string =>
		call("MicrosoftTeamsDownloadFile", {
			id: id(options.itemId),
			driveId: id(options.driveId),
			fileName: text(options.fileName),
		}),

	/**
	 * Save a file attached to a Teams message into the insight's folder.
	 *
	 * @param options - Where the message is, the attachment, and the name to
	 * save it as. A chat message names its chat; a channel message names its
	 * team and channel, and a reply its thread's first message.
	 * @return The pixel.
	 */
	teamsDownloadAttachment: (options: {
		chatId?: string;
		teamId?: string;
		channelId?: string;
		messageId: string;
		replyId?: string;
		attachmentId: string;
		fileName: string;
	}): string =>
		call("MicrosoftTeamsDownloadMessageAttachment", {
			chatId: id(options.chatId),
			teamId: id(options.teamId),
			channelId: id(options.channelId),
			messageId: id(options.messageId),
			replyId: id(options.replyId),
			attachmentId: id(options.attachmentId),
			fileName: text(options.fileName),
		}),

	/**
	 * The user's chats, with a copy of each one's newest message.
	 *
	 * @param limit - How many chats to read.
	 * @return The pixel.
	 */
	teamsListChats: (limit: number): string =>
		call("MicrosoftTeamsListChats", {
			limit: limit,
			includeLastMessage: true,
		}),

	/**
	 * A chat's newest messages.
	 *
	 * @param options - The chat and how many messages to read.
	 * @return The pixel.
	 */
	teamsListChatMessages: (options: {
		chatId: string;
		limit: number;
	}): string =>
		call("MicrosoftTeamsListChatMessages", {
			chatId: id(options.chatId),
			limit: options.limit,
		}),
} as const;
