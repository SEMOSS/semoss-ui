import type { Dirent } from "node:fs";
import {
	mkdir,
	readdir,
	readFile,
	rename,
	stat,
	writeFile as writeFileFs,
} from "node:fs/promises";
import { join } from "node:path";
import { assertPathAllowed } from "./path-guard";
import type {
	AllowedDirectory,
	CreateDirectoryArgs,
	DirectoryEntry,
	DirectoryEntryWithSize,
	FileInfo,
	GetFileInfoArgs,
	ListDirectoryArgs,
	ListDirectoryWithSizesArgs,
	LocalFsToolName,
	MoveFileArgs,
	ReadMultipleFilesArgs,
	ReadTextFileArgs,
	SearchFilesArgs,
	WriteFileArgs,
} from "./types";

/** Caps how many matches search_files returns — a runaway glob over a huge
 * tree shouldn't be able to hang the tool call or flood the model with an
 * unbounded result. Callers see this cap reflected in `truncated`. */
const SEARCH_RESULTS_LIMIT = 500;

function globToRegExp(pattern: string): RegExp {
	const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
	const withWildcards = escaped.replace(/\*/g, ".*").replace(/\?/g, ".");
	return new RegExp(`^${withWildcards}$`, "i");
}

async function readTextFile(
	args: ReadTextFileArgs,
	allowed: AllowedDirectory[],
): Promise<string> {
	const resolved = assertPathAllowed(args.path, allowed);
	const content = await readFile(resolved, "utf-8");
	if (args.head === undefined && args.tail === undefined) {
		return content;
	}
	const lines = content.split("\n");
	if (args.head !== undefined) {
		return lines.slice(0, args.head).join("\n");
	}
	if (args.tail !== undefined) {
		return lines.slice(-args.tail).join("\n");
	}
	return content;
}

async function readMultipleFiles(
	args: ReadMultipleFilesArgs,
	allowed: AllowedDirectory[],
): Promise<Record<string, string>> {
	const results: Record<string, string> = {};
	for (const path of args.paths) {
		try {
			const resolved = assertPathAllowed(path, allowed);
			results[path] = await readFile(resolved, "utf-8");
		} catch (err) {
			results[path] =
				`Error: ${err instanceof Error ? err.message : String(err)}`;
		}
	}
	return results;
}

async function listDirectory(
	args: ListDirectoryArgs,
	allowed: AllowedDirectory[],
): Promise<DirectoryEntry[]> {
	const resolved = assertPathAllowed(args.path, allowed);
	const entries = await readdir(resolved, { withFileTypes: true });
	return entries.map((entry) => ({
		name: entry.name,
		type: entry.isDirectory() ? "directory" : "file",
	}));
}

async function listDirectoryWithSizes(
	args: ListDirectoryWithSizesArgs,
	allowed: AllowedDirectory[],
): Promise<DirectoryEntryWithSize[]> {
	const resolved = assertPathAllowed(args.path, allowed);
	const entries = await readdir(resolved, { withFileTypes: true });
	const withSizes: DirectoryEntryWithSize[] = await Promise.all(
		entries.map(async (entry) => {
			if (entry.isDirectory()) {
				return { name: entry.name, type: "directory" as const };
			}
			const info = await stat(join(resolved, entry.name));
			return {
				name: entry.name,
				type: "file" as const,
				size: info.size,
			};
		}),
	);
	if (args.sortBy === "size") {
		withSizes.sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
	} else {
		withSizes.sort((a, b) => a.name.localeCompare(b.name));
	}
	return withSizes;
}

async function walkForSearch(
	dir: string,
	pattern: RegExp,
	excludePatterns: RegExp[],
	results: string[],
): Promise<void> {
	if (results.length >= SEARCH_RESULTS_LIMIT) {
		return;
	}
	let entries: Dirent[];
	try {
		entries = await readdir(dir, {
			withFileTypes: true,
			encoding: "utf-8",
		});
	} catch {
		return;
	}
	for (const entry of entries) {
		if (results.length >= SEARCH_RESULTS_LIMIT) {
			return;
		}
		if (excludePatterns.some((exclude) => exclude.test(entry.name))) {
			continue;
		}
		const fullPath = join(dir, entry.name);
		if (pattern.test(entry.name)) {
			results.push(fullPath);
		}
		if (entry.isDirectory()) {
			await walkForSearch(fullPath, pattern, excludePatterns, results);
		}
	}
}

async function searchFiles(
	args: SearchFilesArgs,
	allowed: AllowedDirectory[],
): Promise<{ matches: string[]; truncated: boolean }> {
	const resolved = assertPathAllowed(args.path, allowed);
	const pattern = globToRegExp(args.pattern);
	const excludePatterns = (args.excludePatterns ?? []).map(globToRegExp);
	const results: string[] = [];
	await walkForSearch(resolved, pattern, excludePatterns, results);
	return {
		matches: results,
		truncated: results.length >= SEARCH_RESULTS_LIMIT,
	};
}

async function getFileInfo(
	args: GetFileInfoArgs,
	allowed: AllowedDirectory[],
): Promise<FileInfo> {
	const resolved = assertPathAllowed(args.path, allowed);
	const info = await stat(resolved);
	return {
		size: info.size,
		created: info.birthtime.toISOString(),
		modified: info.mtime.toISOString(),
		accessed: info.atime.toISOString(),
		isDirectory: info.isDirectory(),
		isFile: info.isFile(),
	};
}

async function writeFileTool(
	args: WriteFileArgs,
	allowed: AllowedDirectory[],
): Promise<{ path: string; bytesWritten: number }> {
	const resolved = assertPathAllowed(args.path, allowed);
	await writeFileFs(resolved, args.content, "utf-8");
	return { path: args.path, bytesWritten: Buffer.byteLength(args.content) };
}

async function createDirectoryTool(
	args: CreateDirectoryArgs,
	allowed: AllowedDirectory[],
): Promise<{ path: string }> {
	const resolved = assertPathAllowed(args.path, allowed);
	await mkdir(resolved, { recursive: true });
	return { path: args.path };
}

async function moveFileTool(
	args: MoveFileArgs,
	allowed: AllowedDirectory[],
): Promise<{ source: string; destination: string }> {
	const resolvedSource = assertPathAllowed(args.source, allowed);
	const resolvedDestination = assertPathAllowed(args.destination, allowed);
	await rename(resolvedSource, resolvedDestination);
	return { source: args.source, destination: args.destination };
}

/**
 * Dispatches one local-fs tool call by name. The IPC handler in main.ts is
 * the only caller — every argument has already crossed the renderer/main
 * boundary as plain JSON by the time it gets here. Unknown tool names and
 * malformed args both throw, surfacing as an error tool_result in the chat
 * (see chat-session.ts's executeToolRound's existing error handling —
 * nothing local-fs-specific needed there).
 */
export async function executeLocalFsTool(
	tool: LocalFsToolName,
	args: Record<string, unknown>,
	allowedDirectories: AllowedDirectory[],
): Promise<unknown> {
	switch (tool) {
		case "read_text_file":
			return readTextFile(
				args as unknown as ReadTextFileArgs,
				allowedDirectories,
			);
		case "read_multiple_files":
			return readMultipleFiles(
				args as unknown as ReadMultipleFilesArgs,
				allowedDirectories,
			);
		case "list_directory":
			return listDirectory(
				args as unknown as ListDirectoryArgs,
				allowedDirectories,
			);
		case "list_directory_with_sizes":
			return listDirectoryWithSizes(
				args as unknown as ListDirectoryWithSizesArgs,
				allowedDirectories,
			);
		case "search_files":
			return searchFiles(
				args as unknown as SearchFilesArgs,
				allowedDirectories,
			);
		case "get_file_info":
			return getFileInfo(
				args as unknown as GetFileInfoArgs,
				allowedDirectories,
			);
		case "list_allowed_directories":
			return allowedDirectories.map((dir) => dir.path);
		case "write_file":
			return writeFileTool(
				args as unknown as WriteFileArgs,
				allowedDirectories,
			);
		case "create_directory":
			return createDirectoryTool(
				args as unknown as CreateDirectoryArgs,
				allowedDirectories,
			);
		case "move_file":
			return moveFileTool(
				args as unknown as MoveFileArgs,
				allowedDirectories,
			);
		default:
			throw new Error(`Unknown local filesystem tool: ${tool}`);
	}
}
