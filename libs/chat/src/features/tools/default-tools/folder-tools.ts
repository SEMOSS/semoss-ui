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
import type { FolderEntry, RoomFolder } from "../folders/room-folder";

/**
 * The tools Room Files gives the assistant. The names are what the model
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
	/** What the model calls. */
	name: FolderToolName;
	/** The tool's title. */
	title: string;
	/** What the model is told the tool does. */
	description: string;
	/** The JSON schema of the tool's arguments. */
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
	/** Whether the call changed the folder. False for reads and failures. */
	hasChanges: boolean;
}

/** Every folder tool's name, in the order the definitions list them. */
const ALL_FOLDER_TOOLS: readonly FolderToolName[] =
	Object.values(FOLDER_TOOL_NAMES);

/** The tools that only read, which run on their own unless set otherwise. */
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

/** Most entries one listing returns. */
const MAX_LIST_ENTRIES = 500;
/** Most levels one listing descends. */
const MAX_LIST_DEPTH = 3;
/** Lines one read returns unless it asks for fewer. */
const DEFAULT_READ_LINES = 2000;
/** Most characters one read returns. */
const MAX_READ_CHARS = 60_000;
/** Largest file a read opens. */
const MAX_READ_BYTES = 10 * 1024 * 1024;
/** Matches one search returns unless it asks for another number. */
const DEFAULT_SEARCH_RESULTS = 50;
/** Most matches one search returns. */
const MAX_SEARCH_RESULTS = 200;
/** Most entries one search looks at before it stops. */
const MAX_SEARCH_SCANNED_ENTRIES = 5000;
/** Most files one content search opens. */
const MAX_CONTENT_SEARCH_FILES = 300;
/** Largest file a content search opens. */
const MAX_CONTENT_SEARCH_BYTES = 1024 * 1024;
/** Longest preview of a matching line. */
const MAX_CONTENT_PREVIEW_CHARS = 200;
/** Longest text one write takes. */
const MAX_WRITE_CHARS = 2_000_000;

/**
 * Whether a tool call name is one of the work folder tools.
 *
 * @param name - The name the model called.
 * @returns True for the folder tools.
 */
export const isFolderToolName = (name: string): name is FolderToolName =>
	(ALL_FOLDER_TOOLS as readonly string[]).includes(name);

/**
 * How a folder tool runs when nothing says otherwise: reading on its own, and
 * every change once the user approves it.
 *
 * @param name - A folder tool.
 * @returns The execution mode.
 */
export const getUsualFolderToolExecution = (
	name: FolderToolName,
): FolderToolExecution => (READ_TOOLS.has(name) ? "auto" : "ask");

/** How the tools name the chat's own files, the room's folder. */
export const ROOM_FILES_NAME = "Room Files";

/** The folder, the way the model should refer to it wherever a tool names it. */
const FOLDER_DESCRIPTION = `${ROOM_FILES_NAME} (this room's own files)`;

/**
 * How the folder relates to the files the chat's other tools use, so the
 * model knows they see what it writes.
 */
const FOLDER_SCOPE =
	"These are the same files the user uploads and saves to the chat, and the chat's other tools read and write them too, so a file written here is where those tools look.";

/**
 * The schema of a path argument.
 *
 * @param description - What the path names, when the usual one does not say.
 * @returns The property's schema.
 */
const pathProperty = (
	description = "Path relative to the work folder root, using forward slashes, such as reports/q3.md.",
): Record<string, unknown> => ({ type: "string", description: description });

/**
 * What the model is told about a tool that waits for the user, so it keeps
 * each such call small and expects a person in the loop.
 *
 * @param name - A folder tool that asks first.
 * @returns The sentence to add to its description.
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
 * A required path argument, normalized.
 *
 * @param args - The call's arguments.
 * @param key - Which argument.
 * @returns The path. The root is refused, since every tool that requires a
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
 * @returns The number.
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
 * @returns True only for `true` or `"true"`.
 */
export const readBoolean = (value: unknown): boolean =>
	value === true || value === "true";

/**
 * A required string argument. An empty string is allowed.
 *
 * @param args - The call's arguments.
 * @param key - Which argument.
 * @returns The string.
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
 * Read a file as text for a tool, refusing binary and oversized files with a
 * reason the model can pass on.
 *
 * @param folder - The folder.
 * @param path - A normalized file path.
 * @param maxBytes - The largest file to open.
 * @param known - The entry, when the caller has it already; otherwise it is
 * looked up.
 * @returns The text.
 */
const readTextFile = async (
	folder: RoomFolder,
	path: string,
	maxBytes = MAX_READ_BYTES,
	known?: FolderEntry,
): Promise<string> => {
	const entry = known ?? (await folder.stat(path));
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
	if (entry.size !== undefined && entry.size > maxBytes) {
		throw new FolderToolError(
			`${path} is too large to read (${entry.size} bytes).`,
		);
	}

	const blob = await folder.readFile(path);
	if (blob.size > maxBytes) {
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
 * @returns A compact row for the model.
 */
const toResultRow = (entry: FolderEntry): Record<string, unknown> => ({
	path: entry.path,
	type: entry.kind,
	...(entry.size !== undefined ? { size: entry.size } : {}),
	...(entry.modified ? { modified: entry.modified } : {}),
});

/**
 * A call that worked.
 *
 * @param payload - What the model reads back.
 * @param hasChanges - Whether the call changed the folder.
 * @returns The outcome.
 */
const succeeded = (
	payload: Record<string, unknown>,
	hasChanges = false,
): FolderToolOutcome => ({ isError: false, payload, hasChanges });

/**
 * `folder_list`: a folder's entries, a few levels deep when `depth` asks.
 *
 * @param folder - The folder.
 * @param args - The call's arguments.
 * @returns The listing.
 */
const listFolder = async (
	folder: RoomFolder,
	args: Record<string, unknown>,
): Promise<FolderToolOutcome> => {
	const path = normalizeFolderPath(args.path);
	const depth = readInteger(args.depth, 1, 1, MAX_LIST_DEPTH);

	const root = await folder.stat(path);
	if (!root) {
		throw new FolderToolError(`No folder exists at ${path}.`);
	}
	if (root.kind !== "directory") {
		throw new FolderToolError(
			`${path} is a file. Use folder_read to read it.`,
		);
	}

	const entries: FolderEntry[] = [];
	let isTruncated = false;

	/**
	 * Add a directory's entries, then its subfolders' up to `depth`.
	 *
	 * @param directory - The directory to list.
	 * @param level - How deep it is, the listed folder being 1.
	 */
	const walk = async (directory: string, level: number): Promise<void> => {
		for (const entry of await folder.list(directory)) {
			if (entries.length >= MAX_LIST_ENTRIES) {
				isTruncated = true;
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

	return succeeded({
		folder: ROOM_FILES_NAME,
		path: path || "/",
		entries: entries.map(toResultRow),
		truncated: isTruncated,
		...(isTruncated
			? {
					note: `Only the first ${MAX_LIST_ENTRIES} entries are shown. List a subfolder to see more.`,
				}
			: {}),
	});
};

/**
 * `folder_read`: a window of lines from a text file.
 *
 * @param folder - The folder.
 * @param args - The call's arguments.
 * @returns The lines, and where to continue when there are more.
 */
const readFile = async (
	folder: RoomFolder,
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

	const text = await readTextFile(folder, path);
	const slice = sliceTextLines(text, offset, limit, MAX_READ_CHARS);

	return succeeded({
		path: path,
		total_lines: slice.totalLines,
		start_line: slice.startLine,
		end_line: slice.endLine,
		truncated: slice.isTruncated,
		...(slice.isTruncated
			? {
					note: `Call folder_read with offset ${slice.endLine + 1} to continue.`,
				}
			: {}),
		content: slice.content,
	});
};

/**
 * `folder_search`: entries whose names match the query, and with `content`
 * text files that contain it, searched breadth first.
 *
 * @param folder - The folder.
 * @param args - The call's arguments.
 * @returns The matches.
 */
const searchFolder = async (
	folder: RoomFolder,
	args: Record<string, unknown>,
): Promise<FolderToolOutcome> => {
	const query = readRequiredString(args, "query").trim();
	if (!query) {
		throw new FolderToolError("query cannot be empty.");
	}
	const path = normalizeFolderPath(args.path);
	const shouldSearchContent = readBoolean(args.content);
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
	let isTruncated = false;

	while (queue.length > 0 && !isTruncated) {
		const directory = queue.shift() ?? "";
		for (const entry of await folder.list(directory)) {
			scanned++;
			if (
				scanned > MAX_SEARCH_SCANNED_ENTRIES ||
				matches.length >= limit
			) {
				isTruncated = true;
				break;
			}

			if (matchesName(entry.name)) {
				matches.push(toResultRow(entry));
			} else if (
				shouldSearchContent &&
				entry.kind === "file" &&
				!isBinaryFileName(entry.name) &&
				(entry.size === undefined ||
					entry.size <= MAX_CONTENT_SEARCH_BYTES) &&
				contentFilesRead < MAX_CONTENT_SEARCH_FILES
			) {
				contentFilesRead++;
				// a file that cannot be read is not a match, not a failure
				const text = await readTextFile(
					folder,
					entry.path,
					MAX_CONTENT_SEARCH_BYTES,
					entry,
				).catch(() => null);
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

	return succeeded({
		query: query,
		path: path || "/",
		matches: matches,
		truncated: isTruncated,
		...(isTruncated
			? {
					note: "The search stopped early. Narrow it with a more specific query or path.",
				}
			: {}),
	});
};

/**
 * `folder_write`: create a text file or replace its contents.
 *
 * @param folder - The folder.
 * @param args - The call's arguments.
 * @returns What was written, and whether the file is new.
 */
const writeFile = async (
	folder: RoomFolder,
	args: Record<string, unknown>,
): Promise<FolderToolOutcome> => {
	const path = readRequiredPath(args, "path");
	const content = readRequiredString(args, "content");
	if (content.length > MAX_WRITE_CHARS) {
		throw new FolderToolError(
			`The content is too long to write in one call (${content.length} characters).`,
		);
	}

	const existing = await folder.stat(path);
	if (existing?.kind === "directory") {
		throw new FolderToolError(`${path} is a folder, not a file.`);
	}

	await folder.writeText(path, content);

	return succeeded(
		{
			path: path,
			bytes: new TextEncoder().encode(content).length,
			created: !existing,
		},
		true,
	);
};

/**
 * `folder_edit`: replace exact text in a text file.
 *
 * @param folder - The folder.
 * @param args - The call's arguments.
 * @returns How many replacements were made.
 */
const editFile = async (
	folder: RoomFolder,
	args: Record<string, unknown>,
): Promise<FolderToolOutcome> => {
	const path = readRequiredPath(args, "path");
	const oldText = readRequiredString(args, "old_text");
	const newText = readRequiredString(args, "new_text");
	const replaceAll = readBoolean(args.replace_all);

	const original = await readTextFile(folder, path);
	const edited = replaceFileText(original, oldText, newText, replaceAll);
	await folder.writeText(path, edited.content);

	return succeeded({ path: path, replacements: edited.replacements }, true);
};

/**
 * `folder_create_directory`: create a folder, doing nothing when it exists.
 *
 * @param folder - The folder.
 * @param args - The call's arguments.
 * @returns Whether the folder was created.
 */
const createDirectory = async (
	folder: RoomFolder,
	args: Record<string, unknown>,
): Promise<FolderToolOutcome> => {
	const path = readRequiredPath(args, "path");

	const existing = await folder.stat(path);
	if (existing?.kind === "file") {
		throw new FolderToolError(`${path} is already a file.`);
	}
	if (existing) {
		return succeeded({ path: path, created: false });
	}

	await folder.createDirectory(path);
	return succeeded({ path: path, created: true }, true);
};

/**
 * `folder_move`: move or rename an entry.
 *
 * @param folder - The folder.
 * @param args - The call's arguments.
 * @returns Where the entry went.
 */
const moveEntry = async (
	folder: RoomFolder,
	args: Record<string, unknown>,
): Promise<FolderToolOutcome> => {
	const from = readRequiredPath(args, "from");
	const to = readRequiredPath(args, "to");
	if (from === to) {
		throw new FolderToolError("from and to are the same path.");
	}

	await folder.move(from, to);
	return succeeded({ from: from, to: to }, true);
};

/**
 * `folder_delete`: delete a file, or a folder once `recursive` confirms a
 * folder with contents was meant to go.
 *
 * @param folder - The folder.
 * @param args - The call's arguments.
 * @returns What was deleted.
 */
const deleteEntry = async (
	folder: RoomFolder,
	args: Record<string, unknown>,
): Promise<FolderToolOutcome> => {
	const path = readRequiredPath(args, "path");
	const recursive = readBoolean(args.recursive);

	const entry = await folder.stat(path);
	if (!entry) {
		throw new FolderToolError(`Nothing exists at ${path}.`);
	}
	if (entry.kind === "directory" && !recursive) {
		const children = await folder.list(path);
		if (children.length > 0) {
			throw new FolderToolError(
				`${path} is a folder with ${children.length} entries. Set recursive to true to delete it with its contents.`,
			);
		}
	}

	await folder.remove(path);
	return succeeded({ path: path, deleted: true }, true);
};

/** One folder tool: what the model is told about it, and what runs it. */
interface FolderToolSpec {
	/** The tool's title. */
	title: string;
	/** What the model is told the tool does, before any approval note. */
	description: string;
	/** The JSON schema of each argument. */
	properties: Record<string, Record<string, unknown>>;
	/** The arguments the model has to pass. */
	required: string[];
	/** Runs one call. May throw; {@link executeFolderTool} catches. */
	run: (
		folder: RoomFolder,
		args: Record<string, unknown>,
	) => Promise<FolderToolOutcome>;
}

/** Every folder tool, in the order the definitions list them. */
const FOLDER_TOOLS: Record<FolderToolName, FolderToolSpec> = {
	[FOLDER_TOOL_NAMES.LIST]: {
		title: "List Folder",
		description: `List the files and folders in ${FOLDER_DESCRIPTION}. Paths are relative to the folder root and use forward slashes; leave path empty for the root. Set depth to 2 or 3 to include nested folders. ${FOLDER_SCOPE}`,
		properties: {
			path: pathProperty(
				"Folder to list, relative to the work folder root. Leave empty for the root.",
			),
			depth: {
				type: "integer",
				minimum: 1,
				maximum: MAX_LIST_DEPTH,
				description: "How many levels to include. Defaults to 1.",
			},
		},
		required: [],
		run: listFolder,
	},
	[FOLDER_TOOL_NAMES.READ]: {
		title: "Read File",
		description: `Read a text file from ${FOLDER_DESCRIPTION}. Returns up to ${DEFAULT_READ_LINES} lines per call; use offset and limit to read further. PDFs, images, and Office documents cannot be read as text, so ask the user to attach those to the chat instead.`,
		properties: {
			path: pathProperty(),
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
		run: readFile,
	},
	[FOLDER_TOOL_NAMES.SEARCH]: {
		title: "Search Folder",
		description: `Find files and folders in ${FOLDER_DESCRIPTION} whose names contain the query, ignoring case. Use * as a wildcard, for example *.md. Set content to true to also find text files that contain the query as plain text.`,
		properties: {
			query: {
				type: "string",
				description: "Text or wildcard pattern to look for.",
			},
			path: pathProperty(
				"Folder to search in, relative to the work folder root. Leave empty to search everything.",
			),
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
		run: searchFolder,
	},
	[FOLDER_TOOL_NAMES.WRITE]: {
		title: "Write File",
		description: `Create a text file in ${FOLDER_DESCRIPTION}, or replace the entire contents of an existing file. Missing parent folders are created. For a small change to an existing file, use folder_edit instead.`,
		properties: {
			path: pathProperty(),
			content: {
				type: "string",
				description: "The complete contents of the file.",
			},
		},
		required: ["path", "content"],
		run: writeFile,
	},
	[FOLDER_TOOL_NAMES.EDIT]: {
		title: "Edit File",
		description: `Replace exact text in a text file in ${FOLDER_DESCRIPTION}. old_text must match the file exactly, including whitespace and line breaks, and must appear once unless replace_all is true. Read the file before editing it.`,
		properties: {
			path: pathProperty(),
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
				description: "Replace every occurrence instead of exactly one.",
			},
		},
		required: ["path", "old_text", "new_text"],
		run: editFile,
	},
	[FOLDER_TOOL_NAMES.CREATE_DIRECTORY]: {
		title: "Create Folder",
		description: `Create a folder in ${FOLDER_DESCRIPTION}, along with any missing parent folders.`,
		properties: { path: pathProperty() },
		required: ["path"],
		run: createDirectory,
	},
	[FOLDER_TOOL_NAMES.MOVE]: {
		title: "Move or Rename",
		description: `Move or rename a file or folder within ${FOLDER_DESCRIPTION}. The destination must not already exist.`,
		properties: {
			from: pathProperty("Current path of the file or folder."),
			to: pathProperty("New path, including the new name."),
		},
		required: ["from", "to"],
		run: moveEntry,
	},
	[FOLDER_TOOL_NAMES.DELETE]: {
		title: "Delete",
		description: `Delete a file from ${FOLDER_DESCRIPTION}, or a folder when recursive is true.`,
		properties: {
			path: pathProperty(),
			recursive: {
				type: "boolean",
				description:
					"Required to delete a folder that still has contents.",
			},
		},
		required: ["path"],
		run: deleteEntry,
	},
};

/**
 * The folder tools the model may call, each described the way it runs. The
 * browser decides which calls to run and which to hold for the user, so the
 * definitions carry no execution mode of their own.
 *
 * @param context - How each tool runs: `executionOf` gives its mode, or null
 * to leave it out of the definitions altogether.
 * @returns The definitions to send with the turn.
 */
export const buildFolderToolDefinitions = (context: {
	executionOf: (name: FolderToolName) => FolderToolExecution | null;
}): FolderToolDefinition[] =>
	ALL_FOLDER_TOOLS.flatMap((name) => {
		const execution = context.executionOf(name);
		if (!execution) {
			return [];
		}
		const { title, description, properties, required } = FOLDER_TOOLS[name];
		return [
			{
				name: name,
				title: title,
				description:
					execution === "ask"
						? `${description}${describeApproval(name)}`
						: description,
				inputSchema: {
					type: "object",
					properties: properties,
					required: required,
				},
			},
		];
	});

/**
 * Run one folder tool call in Room Files.
 *
 * Never throws: a failure comes back as an outcome with `isError`, carrying
 * an explanation the model reads as the tool result.
 *
 * @param folder - Room Files.
 * @param name - The tool the model called.
 * @param args - The call's arguments.
 * @returns The outcome.
 */
export const executeFolderTool = async (
	folder: RoomFolder,
	name: FolderToolName,
	args: Record<string, unknown>,
): Promise<FolderToolOutcome> => {
	try {
		const tool = FOLDER_TOOLS[name];
		if (!tool) {
			throw new FolderToolError(`Unknown tool ${name}.`);
		}
		return await tool.run(folder, args);
	} catch (error) {
		return {
			isError: true,
			payload: {
				error: getErrorMessage(error, "") || "The operation failed.",
			},
			hasChanges: false,
		};
	}
};
