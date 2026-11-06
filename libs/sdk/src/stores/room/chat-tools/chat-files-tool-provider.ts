import { MCP_EXECUTION_ASK, MCP_EXECUTION_AUTO } from "../room.constants";
import type { RoomToolCall } from "../room.types";
import type { ClientToolProvider } from "./client-tool-provider";
import { getDefaultToolMode } from "./default-tools";
import {
	buildFolderToolDefinitions,
	executeFolderTool,
	FOLDER_TOOL_NAMES,
	type FolderToolName,
	type FolderToolOutcome,
	isFolderToolName,
	ROOM_FILES_NAME,
} from "./folder-tools";
import { RoomFolderProvider } from "./room-folder";

/** The id of the room's files tools provider. */
export const CHAT_FILES_PROVIDER_ID = "chat-files";

/** How a host names the files tools and what a call acts on, for the user. */
export interface ChatFilesToolLabels {
	/** The tool's title, such as "Read File". */
	title(name: FolderToolName): string;
	/** What a call acts on, such as `reports/q3.md`. */
	summarize(name: FolderToolName, args: Record<string, unknown>): string;
}

/** English labels, for a host without translations. */
const DEFAULT_LABELS: ChatFilesToolLabels = {
	title: (name) =>
		name
			.replace(/^folder_/, "")
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" "),
	summarize: (name, args) => {
		if (name === FOLDER_TOOL_NAMES.SEARCH) {
			return typeof args.query === "string" ? args.query : "";
		}
		if (name === FOLDER_TOOL_NAMES.MOVE) {
			return `${String(args.from ?? "")} → ${String(args.to ?? "")}`;
		}
		return typeof args.path === "string" ? args.path : "";
	},
};

/** The engine fields a files tool's metadata leaves empty. */
const EMPTY_ENGINE_META = {
	SMSS_ENGINE_NAME: "",
	SMSS_ENGINE_ID: "",
	SMSS_ENGINE_TYPE: "",
	SMSS_PROJECT_NAME: "",
	SMSS_PROJECT_ID: "",
};

/**
 * Whether a tool call is one of the room's files tools.
 *
 * Matched by name as well as by the client tool flag: a chat turn's calls
 * come back from the model with no metadata at all, while an agent run's
 * carry the metadata the harness was given.
 *
 * @param call - The tool call.
 * @returns True for files tool calls.
 */
export const isFolderToolCall = (call: RoomToolCall): boolean =>
	isFolderToolName(call.name) || call._meta?.SMSS_CLIENT_TOOL === true;

/**
 * The text a files tool result is saved as.
 *
 * Results travel inside a pixel `<encode>` block, which a file containing the
 * literal closing marker would end early. JSON may escape `/` as `\/`, so the
 * marker is escaped in the successful, JSON, form; an error is plain text
 * and has the marker broken up the same way.
 *
 * @param outcome - The call's outcome.
 * @returns The text to save.
 */
export const toToolResponseText = (outcome: FolderToolOutcome): string =>
	(outcome.isError
		? String(outcome.payload.error)
		: JSON.stringify(outcome.payload)
	).replace(/<\/encode>/gi, "<\\/encode>");

/**
 * The room's files tools — list, read, search, write, move, delete — run on
 * the client against the room's own folder through the insight asset pixels.
 * Each room's settings (`defaultTools`) say which run on their own, which ask,
 * and which are disabled: by default reading runs on its own and every change
 * asks. Agent rooms get none; their runs bring their own file tools.
 *
 * @param options.labels - How the tools and calls are named for the user;
 * English by default.
 * @returns The provider.
 */
export const createChatFilesToolProvider = (
	options: { labels?: ChatFilesToolLabels } = {},
): ClientToolProvider => {
	const labels = options.labels ?? DEFAULT_LABELS;

	return {
		id: CHAT_FILES_PROVIDER_ID,
		getTools: (room) =>
			room.mode === "agent"
				? []
				: buildFolderToolDefinitions({
						executionOf: (name) => {
							const mode = getDefaultToolMode(
								room.options.defaultTools,
								name,
							);
							return mode === "disabled" ? null : mode;
						},
					}),
		canHandle: isFolderToolCall,
		policy: (name, room) =>
			isFolderToolName(name)
				? getDefaultToolMode(room.options.defaultTools, name)
				: "auto",
		decorateToolCall: (call, room) => {
			if (!isFolderToolCall(call) || !isFolderToolName(call.name)) {
				return call;
			}
			const holdsForUser =
				getDefaultToolMode(room.options.defaultTools, call.name) !==
				"auto";
			return {
				...call,
				title: labels.title(call.name),
				description: labels.summarize(call.name, call.arguments ?? {}),
				_meta: {
					...EMPTY_ENGINE_META,
					...call._meta,
					SMSS_MCP_EXECUTION: holdsForUser
						? MCP_EXECUTION_ASK
						: MCP_EXECUTION_AUTO,
					SMSS_CLIENT_TOOL: true,
					SMSS_MCP_UI: holdsForUser
						? { displayLocation: "inline", autoOpen: true }
						: { displayLocation: "sidebar" },
				},
			};
		},
		execute: async (call, room) => {
			const outcome = await runFolderCall(
				room,
				call.name,
				call.arguments ?? {},
			);
			return {
				output: toToolResponseText(outcome),
				isError: outcome.isError,
			};
		},
	};
};

/**
 * Run a files call against the room's folder. Never throws.
 *
 * @param room - The room, bound to its insight.
 * @param name - The tool the model called.
 * @param args - The call's arguments.
 * @returns The outcome, in the shape the model reads back.
 */
export const runFolderCall = async (
	room: Parameters<ClientToolProvider["execute"]>[1],
	name: string,
	args: Record<string, unknown>,
): Promise<FolderToolOutcome> => {
	if (!isFolderToolName(name)) {
		return failure(`Unknown tool ${name}.`);
	}
	if (getDefaultToolMode(room.options.defaultTools, name) === "disabled") {
		return failure(
			`${name} is disabled in this chat's settings. Ask the user to allow it in Settings if they want this done.`,
		);
	}

	const folder = new RoomFolderProvider(async (pixel) => {
		const response = await room.runRoomPixel<[unknown]>(
			pixel,
			false,
			false,
		);
		return response.pixelReturn[0]?.output;
	});
	const outcome = await executeFolderTool(
		folder,
		name,
		args,
		ROOM_FILES_NAME,
	);
	if (!outcome.isError && outcome.changes.length > 0) {
		room.refreshFiles();
	}
	return outcome;
};

/**
 * A failed call, in the shape the model reads back.
 *
 * @param message - Why it failed.
 * @returns The outcome.
 */
const failure = (message: string): FolderToolOutcome => ({
	isError: true,
	payload: { error: message },
	changes: [],
});
