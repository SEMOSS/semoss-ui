import { getErrorMessage } from "@semoss/utility/error";
import { getFileExtension } from "@semoss/utility/file";
import { createNameMatcher, normalizeFolderPath } from "../folders/folder-path";
import {
	decodeTextFile,
	FolderToolError,
	isBinaryFileName,
	replaceFileText,
	sliceTextLines,
} from "../folders/folder-text";
import type {
	FolderChange,
	FolderEntry,
	WorkFolderProvider,
} from "../folders/work-folder.types";

/**
 * The tools a work folder gives the assistant. The names are what the model
 * calls, so they are part of every conversation's history: renaming one
 * strands the calls already made under the old name.
 */
export const FOLDER_TOOL_NAMES = {
	LIST: "folder_list",
	READ: "folder_read",
	SEARCH: "folder_search",
	WRITE: "folder_write",
	EDIT: "folder_edit",
	CREATE_DIRECTORY: "folder_create_directory",
	MOVE: "folder_move",
	DELETE: "folder_delete",
} as const;

/** One of the work folder tools. */
export type FolderToolName =
	(typeof FOLDER_TOOL_NAMES)[keyof typeof FOLDER_TOOL_NAMES];

/** How a tool call runs: on its own, or once the user approves it. */
export type FolderToolExecution = "auto" | "ask";

/** A tool definition in the MCP shape the room accepts in `paramValues.tools`. */
export interface FolderToolDefinition {
	name: FolderToolName;
	title: string;
	description: string;
	inputSchema: {
		type: "object";
		properties: Record<string, Record<string, unknown>>;
		required: string[];
	};
}

/** The result of one tool call, in the shape the model reads it back. */
export interface FolderToolOutcome {
	/** Whether the call failed. */
	isError: boolean;
	/** The result, or `{ error }` describing the failure. */
	payload: Record<string, unknown>;
	/** What the call changed in the folder. Empty for reads and failures. */
	changes: FolderChange[];
}

const ALL_FOLDER_TOOLS: readonly string[] = Object.values(FOLDER_TOOL_NAMES);

const READ_TOOLS: ReadonlySet<FolderToolName> = new Set([
	FOLDER_TOOL_NAMES.LIST,
	FOLDER_TOOL_NAMES.READ,
	FOLDER_TOOL_NAMES.SEARCH,
]);

/**
 * Folders a recursive listing or search walks past. They are still listed by
 * name; the walk just does not descend into them, since they are rarely what
 * the user means and can hold hundreds of thousands of files.
 */
const SKIPPED_DIRECTORIES = new Set([
	".git",
	".hg",
	".svn",
	".venv",
	"__pycache__",
	"node_modules",
]);

const MAX_LIST_ENTRIES = 500;
const MAX_LIST_DEPTH = 3;
const DEFAULT_READ_LINES = 2000;
const MAX_READ_CHARS = 60_000;
const MAX_READ_BYTES = 10 * 1024 * 1024;
const DEFAULT_SEARCH_RESULTS = 50;
const MAX_SEARCH_RESULTS = 200;
const MAX_SEARCH_SCANNED_ENTRIES = 5000;
const MAX_CONTENT_SEARCH_FILES = 300;
const MAX_CONTENT_SEARCH_BYTES = 1024 * 1024;
const MAX_CONTENT_PREVIEW_CHARS = 200;
const MAX_WRITE_CHARS = 2_000_000;

/**
 * Whether a tool call name is one of the work folder tools.
 *
 * @param name - The name the model called.
 * @return True for the folder tools.
 */
export const isFolderToolName = (name: string): name is FolderToolName =>
	ALL_FOLDER_TOOLS.includes(name);

/**
 * Whether a folder tool changes the folder rather than only reading it.
 *
 * @param name - A folder tool.
 * @return True for writes, edits, moves, deletions, and new folders.
 */
export const isFolderChangeTool = (name: FolderToolName): boolean =>
	!READ_TOOLS.has(name);

/**
 * How a folder tool runs when nothing says otherwise: reading on its own, and
 * every change once the user approves it.
 *
 * @param name - A folder tool.
 * @return The execution mode.
 */
export const getUsualFolderToolExecution = (
	name: FolderToolName,
): FolderToolExecution => (READ_TOOLS.has(name) ? "auto" : "ask");

/** How the tools name the chat's own files, the room's folder. */
export const ROOM_FILES_NAME = "Chat Files";

/** What the definitions need to know. */
export interface FolderToolContext {
	/**
	 * How each tool runs, or null to leave it out of the definitions
	 * altogether.
	 */
	executionOf: (name: FolderToolName) => FolderToolExecution | null;
}

/** The folder, the way the model should refer to it wherever a tool names it. */
const FOLDER_DESCRIPTION = `${ROOM_FILES_NAME} (this chat's own files)`;

/**
 * How the folder relates to the files the chat's other tools use, so the
 * model knows they see what it writes.
 */
const FOLDER_SCOPE =
	"These are the same files the user uploads and saves to the chat, and the chat's other tools read and write them too, so a file written here is where those tools look.";

const PATH_PROPERTY = {
	type: "string",
	description:
		"Path relative to the work folder root, using forward slashes, such as reports/q3.md.",
};

/**
 * What the model is told about a tool that waits for the user, so it keeps
 * each such call small and expects a person in the loop.
 *
 * @param name - A folder tool that asks first.
 * @return The sentence to add to its description.
 */
const describeApproval = (name: FolderToolName): string => {
	if (name === FOLDER_TOOL_NAMES.DELETE) {
		return " The user approves every deletion before it happens.";
	}
	return READ_TOOLS.has(name)
		? " The user approves each call before it runs."
		: " The user reviews each change before it runs, so make one focused change per call.";
};

/**
 * The folder tools the model may call, each described the way it runs. The
 * browser decides which calls to run and which to hold for the user, so the
 * definitions carry no execution mode of their own.
 *
 * @param context - How each tool runs.
 * @return The definitions to send with the turn.
 */
export const buildFolderToolDefinitions = (
	context: FolderToolContext,
): FolderToolDefinition[] => {
	const definitions: FolderToolDefinition[] = [
		{
			name: FOLDER_TOOL_NAMES.LIST,
			title: "List Folder",
			description: `List the files and folders in ${FOLDER_DESCRIPTION}. Paths are relative to the folder root and use forward slashes; leave path empty for the root. Set depth to 2 or 3 to include nested folders. ${FOLDER_SCOPE}`,
			inputSchema: {
				type: "object",
				properties: {
					path: {
						...PATH_PROPERTY,
						description:
							"Folder to list, relative to the work folder root. Leave empty for the root.",
					},
					depth: {
						type: "integer",
						minimum: 1,
						maximum: MAX_LIST_DEPTH,
						description:
							"How many levels to include. Defaults to 1.",
					},
				},
				required: [],
			},
		},
		{
			name: FOLDER_TOOL_NAMES.READ,
			title: "Read File",
			description: `Read a text file from ${FOLDER_DESCRIPTION}. Returns up to ${DEFAULT_READ_LINES} lines per call; use offset and limit to read further. PDFs, images, and Office documents cannot be read as text, so ask the user to attach those to the chat instead.`,
			inputSchema: {
				type: "object",
				properties: {
					path: PATH_PROPERTY,
					offset: {
						type: "integer",
						minimum: 1,
						description: "First line to read, counting from 1.",
					},
					limit: {
						type: "integer",
						minimum: 1,
						description: `Most lines to read. Defaults to ${DEFAULT_READ_LINES}.`,
					},
				},
				required: ["path"],
			},
		},
		{
			name: FOLDER_TOOL_NAMES.SEARCH,
			title: "Search Folder",
			description: `Find files and folders in ${FOLDER_DESCRIPTION} whose names contain the query, ignoring case. Use * as a wildcard, for example *.md. Set content to true to also find text files that contain the query as plain text.`,
			inputSchema: {
				type: "object",
				properties: {
					query: {
						type: "string",
						description: "Text or wildcard pattern to look for.",
					},
					path: {
						...PATH_PROPERTY,
						description:
							"Folder to search in, relative to the work folder root. Leave empty to search everything.",
					},
					content: {
						type: "boolean",
						description: "Also search inside text files.",
					},
					limit: {
						type: "integer",
						minimum: 1,
						maximum: MAX_SEARCH_RESULTS,
						description: `Most matches to return. Defaults to ${DEFAULT_SEARCH_RESULTS}.`,
					},
				},
				required: ["query"],
			},
		},
		{
			name: FOLDER_TOOL_NAMES.WRITE,
			title: "Write File",
			description: `Create a text file in ${FOLDER_DESCRIPTION}, or replace the entire contents of an existing file. Missing parent folders are created. For a small change to an existing file, use folder_edit instead.`,
			inputSchema: {
				type: "object",
				properties: {
					path: PATH_PROPERTY,
					content: {
						type: "string",
						description: "The complete contents of the file.",
					},
				},
				required: ["path", "content"],
			},
		},
		{
			name: FOLDER_TOOL_NAMES.EDIT,
			title: "Edit File",
			description: `Replace exact text in a text file in ${FOLDER_DESCRIPTION}. old_text must match the file exactly, including whitespace and line breaks, and must appear once unless replace_all is true. Read the file before editing it.`,
			inputSchema: {
				type: "object",
				properties: {
					path: PATH_PROPERTY,
					old_text: {
						type: "string",
						description: "The exact text to replace.",
					},
					new_text: {
						type: "string",
						description: "The text to put in its place.",
					},
					replace_all: {
						type: "boolean",
						description:
							"Replace every occurrence instead of exactly one.",
					},
				},
				required: ["path", "old_text", "new_text"],
			},
		},
		{
			name: FOLDER_TOOL_NAMES.CREATE_DIRECTORY,
			title: "Create Folder",
			description: `Create a folder in ${FOLDER_DESCRIPTION}, along with any missing parent folders.`,
			inputSchema: {
				type: "object",
				properties: { path: PATH_PROPERTY },
				required: ["path"],
			},
		},
		{
			name: FOLDER_TOOL_NAMES.MOVE,
			title: "Move or Rename",
			description: `Move or rename a file or folder within ${FOLDER_DESCRIPTION}. The destination must not already exist.`,
			inputSchema: {
				type: "object",
				properties: {
					from: {
						...PATH_PROPERTY,
						description: "Current path of the file or folder.",
					},
					to: {
						...PATH_PROPERTY,
						description: "New path, including the new name.",
					},
				},
				required: ["from", "to"],
			},
		},
		{
			name: FOLDER_TOOL_NAMES.DELETE,
			title: "Delete",
			description: `Delete a file from ${FOLDER_DESCRIPTION}, or a folder when recursive is true.`,
			inputSchema: {
				type: "object",
				properties: {
					path: PATH_PROPERTY,
					recursive: {
						type: "boolean",
						description:
							"Required to delete a folder that still has contents.",
					},
				},
				required: ["path"],
			},
		},
	];

	return definitions.reduce<FolderToolDefinition[]>((offered, definition) => {
		const execution = context.executionOf(definition.name);
		if (!execution) {
			return offered;
		}
		offered.push({
			...definition,
			description:
				execution === "ask"
					? `${definition.description}${describeApproval(definition.name)}`
					: definition.description,
		});
		return offered;
	}, []);
};

/**
 * A required path argument, normalized.
 *
 * @param args - The call's arguments.
 * @param key - Which argument.
 * @return The path. The root is refused, since every tool that requires a
 * path means an entry inside the folder.
 */
const readRequiredPath = (
	args: Record<string, unknown>,
	key: string,
): string => {
	const path = normalizeFolderPath(args[key]);
	if (!path) {
		throw new FolderToolError(
			`${key} is required and must name something inside the work folder.`,
		);
	}
	return path;
};

/**
 * A whole number argument, clamped to its range. Accepts numeric strings,
 * since models sometimes quote numbers.
 *
 * @param value - The raw argument.
 * @param fallback - Used when the argument is missing or not a number.
 * @param min - Smallest allowed value.
 * @param max - Largest allowed value.
 * @return The number.
 */
const readInteger = (
	value: unknown,
	fallback: number,
	min: number,
	max: number,
): number => {
	const parsed =
		typeof value === "number"
			? value
			: typeof value === "string" && value.trim()
				? Number(value)
				: Number.NaN;
	if (!Number.isFinite(parsed)) {
		return fallback;
	}
	return Math.min(max, Math.max(min, Math.floor(parsed)));
};

/**
 * A boolean argument. Accepts `"true"`, since models sometimes quote booleans.
 *
 * @param value - The raw argument.
 * @return True only for `true` or `"true"`.
 */
const readBoolean = (value: unknown): boolean =>
	value === true || value === "true";

/**
 * A required string argument. An empty string is allowed.
 *
 * @param args - The call's arguments.
 * @param key - Which argument.
 * @return The string.
 */
const readRequiredString = (
	args: Record<string, unknown>,
	key: string,
): string => {
	const value = args[key];
	if (typeof value !== "string") {
		throw new FolderToolError(`${key} is required and must be text.`);
	}
	return value;
};

/**
 * Read a file as text for a tool, refusing binary files with a reason the
 * model can pass on.
 *
 * @param provider - The folder.
 * @param path - A normalized file path.
 * @return The text.
 */
const readTextFile = async (
	provider: WorkFolderProvider,
	path: string,
): Promise<string> => {
	const entry = await provider.stat(path);
	if (!entry) {
		throw new FolderToolError(`No file exists at ${path}.`);
	}
	if (entry.kind === "directory") {
		throw new FolderToolError(
			`${path} is a folder. Use folder_list to see what it holds.`,
		);
	}
	if (isBinaryFileName(path)) {
		throw new FolderToolError(
			`${path} is a ${getFileExtension(path).toUpperCase()} file, which cannot be read as text. Ask the user to attach it to the chat so its contents are shared with you.`,
		);
	}
	if (entry.size !== undefined && entry.size > MAX_READ_BYTES) {
		throw new FolderToolError(
			`${path} is too large to read (${entry.size} bytes).`,
		);
	}

	const blob = await provider.readFile(path);
	if (blob.size > MAX_READ_BYTES) {
		throw new FolderToolError(
			`${path} is too large to read (${blob.size} bytes).`,
		);
	}
	const text = decodeTextFile(new Uint8Array(await blob.arrayBuffer()));
	if (text === null) {
		throw new FolderToolError(
			`${path} is not a text file. Ask the user to attach it to the chat so its contents are shared with you.`,
		);
	}
	return text;
};

/**
 * The shape one entry takes in a listing or search result.
 *
 * @param entry - The entry.
 * @return A compact row for the model.
 */
const toResultRow = (entry: FolderEntry): Record<string, unknown> => ({
	path: entry.path,
	type: entry.kind,
	...(entry.size !== undefined ? { size: entry.size } : {}),
	...(entry.modified ? { modified: entry.modified } : {}),
});

const now = (): string => new Date().toISOString();

/**
 * Turn whatever a tool call threw into a sentence the model can act on.
 *
 * @param error - What was thrown.
 * @return The explanation.
 */
export const describeFolderError = (error: unknown): string =>
	getErrorMessage(error, "") || "The operation failed.";

/**
 * Run one folder tool call.
 *
 * Never throws: a failure comes back as an outcome with `isError`, carrying
 * an explanation the model reads as the tool result.
 *
 * @param provider - The folder to act on.
 * @param name - The tool the model called.
 * @param args - The call's arguments.
 * @param folderName - The folder's name, echoed in listings.
 * @return The outcome.
 */
export const executeFolderTool = async (
	provider: WorkFolderProvider,
	name: FolderToolName,
	args: Record<string, unknown>,
	folderName: string,
): Promise<FolderToolOutcome> => {
	try {
		switch (name) {
			case FOLDER_TOOL_NAMES.LIST:
				return await listFolder(provider, args, folderName);
			case FOLDER_TOOL_NAMES.READ:
				return await readFile(provider, args);
			case FOLDER_TOOL_NAMES.SEARCH:
				return await searchFolder(provider, args);
			case FOLDER_TOOL_NAMES.WRITE:
				return await writeFile(provider, args);
			case FOLDER_TOOL_NAMES.EDIT:
				return await editFile(provider, args);
			case FOLDER_TOOL_NAMES.CREATE_DIRECTORY:
				return await createDirectory(provider, args);
			case FOLDER_TOOL_NAMES.MOVE:
				return await moveEntry(provider, args);
			case FOLDER_TOOL_NAMES.DELETE:
				return await deleteEntry(provider, args);
			default:
				throw new FolderToolError(`Unknown tool ${name}.`);
		}
	} catch (error) {
		return {
			isError: true,
			payload: { error: describeFolderError(error) },
			changes: [],
		};
	}
};

const listFolder = async (
	provider: WorkFolderProvider,
	args: Record<string, unknown>,
	folderName: string,
): Promise<FolderToolOutcome> => {
	const path = normalizeFolderPath(args.path);
	const depth = readInteger(args.depth, 1, 1, MAX_LIST_DEPTH);

	const root = await provider.stat(path);
	if (!root) {
		throw new FolderToolError(`No folder exists at ${path}.`);
	}
	if (root.kind !== "directory") {
		throw new FolderToolError(
			`${path} is a file. Use folder_read to read it.`,
		);
	}

	const entries: FolderEntry[] = [];
	let truncated = false;

	const walk = async (directory: string, level: number): Promise<void> => {
		for (const entry of await provider.list(directory)) {
			if (entries.length >= MAX_LIST_ENTRIES) {
				truncated = true;
				return;
			}
			entries.push(entry);
			if (
				entry.kind === "directory" &&
				level < depth &&
				!SKIPPED_DIRECTORIES.has(entry.name)
			) {
				await walk(entry.path, level + 1);
			}
		}
	};
	await walk(path, 1);

	return {
		isError: false,
		payload: {
			folder: folderName,
			path: path || "/",
			entries: entries.map(toResultRow),
			truncated: truncated,
			...(truncated
				? {
						note: `Only the first ${MAX_LIST_ENTRIES} entries are shown. List a subfolder to see more.`,
					}
				: {}),
		},
		changes: [],
	};
};

const readFile = async (
	provider: WorkFolderProvider,
	args: Record<string, unknown>,
): Promise<FolderToolOutcome> => {
	const path = readRequiredPath(args, "path");
	const offset = readInteger(args.offset, 1, 1, Number.MAX_SAFE_INTEGER);
	const limit = readInteger(
		args.limit,
		DEFAULT_READ_LINES,
		1,
		DEFAULT_READ_LINES,
	);

	const text = await readTextFile(provider, path);
	const slice = sliceTextLines(text, offset, limit, MAX_READ_CHARS);

	return {
		isError: false,
		payload: {
			path: path,
			total_lines: slice.totalLines,
			start_line: slice.startLine,
			end_line: slice.endLine,
			truncated: slice.truncated,
			...(slice.truncated
				? {
						note: `Call folder_read with offset ${slice.endLine + 1} to continue.`,
					}
				: {}),
			content: slice.content,
		},
		changes: [],
	};
};

const searchFolder = async (
	provider: WorkFolderProvider,
	args: Record<string, unknown>,
): Promise<FolderToolOutcome> => {
	const query = readRequiredString(args, "query").trim();
	if (!query) {
		throw new FolderToolError("query cannot be empty.");
	}
	const path = normalizeFolderPath(args.path);
	const searchContent = readBoolean(args.content);
	const limit = readInteger(
		args.limit,
		DEFAULT_SEARCH_RESULTS,
		1,
		MAX_SEARCH_RESULTS,
	);

	const matchesName = createNameMatcher(query);
	const needle = query.toLowerCase();
	const matches: Record<string, unknown>[] = [];
	const queue: string[] = [path];
	let scanned = 0;
	let contentFilesRead = 0;
	let truncated = false;

	while (queue.length > 0 && !truncated) {
		const directory = queue.shift() ?? "";
		for (const entry of await provider.list(directory)) {
			scanned++;
			if (
				scanned > MAX_SEARCH_SCANNED_ENTRIES ||
				matches.length >= limit
			) {
				truncated = true;
				break;
			}

			if (matchesName(entry.name)) {
				matches.push(toResultRow(entry));
			} else if (
				searchContent &&
				entry.kind === "file" &&
				!isBinaryFileName(entry.name) &&
				(entry.size === undefined ||
					entry.size <= MAX_CONTENT_SEARCH_BYTES) &&
				contentFilesRead < MAX_CONTENT_SEARCH_FILES
			) {
				contentFilesRead++;
				const blob = await provider
					.readFile(entry.path)
					.catch(() => null);
				const text =
					blob && blob.size <= MAX_CONTENT_SEARCH_BYTES
						? decodeTextFile(
								new Uint8Array(await blob.arrayBuffer()),
							)
						: null;
				const lines = text?.split(/\r?\n/) ?? [];
				const lineIndex = lines.findIndex((line) =>
					line.toLowerCase().includes(needle),
				);
				if (lineIndex !== -1) {
					matches.push({
						...toResultRow(entry),
						line: lineIndex + 1,
						preview: lines[lineIndex]
							.trim()
							.slice(0, MAX_CONTENT_PREVIEW_CHARS),
					});
				}
			}

			if (
				entry.kind === "directory" &&
				!SKIPPED_DIRECTORIES.has(entry.name)
			) {
				queue.push(entry.path);
			}
		}
	}

	return {
		isError: false,
		payload: {
			query: query,
			path: path || "/",
			matches: matches,
			truncated: truncated,
			...(truncated
				? {
						note: "The search stopped early. Narrow it with a more specific query or path.",
					}
				: {}),
		},
		changes: [],
	};
};

const writeFile = async (
	provider: WorkFolderProvider,
	args: Record<string, unknown>,
): Promise<FolderToolOutcome> => {
	const path = readRequiredPath(args, "path");
	const content = readRequiredString(args, "content");
	if (content.length > MAX_WRITE_CHARS) {
		throw new FolderToolError(
			`The content is too long to write in one call (${content.length} characters).`,
		);
	}

	const existing = await provider.stat(path);
	if (existing?.kind === "directory") {
		throw new FolderToolError(`${path} is a folder, not a file.`);
	}

	await provider.writeText(path, content);

	return {
		isError: false,
		payload: {
			path: path,
			bytes: new TextEncoder().encode(content).length,
			created: !existing,
		},
		changes: [
			{ path: path, kind: existing ? "modified" : "created", at: now() },
		],
	};
};

const editFile = async (
	provider: WorkFolderProvider,
	args: Record<string, unknown>,
): Promise<FolderToolOutcome> => {
	const path = readRequiredPath(args, "path");
	const oldText = readRequiredString(args, "old_text");
	const newText = readRequiredString(args, "new_text");
	const replaceAll = readBoolean(args.replace_all);

	const original = await readTextFile(provider, path);
	const edited = replaceFileText(original, oldText, newText, replaceAll);
	await provider.writeText(path, edited.content);

	return {
		isError: false,
		payload: { path: path, replacements: edited.replacements },
		changes: [{ path: path, kind: "modified", at: now() }],
	};
};

const createDirectory = async (
	provider: WorkFolderProvider,
	args: Record<string, unknown>,
): Promise<FolderToolOutcome> => {
	const path = readRequiredPath(args, "path");

	const existing = await provider.stat(path);
	if (existing?.kind === "file") {
		throw new FolderToolError(`${path} is already a file.`);
	}
	if (existing) {
		return {
			isError: false,
			payload: { path: path, created: false },
			changes: [],
		};
	}

	await provider.createDirectory(path);

	return {
		isError: false,
		payload: { path: path, created: true },
		changes: [{ path: path, kind: "created", at: now() }],
	};
};

const moveEntry = async (
	provider: WorkFolderProvider,
	args: Record<string, unknown>,
): Promise<FolderToolOutcome> => {
	const from = readRequiredPath(args, "from");
	const to = readRequiredPath(args, "to");
	if (from === to) {
		throw new FolderToolError("from and to are the same path.");
	}

	await provider.move(from, to);

	return {
		isError: false,
		payload: { from: from, to: to },
		changes: [{ path: to, kind: "moved", from: from, at: now() }],
	};
};

const deleteEntry = async (
	provider: WorkFolderProvider,
	args: Record<string, unknown>,
): Promise<FolderToolOutcome> => {
	const path = readRequiredPath(args, "path");
	const recursive = readBoolean(args.recursive);

	const entry = await provider.stat(path);
	if (!entry) {
		throw new FolderToolError(`Nothing exists at ${path}.`);
	}
	if (entry.kind === "directory" && !recursive) {
		const children = await provider.list(path);
		if (children.length > 0) {
			throw new FolderToolError(
				`${path} is a folder with ${children.length} entries. Set recursive to true to delete it with its contents.`,
			);
		}
	}

	await provider.remove(path, recursive || entry.kind === "directory");

	return {
		isError: false,
		payload: { path: path, deleted: true },
		changes: [{ path: path, kind: "deleted", at: now() }],
	};
};
