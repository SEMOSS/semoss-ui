import { FolderIcon, PlusIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Textarea,
} from "@semoss/ui/next";
import type {
	AllowedDirectory,
	LocalFsToolName,
} from "../../../electron/local-fs/types";
import { useLocalFsPermissionGate } from "./permission-gate";
import { LocalFsAccessDeniedError, runLocalFsTool } from "./tool-executor";

/**
 * Settings → Local Files tab: the directory allowlist local filesystem
 * tools are confined to (see electron/local-fs/path-guard.ts — this is the
 * enforcement boundary, not just a display list). Add opens a native
 * folder picker (electron/main.ts's `dialog.showOpenDialog`); nothing here
 * ever exposes a raw path input, so a user can't accidentally allowlist a
 * path by typing it.
 */
export const LocalFilesSettings = () => {
	const [directories, setDirectories] = useState<AllowedDirectory[] | null>(
		null,
	);
	const [adding, setAdding] = useState(false);
	const [removingPath, setRemovingPath] = useState<string | null>(null);

	useEffect(() => {
		void window.semossDesktop.localFs
			.listAllowedDirectories()
			.then(setDirectories);
	}, []);

	const handleAdd = async () => {
		setAdding(true);
		try {
			setDirectories(
				await window.semossDesktop.localFs.addAllowedDirectory(),
			);
		} finally {
			setAdding(false);
		}
	};

	const handleRemove = async (path: string) => {
		setRemovingPath(path);
		try {
			setDirectories(
				await window.semossDesktop.localFs.removeAllowedDirectory(path),
			);
		} finally {
			setRemovingPath(null);
		}
	};

	return (
		<div className="flex flex-col gap-6 pt-2">
			<LocalFilesAllowlist
				directories={directories}
				adding={adding}
				removingPath={removingPath}
				onAdd={handleAdd}
				onRemove={handleRemove}
			/>
			<LocalFsDevTestHarness />
		</div>
	);
};

const LocalFilesAllowlist = ({
	directories,
	adding,
	removingPath,
	onAdd,
	onRemove,
}: {
	directories: AllowedDirectory[] | null;
	adding: boolean;
	removingPath: string | null;
	onAdd: () => void;
	onRemove: (path: string) => void;
}) => {
	return (
		<div className="flex flex-col gap-4 pt-2">
			<div>
				<p className="font-medium text-sm">Local Files</p>
				<p className="text-muted-foreground text-xs">
					Folders the chat's local filesystem tools may read and write
					within. The model never sees anything outside this list, and
					every write still asks you to confirm.
				</p>
			</div>
			{directories === null ? (
				<div className="flex justify-center py-4">
					<Spinner className="size-4 text-muted-foreground" />
				</div>
			) : directories.length === 0 ? (
				<p className="rounded-md border border-border border-dashed px-3 py-4 text-center text-muted-foreground text-sm">
					No folders allowed yet.
				</p>
			) : (
				<ul className="flex flex-col gap-2">
					{directories.map((dir) => (
						<li
							key={dir.path}
							className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
						>
							<FolderIcon className="size-4 shrink-0 text-muted-foreground" />
							<span
								className="min-w-0 flex-1 truncate text-sm"
								title={dir.path}
							>
								{dir.path}
							</span>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label={`Remove ${dir.path}`}
								disabled={removingPath === dir.path}
								onClick={() => onRemove(dir.path)}
							>
								<XIcon className="size-4" />
							</Button>
						</li>
					))}
				</ul>
			)}
			<Button
				type="button"
				variant="outline"
				className="self-start"
				disabled={adding}
				onClick={onAdd}
			>
				<PlusIcon className="size-4" />
				{adding ? "Adding…" : "Add Folder"}
			</Button>
		</div>
	);
};

const TEST_TOOLS: LocalFsToolName[] = [
	"list_directory",
	"list_directory_with_sizes",
	"read_text_file",
	"get_file_info",
	"list_allowed_directories",
	"write_file",
	"create_directory",
];

/**
 * Runs a local-fs tool directly through the real IPC → path-guard → `fs`
 * path, bypassing the LLM/MCP tool-call machinery entirely — lets the
 * Electron-side plumbing (allowlist enforcement, actual file I/O, the
 * permission dialog) be verified before the "Local Filesystem" toolbox is
 * provisioned on a SEMOSS instance and the real chat flow can reach it
 * (see tool-executor.ts's doc comment). TEMPORARY: remove once the real
 * end-to-end chat flow has been exercised at least once, or keep it if it
 * turns out to be a handy debugging tool — your call.
 *
 * Its own `useLocalFsPermissionGate()` instance is intentionally separate
 * from chat-shell.tsx's — but both share the same module-level
 * sessionAllowlist (see permission-gate.tsx), so an "Always Allow"
 * decision made here really does carry over into chat, which is worth
 * knowing if a result looks suspiciously pre-approved.
 */
const LocalFsDevTestHarness = () => {
	const [tool, setTool] = useState<LocalFsToolName>("list_directory");
	const [path, setPath] = useState("");
	const [content, setContent] = useState("");
	const [running, setRunning] = useState(false);
	const [result, setResult] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [permissionResult, setPermissionResult] = useState<string | null>(
		null,
	);
	const permissionGate = useLocalFsPermissionGate();

	const handleRun = async () => {
		setRunning(true);
		setResult(null);
		setError(null);
		try {
			const args: Record<string, unknown> =
				tool === "list_allowed_directories"
					? {}
					: tool === "write_file"
						? { path, content }
						: { path };
			// Goes through the real grant → confirm → execute flow (same
			// function the actual chat executor uses) — on a path that
			// isn't allowed yet, this pops the "Access needed" prompt right
			// here; approving it grants the folder and runs the operation
			// in one step, same as it would from a real conversation.
			const output = await runLocalFsTool(
				tool,
				args,
				permissionGate.requestPermission,
			);
			setResult(JSON.stringify(output, null, 2));
		} catch (err) {
			setError(
				err instanceof LocalFsAccessDeniedError
					? "Denied"
					: err instanceof Error
						? err.message
						: String(err),
			);
		} finally {
			setRunning(false);
		}
	};

	const handleTestConfirmPrompt = async () => {
		setPermissionResult(null);
		// Forces the "confirm" (Allow Once/Always Allow This Session/Deny)
		// dialog variant directly, regardless of allowlist state — for
		// testing that dialog's own behavior in isolation. The "grant"
		// variant is exercised naturally by Run above, on any path that
		// isn't allowed yet.
		const allowed = await permissionGate.requestPermission({
			mode: "confirm",
			description: `Test prompt: write_file on "${path || "(no path entered above)"}"`,
			cacheKey: `test:${path || "*"}`,
		});
		setPermissionResult(allowed ? "Allowed" : "Denied");
	};

	return (
		<div className="flex flex-col gap-3 border-border border-t pt-4">
			<div>
				<p className="font-medium text-sm">Developer Test</p>
				<p className="text-muted-foreground text-xs">
					Runs a tool directly against the allowlist, without going
					through chat — for verifying the plumbing works before the
					Local Filesystem toolbox is provisioned server-side.
				</p>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Select
					value={tool}
					onValueChange={(value) => setTool(value as LocalFsToolName)}
				>
					<SelectTrigger size="sm" className="w-56">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{TEST_TOOLS.map((name) => (
							<SelectItem key={name} value={name}>
								{name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{tool !== "list_allowed_directories" && (
					<Input
						value={path}
						onChange={(e) => setPath(e.target.value)}
						placeholder="Absolute path"
						className="min-w-64 flex-1"
					/>
				)}
				<Button
					type="button"
					variant="outline"
					disabled={running}
					onClick={handleRun}
				>
					{running ? "Running…" : "Run"}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={handleTestConfirmPrompt}
				>
					Test Confirm Prompt
				</Button>
			</div>
			{tool === "write_file" && (
				<Textarea
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder="File content to write"
					rows={3}
				/>
			)}
			{permissionResult && (
				<p className="text-muted-foreground text-xs">
					Permission prompt result: {permissionResult}
				</p>
			)}
			{result && (
				<pre className="max-h-48 overflow-auto rounded-md bg-muted p-2 text-xs">
					{result}
				</pre>
			)}
			{error && (
				<p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-xs">
					{error}
				</p>
			)}
			{permissionGate.dialog}
		</div>
	);
};
