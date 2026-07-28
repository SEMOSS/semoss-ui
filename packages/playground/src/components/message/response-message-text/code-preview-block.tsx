import { CopyIcon, PlayIcon } from "lucide-react";
import { type ComponentProps, useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useDebouncedValue } from "@semoss/sdk/react";
import {
	buildChatExecutionOutputs,
	CellOutputBlock,
	createCodeCellFromExecution,
	createEmptyNotebook,
	createNotebookFilePath,
	type FileItem,
	insertCell,
	nextExecutionCount,
	notifyNotebookFileRefresh,
	parseNotebook,
	unwrapPixelOutput,
} from "@semoss/shared";
import {
	Button,
	Code,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import type { RoomStore } from "@/stores";
import { BlockHeader } from "./block-header";
import { copyToClipboard, getErrorMessage } from "./clipboard";
import {
	buildExecutePixel,
	CODE_LANG_LABELS,
	createCodeFilePath,
	formatExecuteOutput,
	MAX_EXECUTE_LOG_CHARS,
} from "./constants";

interface ExecuteResult {
	output: string;
	logs: string[];
	isError: boolean;
	pending: boolean;
	rawOutput?: unknown;
}

interface CodePreviewBlockProps {
	code: string;
	/** Shiki-safe language used for syntax highlighting */
	language: ComponentProps<typeof Code>["language"];
	/** Original language token from the fence (used for label + filename) */
	rawLanguage?: string;
	room?: RoomStore;
}

export const CodePreviewBlock = ({
	code,
	language,
	rawLanguage,
	room,
}: CodePreviewBlockProps) => {
	const { t } = useTranslation("chat");
	const [isFullViewOpen, setIsFullViewOpen] = useState(false);
	const [isSavingToRoom, setIsSavingToRoom] = useState(false);
	const [isSavingToNotebook, setIsSavingToNotebook] = useState(false);
	const [isAddToNotebookDialogOpen, setIsAddToNotebookDialogOpen] =
		useState(false);
	const [notebookSearch, setNotebookSearch] = useState("");
	const [isSearchingNotebooks, setIsSearchingNotebooks] = useState(false);
	const [notebookResults, setNotebookResults] = useState<FileItem[]>([]);
	const [selectedNotebookPath, setSelectedNotebookPath] = useState<
		string | null
	>(null);
	const [newNotebookName, setNewNotebookName] = useState("");
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isExecuting, setIsExecuting] = useState(false);
	const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(
		null,
	);
	const debouncedNotebookSearch = useDebouncedValue(notebookSearch, 300);

	const langStr = rawLanguage ?? language ?? "txt";
	const langLabel = CODE_LANG_LABELS[langStr] ?? langStr.toUpperCase();
	const executePixel = buildExecutePixel(langStr, code);
	const canExecute = executePixel !== null;

	const execute = async () => {
		if (!room || !executePixel) return;
		setIsExecuting(true);
		setExecuteResult({
			output: "",
			logs: [],
			isError: false,
			pending: true,
			rawOutput: undefined,
		});
		try {
			const { errors, results, logs } =
				await room.runRoomPixelWithConsole(
					executePixel,
					(streamed) =>
						setExecuteResult((prev) =>
							prev ? { ...prev, logs: streamed } : prev,
						),
					MAX_EXECUTE_LOG_CHARS,
				);

			if (errors.length > 0) {
				setExecuteResult({
					output: errors.join("\n"),
					logs,
					isError: true,
					pending: false,
					rawOutput: errors.join("\n"),
				});
				return;
			}

			const last = results.at(-1);
			const opType = last?.operationType?.[0] ?? "";
			const value = unwrapPixelOutput(last ?? {});
			const formatted = formatExecuteOutput(value, opType);
			const isError = opType === "ERROR" || opType === "INVALID_SYNTAX";
			const output =
				!formatted && !isError ? "Success (no output)" : formatted;

			setExecuteResult({
				output,
				logs,
				isError,
				pending: false,
				rawOutput: value,
			});
		} catch (error) {
			const message = getErrorMessage(error);
			setExecuteResult({
				output: message,
				logs: [],
				isError: true,
				pending: false,
				rawOutput: message,
			});
		} finally {
			setIsExecuting(false);
		}
	};

	const saveInRoom = async () => {
		if (!room || !code) return;
		const filePath = createCodeFilePath(langStr);
		try {
			setIsSavingToRoom(true);
			await room.runRoomPixel(
				`SaveInsightAssets(filePath=[${JSON.stringify(filePath)}], content=["<encode>${code}</encode>"]);`,
				false,
				false,
			);
			toast.success(`Saved in room as ${filePath}`);
		} catch (error) {
			toast.error(getErrorMessage(error));
		} finally {
			setIsSavingToRoom(false);
		}
	};

	const openNotebookTab = (path: string) => {
		if (!room) return;
		const fileName = path.split("/").pop() ?? path;
		room.addSidebarNode(`FILE--${path}`, {
			type: "tab",
			name: fileName,
			component: "room-file-editor",
			config: {
				name: fileName,
				path,
			},
			enableClose: true,
		});
	};

	const saveToNotebookPath = async (path: string, content: string) => {
		if (!room) return;
		await room.runRoomPixel(
			`SaveInsightAssets(filePath=[${JSON.stringify(path)}], content=["<encode>${content}</encode>"]);`,
			false,
			false,
		);
		notifyNotebookFileRefresh(path);
		openNotebookTab(path);
	};

	// Search the full file explorer (not just the current directory) for
	// existing .ipynb files, so the Add to Notebook dialog can offer them as
	// append targets. Re-runs whenever the dialog is open and the debounced
	// search term changes; an empty term still searches on ".ipynb" so the
	// dialog lists notebooks by default.
	useEffect(() => {
		if (!isAddToNotebookDialogOpen || !room) return;
		let cancelled = false;

		const searchTerm = debouncedNotebookSearch.trim() || ".ipynb";
		setIsSearchingNotebooks(true);

		room.runRoomPixel<[FileItem[]]>(
			`SearchInsightAssets(filePath=[""], search=[${JSON.stringify(searchTerm)}]);`,
			false,
			false,
		)
			.then((response) => {
				if (cancelled) return;
				const rawResults = response.pixelReturn[0]?.output ?? [];
				setNotebookResults(
					rawResults.filter(
						(item) =>
							item.type !== "directory" &&
							item.path.toLowerCase().endsWith(".ipynb"),
					),
				);
			})
			.catch(() => {
				if (!cancelled) setNotebookResults([]);
			})
			.finally(() => {
				if (!cancelled) setIsSearchingNotebooks(false);
			});

		return () => {
			cancelled = true;
		};
	}, [isAddToNotebookDialogOpen, debouncedNotebookSearch, room]);

	const openAddToNotebookDialog = () => {
		setSelectedNotebookPath(null);
		setNewNotebookName("");
		setNotebookSearch("");
		setNotebookResults([]);
		setIsAddToNotebookDialogOpen(true);
	};

	// Always appends the generated cell - the notebook editor itself lets the
	// user freely reorder cells, so there's no need for row-targeting here.
	const confirmAddToNotebook = async () => {
		if (!room || !code) return;
		if (!selectedNotebookPath && !newNotebookName.trim()) return;

		const isNewNotebook = !selectedNotebookPath;
		const targetPath =
			selectedNotebookPath ?? createNotebookFilePath(newNotebookName);

		try {
			setIsSavingToNotebook(true);

			let notebook = createEmptyNotebook();
			if (!isNewNotebook) {
				// Explicitly selected from the list - must load successfully.
				const loadResponse = await room.runRoomPixel<[string]>(
					`GetInsightAssets(filePath=[${JSON.stringify(targetPath)}]);`,
					false,
					false,
				);
				const existingContent =
					loadResponse.pixelReturn[0]?.output ?? "";
				const parsed = parseNotebook(existingContent);
				if (!parsed.notebook) {
					toast.error(parsed.error ?? "Failed to parse notebook");
					return;
				}
				notebook = parsed.notebook;
			} else {
				// Guard against silently overwriting a file that happens to
				// already exist under this exact generated name (e.g. the user
				// typed a name that collides with a notebook not selected from
				// the list above). A load failure here just means the path is
				// truly new, which is the expected/common case - not an error.
				try {
					const loadResponse = await room.runRoomPixel<[string]>(
						`GetInsightAssets(filePath=[${JSON.stringify(targetPath)}]);`,
						false,
						false,
					);
					const existingContent =
						loadResponse.pixelReturn[0]?.output ?? "";
					if (existingContent.trim()) {
						const parsed = parseNotebook(existingContent);
						if (parsed.notebook) {
							notebook = parsed.notebook;
						}
					}
				} catch {
					// Path doesn't exist yet - proceed with a brand-new notebook.
				}
			}

			// Persist the last execution outcome (logs + rich output) into the
			// generated notebook cell so exported content matches what the user
			// saw.
			const executionCount = nextExecutionCount(notebook);
			const outputs = executeResult
				? buildChatExecutionOutputs(
						executeResult.logs,
						executeResult.rawOutput ?? executeResult.output,
						executeResult.isError,
						executionCount,
					)
				: [];
			const cell = createCodeCellFromExecution(
				code,
				outputs,
				executionCount,
			);
			const content = JSON.stringify(insertCell(notebook, cell), null, 2);

			await saveToNotebookPath(targetPath, content);
			setIsAddToNotebookDialogOpen(false);
			toast.success(
				isNewNotebook
					? `Created notebook ${targetPath.split("/").pop() ?? targetPath}`
					: `Appended to ${targetPath.split("/").pop() ?? targetPath}`,
			);
		} catch (error) {
			toast.error(getErrorMessage(error));
		} finally {
			setIsSavingToNotebook(false);
		}
	};

	return (
		<>
			<div className="relative overflow-hidden rounded-md border border-border bg-background">
				<BlockHeader
					label={langLabel}
					isCollapsed={isCollapsed}
					onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
					collapseDisabled={!code}
				>
					{canExecute && (
						<Button
							className="-my-1 h-6 gap-1 px-2 text-muted-foreground text-xs hover:text-foreground"
							variant="ghost"
							size="sm"
							disabled={!room || isExecuting}
							onClick={() => void execute()}
						>
							<PlayIcon className="size-3.5" />
							{isExecuting ? "Running..." : "Execute"}
						</Button>
					)}
					<Button
						className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!room || !code || isSavingToNotebook}
						onClick={() => openAddToNotebookDialog()}
					>
						{isSavingToNotebook ? "Saving..." : "Add To Notebook"}
					</Button>
					<Button
						className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!room || !code || isSavingToRoom}
						onClick={() => void saveInRoom()}
					>
						{isSavingToRoom ? "Saving..." : "Save In Room"}
					</Button>
					<Button
						className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!code}
						onClick={() => setIsFullViewOpen(true)}
					>
						Full View
					</Button>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="-my-1 -me-2 h-6 gap-1 px-2 text-muted-foreground text-xs hover:text-foreground"
								variant="ghost"
								size="sm"
								disabled={!code}
								onClick={() =>
									void copyToClipboard(
										code,
										() =>
											toast.success(
												t("notifications.copySuccess"),
											),
										(msg) => toast.error(msg),
									)
								}
							>
								<CopyIcon className="size-3.5" />
								Copy
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">Copy</TooltipContent>
					</Tooltip>
				</BlockHeader>
				{!isCollapsed && (
					<div className="p-3">
						<Code code={code} language={language ?? "txt"} />
					</div>
				)}
				{executeResult && (
					<div className="border-border border-t">
						<div className="flex items-center justify-between gap-2 border-border border-b px-3 py-2 text-muted-foreground text-xs">
							<span>
								{executeResult.pending
									? "Running…"
									: executeResult.isError
										? "Error"
										: "Output"}
							</span>
							<Button
								className="-my-1 -me-2 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
								variant="ghost"
								size="sm"
								disabled={isExecuting}
								onClick={() => setExecuteResult(null)}
							>
								Clear
							</Button>
						</div>
						<div className="max-h-96 overflow-auto">
							<CellOutputBlock
								output={executeResult.output}
								logs={executeResult.logs}
								error={executeResult.isError}
								pending={executeResult.pending}
							/>
						</div>
					</div>
				)}
			</div>

			<Dialog open={isFullViewOpen} onOpenChange={setIsFullViewOpen}>
				<DialogContent className="h-[100dvh] max-h-[100dvh] w-[100dvw] max-w-[100dvw] grid-rows-[auto_1fr] overflow-hidden rounded-none border-0 p-3 sm:w-[100dvw] sm:max-w-[100dvw]">
					<DialogHeader>
						<DialogTitle>{langLabel}</DialogTitle>
					</DialogHeader>
					<div className="relative h-full min-h-0 overflow-auto">
						<Code code={code} language={language ?? "txt"} />
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={isAddToNotebookDialogOpen}
				onOpenChange={setIsAddToNotebookDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add to Notebook</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div className="space-y-1.5">
							<div className="text-muted-foreground text-sm">
								Select an existing notebook
							</div>
							<Input
								value={notebookSearch}
								onChange={(event) => {
									setNotebookSearch(event.target.value);
									setSelectedNotebookPath(null);
								}}
								placeholder="Search .ipynb files"
							/>
							<div className="max-h-48 overflow-y-auto rounded-md border border-border">
								{isSearchingNotebooks && (
									<div className="px-3 py-2 text-muted-foreground text-sm">
										Searching…
									</div>
								)}
								{!isSearchingNotebooks &&
									notebookResults.length === 0 && (
										<div className="px-3 py-2 text-muted-foreground text-sm">
											No notebooks found
										</div>
									)}
								{!isSearchingNotebooks &&
									notebookResults.map((item) => (
										<button
											type="button"
											key={item.path}
											className={`block w-full truncate px-3 py-2 text-left text-sm hover:bg-muted ${
												selectedNotebookPath ===
												item.path
													? "bg-muted font-medium"
													: ""
											}`}
											onClick={() => {
												setSelectedNotebookPath(
													item.path,
												);
												setNewNotebookName("");
											}}
										>
											{item.path}
										</button>
									))}
							</div>
						</div>
						<div className="flex items-center gap-2 text-muted-foreground text-xs">
							<div className="h-px flex-1 bg-border" />
							or
							<div className="h-px flex-1 bg-border" />
						</div>
						<div className="space-y-1.5">
							<div className="text-muted-foreground text-sm">
								Create a new notebook
							</div>
							<Input
								value={newNotebookName}
								onChange={(event) => {
									setNewNotebookName(event.target.value);
									setSelectedNotebookPath(null);
								}}
								placeholder="my-notebook (.ipynb added automatically)"
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										void confirmAddToNotebook();
									}
								}}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsAddToNotebookDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={() => void confirmAddToNotebook()}
							disabled={
								isSavingToNotebook ||
								(!selectedNotebookPath &&
									!newNotebookName.trim())
							}
						>
							{isSavingToNotebook
								? "Saving..."
								: selectedNotebookPath
									? "Append"
									: "Create"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
