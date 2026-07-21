/**
 * Local filesystem tool access — lets the chat LLM read/write files on the
 * user's actual machine, something the remote SEMOSS server never has
 * access to (see packages/desktop/AGENTS.md's "Local proxy for API calls"
 * section for why this app talks to a remote server at all). Every
 * operation is confined to directories the user has explicitly allowed
 * (see AllowlistStore) and validated in the main process (see
 * path-guard.ts) before it ever touches disk — the renderer never gets
 * raw fs access, same posture as the connections/ cookie handling.
 */

/** One directory the user has explicitly allowed tools to read/write within. */
export interface AllowedDirectory {
	/** Absolute, OS-native path. */
	path: string;
	/** ISO timestamp of when this directory was added. */
	dateAdded: string;
}

/**
 * The read-only tool set — names/parameters mirror the official
 * `@modelcontextprotocol/server-filesystem` tools (the same ones Claude
 * Desktop's filesystem connector exposes), so a model already trained on
 * that convention behaves the same way here. `directory_tree`,
 * `read_media_file`, and `edit_file` are deliberately not included in this
 * first slice — same allowlist/path-guard plumbing would cover them if
 * they're ever needed, just more surface to review before shipping.
 */
export type LocalFsReadTool =
	| "read_text_file"
	| "read_multiple_files"
	| "list_directory"
	| "list_directory_with_sizes"
	| "search_files"
	| "get_file_info"
	| "list_allowed_directories";

/** The write-capable tool set — each requires a live permission decision (see permission-gate on the renderer side) before executing. */
export type LocalFsWriteTool = "write_file" | "create_directory" | "move_file";

export type LocalFsToolName = LocalFsReadTool | LocalFsWriteTool;

export const LOCAL_FS_WRITE_TOOLS: readonly LocalFsWriteTool[] = [
	"write_file",
	"create_directory",
	"move_file",
];

export function isLocalFsWriteTool(
	tool: LocalFsToolName,
): tool is LocalFsWriteTool {
	return (LOCAL_FS_WRITE_TOOLS as readonly string[]).includes(tool);
}

export interface ReadTextFileArgs {
	path: string;
	head?: number;
	tail?: number;
}

export interface ReadMultipleFilesArgs {
	paths: string[];
}

export interface ListDirectoryArgs {
	path: string;
}

export interface ListDirectoryWithSizesArgs {
	path: string;
	sortBy?: "name" | "size";
}

export interface SearchFilesArgs {
	path: string;
	pattern: string;
	excludePatterns?: string[];
}

export interface GetFileInfoArgs {
	path: string;
}

export interface WriteFileArgs {
	path: string;
	content: string;
}

export interface CreateDirectoryArgs {
	path: string;
}

export interface MoveFileArgs {
	source: string;
	destination: string;
}

export interface DirectoryEntry {
	name: string;
	type: "file" | "directory";
}

export interface DirectoryEntryWithSize extends DirectoryEntry {
	/** Bytes; omitted for directories. */
	size?: number;
}

export interface FileInfo {
	size: number;
	created: string;
	modified: string;
	accessed: string;
	isDirectory: boolean;
	isFile: boolean;
}

/** One call as it arrives from the renderer's tool-call interception (see app-ui/src/local-fs-tool-executor.ts). */
export interface LocalFsToolCall {
	tool: LocalFsToolName;
	args: Record<string, unknown>;
}
