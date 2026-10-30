import { z } from "@semoss/ui/next";
import { tryParseJson } from "@semoss/utility/json";
import type { ConversationTool } from "@/features/messages/types/message";
import { parseRoomFileLink } from "@/features/messages/utils/room-file-link";

/** Something the assistant found that the owner can open beside the chat, by its exact ids. */
export type ShownItem =
	| {
			kind: "thread";
			threadId: string;
			source: "email" | "teams";
			title: string;
			/** One email in the thread, by its stored provider id. */
			messageId?: string;
	  }
	| { kind: "chat"; chatId: string; title: string; webLink?: string }
	| { kind: "file"; path: string; name: string };

const DOWNLOAD_TOOLS = new Set([
	"DownloadAttachment",
	"DownloadDriveFile",
	"DownloadChannelFile",
	"DownloadMessageAttachment",
]);
const OPENABLE_TOOLS = new Set([
	"ShowItem",
	"ReadThread",
	"ListChatMessages",
	...DOWNLOAD_TOOLS,
]);

const id = z.string().trim().min(1);
const source = z.enum(["email", "teams"]);
const shownSchema = z.discriminatedUnion("kind", [
	z.object({
		shown: z.literal(true),
		kind: z.literal("thread"),
		threadId: id,
		source,
		title: z.string().catch(""),
		messageId: id.optional(),
	}),
	z.object({
		shown: z.literal(true),
		kind: z.literal("chat"),
		chatId: id,
		title: z.string().catch(""),
		webLink: z.string().optional(),
	}),
	z.object({ shown: z.literal(true), kind: z.literal("file"), path: id }),
]);
const readSchema = z.object({
	threadId: id.optional(),
	source: z.string().optional(),
	messages: z.array(z.object({ subject: z.string().optional() })).catch([]),
});
const chatPageSchema = z.object({ chatId: id.optional() });
const downloadSchema = z.object({ filePath: id });

/** A finished call that may open something; cheap enough to run on every render. */
export function isOpenableTool(tool: ConversationTool): boolean {
	return (
		tool.status === "COMPLETED" &&
		!tool.error &&
		OPENABLE_TOOLS.has(tool.name)
	);
}

/** A room path as a file the dock can open, refusing traversal and other scopes. */
function roomFile(path: string): ShownItem | null {
	const segments = path.replaceAll("\\", "/").replace(/^\/+/, "").split("/");
	const file = parseRoomFileLink(
		`room://${segments.map(encodeURIComponent).join("/")}`,
	);
	return file ? { kind: "file", ...file } : null;
}

/**
 * What a finished tool call can open beside the chat, from its result rather
 * than from names. Files belong to the room the call ran in, so a child run's
 * download is not this room's file.
 */
export function shownItem(
	tool: ConversationTool,
	roomId?: string,
): ShownItem | null {
	if (!isOpenableTool(tool)) return null;
	const output = tryParseJson(tool.output ?? "");
	const isOtherRoom = Boolean(
		tool.roomId && roomId && tool.roomId !== roomId,
	);
	if (tool.name === "ShowItem") {
		const shown = shownSchema.safeParse(output);
		if (!shown.success) return null;
		const item = shown.data;
		if (item.kind === "file")
			return isOtherRoom ? null : roomFile(item.path);
		if (item.kind === "chat")
			return {
				kind: "chat",
				chatId: item.chatId,
				title: item.title,
				...(item.webLink?.startsWith("https://")
					? { webLink: item.webLink }
					: {}),
			};
		return {
			kind: "thread",
			threadId: item.threadId,
			source: item.source,
			title: item.title,
			...(item.messageId ? { messageId: item.messageId } : {}),
		};
	}
	if (tool.name === "ReadThread") {
		const read = readSchema.safeParse(output);
		const threadId =
			(read.success ? read.data.threadId : undefined) ??
			id.safeParse(tool.arguments.threadId).data;
		// a read that names no source is email; a calendar thread opens nothing
		const kind = source.safeParse(
			(read.success ? read.data.source : undefined) ?? "email",
		);
		if (!threadId || !kind.success) return null;
		// messages come oldest first; the newest subject names the thread
		const subjects = read.success
			? read.data.messages.flatMap((message) =>
					message.subject?.trim() ? [message.subject.trim()] : [],
				)
			: [];
		return {
			kind: "thread",
			threadId,
			source: kind.data,
			title: subjects.at(-1) ?? "",
		};
	}
	if (tool.name === "ListChatMessages") {
		const chatId =
			chatPageSchema.safeParse(output).data?.chatId ??
			id.safeParse(tool.arguments.chatId).data;
		return chatId ? { kind: "chat", chatId, title: "" } : null;
	}
	const download = downloadSchema.safeParse(output);
	return download.success && !isOtherRoom
		? roomFile(download.data.filePath)
		: null;
}
