import type { ChatOptions, LocalToolResult, ToolCall } from "@semoss/chat";
import type { LocalFsToolName } from "../../../electron/local-fs/types";
import type { LocalFsPermissionGate } from "./permission-gate";

/**
 * Which local-fs tool names exist at all — matched against the incoming
 * tool call's `original_name` (falling back to `name`) to decide whether
 * this call is ours to intercept. Kept as a literal copy of
 * electron/local-fs/types.ts's LocalFsToolName union rather than a shared
 * runtime import — app-ui (Vite) and electron (tsc/commonjs) are separate
 * builds, and only *type* imports safely cross that boundary (see
 * global.d.ts's DesktopBridge import for the established precedent); a
 * real value/const needs its own copy, same reasoning as
 * preload.ts's literal copy of ipc-channels.ts.
 */
const LOCAL_FS_TOOL_NAMES: readonly LocalFsToolName[] = [
	"read_text_file",
	"read_multiple_files",
	"list_directory",
	"list_directory_with_sizes",
	"search_files",
	"get_file_info",
	"list_allowed_directories",
	"write_file",
	"create_directory",
	"move_file",
];

const LOCAL_FS_WRITE_TOOLS: ReadonlySet<LocalFsToolName> = new Set([
	"write_file",
	"create_directory",
	"move_file",
]);

function isLocalFsToolName(name: string): name is LocalFsToolName {
	return (LOCAL_FS_TOOL_NAMES as readonly string[]).includes(name);
}

/** The one path/paths argument each tool cares about, for the permission
 * dialog's description and the allowlist pre-check — not used for
 * enforcement itself, the main process's path-guard is what actually
 * matters for that. */
function primaryPath(
	tool: LocalFsToolName,
	args: Record<string, unknown>,
): string | undefined {
	switch (tool) {
		case "move_file":
			return typeof args.destination === "string"
				? args.destination
				: undefined;
		case "read_multiple_files":
			return Array.isArray(args.paths) &&
				typeof args.paths[0] === "string"
				? args.paths[0]
				: undefined;
		case "list_allowed_directories":
			return undefined;
		default:
			return typeof args.path === "string" ? args.path : undefined;
	}
}

function describeCall(
	tool: LocalFsToolName,
	args: Record<string, unknown>,
): string {
	const path = primaryPath(tool, args);
	switch (tool) {
		case "write_file":
			return `Write to the file "${path}"`;
		case "create_directory":
			return `Create the folder "${path}"`;
		case "move_file":
			return `Move "${String(args.source)}" to "${String(args.destination)}"`;
		default:
			return `Run ${tool} on "${path}"`;
	}
}

export class LocalFsAccessDeniedError extends Error {
	constructor(description: string) {
		super(`User denied: ${description}`);
		this.name = "LocalFsAccessDeniedError";
	}
}

/**
 * Runs one local-fs tool call through the real grant → confirm → execute
 * flow — this is what makes "can you look at this file/folder" work
 * directly from chat, with no Settings detour required first:
 *
 * 1. If the target path isn't in the allowlist yet, shows a "grant access"
 *    prompt (Allow/Deny) describing exactly what's about to happen —
 *    approving both grants its containing directory (see
 *    electron/local-fs/path-guard.ts's resolveContainingDirectory) AND
 *    completes the described action, in one step.
 * 2. Otherwise (path already granted), write-capable tools still show the
 *    lighter "confirm" prompt (Allow Once/Always Allow This Session/Deny)
 *    every time, unless the user's already chosen to trust it for this
 *    session. Reads on an already-granted path are silent — Settings →
 *    Local Files is where that access can be reviewed or revoked.
 * 3. Executes via the main process's real `fs` access.
 *
 * Throws LocalFsAccessDeniedError on any denial — callers decide how to
 * represent that (createLocalFsToolExecutor turns it into a graceful
 * tool_result; the Settings dev test harness just shows "Denied").
 */
export async function runLocalFsTool(
	tool: LocalFsToolName,
	args: Record<string, unknown>,
	requestPermission: LocalFsPermissionGate["requestPermission"],
): Promise<unknown> {
	const description = describeCall(tool, args);
	const path = primaryPath(tool, args);

	if (path !== undefined) {
		const alreadyAllowed =
			await window.semossDesktop.localFs.isPathAllowed(path);
		if (!alreadyAllowed) {
			const approved = await requestPermission({
				mode: "grant",
				description,
				cacheKey: `grant:${path}`,
			});
			if (!approved) {
				throw new LocalFsAccessDeniedError(description);
			}
			await window.semossDesktop.localFs.allowPath(path);
		} else if (LOCAL_FS_WRITE_TOOLS.has(tool)) {
			const approved = await requestPermission({
				mode: "confirm",
				description,
				cacheKey: `${tool}:${path}`,
			});
			if (!approved) {
				throw new LocalFsAccessDeniedError(description);
			}
		}
	}

	return window.semossDesktop.localFs.executeTool(tool, args);
}

/**
 * Builds the `localToolExecutor` passed into ChatOptions (see
 * chat-shell.tsx) — intercepts tool calls belonging to the "Local
 * Filesystem" MCP toolbox (matched by `_meta.SMSS_PROJECT_ID`, a one-time,
 * per-instance provisioning step, NOT something this app sets up itself —
 * see electron/connections/types.ts's `localFilesystemToolboxProjectId`
 * doc comment) and runs them via runLocalFsTool above instead of routing
 * them to RunMCPTool, which would fail server-side since the SEMOSS server
 * has no access to this machine's disk.
 */
export function createLocalFsToolExecutor(
	toolboxProjectId: string | undefined,
	requestPermission: LocalFsPermissionGate["requestPermission"],
): NonNullable<ChatOptions["localToolExecutor"]> {
	return async (toolCall: ToolCall): Promise<LocalToolResult> => {
		if (!toolboxProjectId) {
			// Not provisioned on this environment yet — feature is inert,
			// every call falls through to the normal server-executed path.
			return { handled: false };
		}
		if (toolCall._meta?.SMSS_PROJECT_ID !== toolboxProjectId) {
			return { handled: false };
		}
		const toolName = toolCall.original_name ?? toolCall.name;
		if (!isLocalFsToolName(toolName)) {
			return { handled: false };
		}

		try {
			const result = await runLocalFsTool(
				toolName,
				toolCall.arguments ?? {},
				requestPermission,
			);
			return { handled: true, result };
		} catch (err) {
			if (err instanceof LocalFsAccessDeniedError) {
				return { handled: true, result: { error: err.message } };
			}
			throw err;
		}
	};
}
