import { CopyIcon, PlayIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	appendCellToNotebook,
	buildExecutePixel,
	createNotebookFileContent,
	createNotebookFilePath,
	notifyNotebookFileRefresh,
	notifyNotebookRowClearSelection,
	replaceNotebookCell,
	toNotebookExecutionData,
	unwrapPixelOutput,
} from "@semoss/notebook";
import { CellOutputBlock } from "@semoss/shared";
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
	const [isNotebookNameDialogOpen, setIsNotebookNameDialogOpen] =
		useState(false);
	const [newNotebookName, setNewNotebookName] = useState("");
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isExecuting, setIsExecuting] = useState(false);
	const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(
		null,
	);

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
				initialTab: "preview",
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

	const saveAsNotebook = async () => {
		if (!room || !code) return;

		// Persist the last execution outcome (logs + rich output) into the
		// generated notebook cell so exported content matches what the user saw.
		const notebookExecutionData = toNotebookExecutionData(executeResult);
		const selectedNotebookRow = room.selectedNotebookRow;

		try {
			setIsSavingToNotebook(true);

			// Priority 1: explicit row-selection update from notebook preview.
			if (selectedNotebookRow?.path) {
				const notebookPath = selectedNotebookRow.path;
				const loadResponse = await room.runRoomPixel<[string]>(
					`GetInsightAssets(filePath=[${JSON.stringify(notebookPath)}]);`,
					false,
					false,
				);
				const existingContent =
					loadResponse.pixelReturn[0]?.output ?? "";
				const replacedContent = replaceNotebookCell(
					existingContent,
					selectedNotebookRow.rowNumber,
					code,
					langStr,
					notebookExecutionData,
				);

				if (!replacedContent) {
					toast.error("Failed to update notebook row");
					return;
				}

				await saveToNotebookPath(notebookPath, replacedContent);
				room.setSelectedNotebookRow(null);
				notifyNotebookRowClearSelection(notebookPath);
				toast.success(
					`Updated row ${selectedNotebookRow.rowNumber} in ${
						notebookPath.split("/").pop() ?? notebookPath
					}`,
				);
				return;
			}

			const existingOpenNotebookPath = room.openNotebookFilePath;

			// Priority 2: append to currently open notebook tab if available.
			if (existingOpenNotebookPath) {
				const notebookPath = existingOpenNotebookPath;
				const loadResponse = await room.runRoomPixel<[string]>(
					`GetInsightAssets(filePath=[${JSON.stringify(notebookPath)}]);`,
					false,
					false,
				);
				const existingContent =
					loadResponse.pixelReturn[0]?.output ?? "";
				const appendedContent = appendCellToNotebook(
					existingContent,
					code,
					langStr,
					notebookExecutionData,
				);

				if (!appendedContent) {
					toast.error("Failed to append notebook cell");
					return;
				}

				await saveToNotebookPath(notebookPath, appendedContent);
				toast.success(
					`Appended to ${
						notebookPath.split("/").pop() ?? notebookPath
					}`,
				);
				return;
			}

			// Priority 3: create a brand-new notebook when no target exists yet.
			setIsNotebookNameDialogOpen(true);
		} catch (error) {
			toast.error(getErrorMessage(error));
		} finally {
			setIsSavingToNotebook(false);
		}
	};

	const confirmCreateNotebookWithName = async () => {
		if (!room || !code) return;
		try {
			setIsSavingToNotebook(true);
			const notebookExecutionData =
				toNotebookExecutionData(executeResult);
			const notebookPath = createNotebookFilePath(newNotebookName);
			const content = createNotebookFileContent(
				code,
				langStr,
				notebookExecutionData,
			);

			await saveToNotebookPath(notebookPath, content);
			setIsNotebookNameDialogOpen(false);
			setNewNotebookName("");
			toast.success(
				`Created notebook ${
					notebookPath.split("/").pop() ?? notebookPath
				}`,
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
						onClick={() => void saveAsNotebook()}
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
				open={isNotebookNameDialogOpen}
				onOpenChange={setIsNotebookNameDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Notebook</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						<div className="text-muted-foreground text-sm">
							Enter notebook file name (.ipynb will be appended
							automatically)
						</div>
						<Input
							value={newNotebookName}
							onChange={(event) =>
								setNewNotebookName(event.target.value)
							}
							placeholder="my-notebook"
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									void confirmCreateNotebookWithName();
								}
							}}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsNotebookNameDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={() => void confirmCreateNotebookWithName()}
							disabled={isSavingToNotebook}
						>
							{isSavingToNotebook ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
