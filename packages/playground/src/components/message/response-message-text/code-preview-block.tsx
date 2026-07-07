import { CopyIcon, PlayIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { CellOutputBlock, notifyFileEditorRefresh } from "@semoss/shared";
import {
	Button,
	Code,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import type { RoomStore } from "@/stores";
import { BlockHeader } from "./block-header";
import { copyToClipboard, getErrorMessage } from "./clipboard";
import {
	appendCellToNotebook,
	buildExecutePixel,
	CODE_LANG_LABELS,
	createCodeFilePath,
	createNotebookFileContent,
	createNotebookFilePath,
	formatExecuteOutput,
	MAX_EXECUTE_LOG_CHARS,
	unwrapPixelOutput,
} from "./constants";

interface ExecuteResult {
	output: string;
	logs: string[];
	isError: boolean;
	pending: boolean;
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
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isExecuting, setIsExecuting] = useState(false);
	const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(
		null,
	);

	// Prefer rawLanguage for display/filename so custom tokens like "pixel"
	// show their proper label even though Shiki falls back to "txt" for rendering.
	const langStr = rawLanguage ?? language ?? "txt";
	const langLabel = CODE_LANG_LABELS[langStr] ?? langStr.toUpperCase();

	// Only Python, R, and Pixel blocks can be run server-side.
	const executePixel = buildExecutePixel(langStr, code);
	const canExecute = executePixel !== null;

	const execute = async () => {
		if (!room || !executePixel) return;
		setIsExecuting(true);
		// Seed a pending row so the result panel shows the running spinner and
		// streams console logs in, just like the terminal transcript.
		setExecuteResult({
			output: "",
			logs: [],
			isError: false,
			pending: true,
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
				});
				return;
			}

			// Pixel reactors can return multiple outputs; process the last one
			// the same way the terminal REPL does (unwrap by operationType,
			// then format for display).
			const last = results.at(-1);
			const opType = last?.operationType?.[0] ?? "";
			const value = unwrapPixelOutput(last ?? {});
			const formatted = formatExecuteOutput(value, opType);
			const isError = opType === "ERROR" || opType === "INVALID_SYNTAX";
			// A CODE_EXECUTION pixel (Py/R) with no return value renders nothing,
			// which reads like it never ran — show a success marker instead.
			const output =
				!formatted && !isError ? "Success (no output)" : formatted;

			setExecuteResult({ output, logs, isError, pending: false });
		} catch (error) {
			setExecuteResult({
				output: getErrorMessage(error),
				logs: [],
				isError: true,
				pending: false,
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

	const saveAsNotebook = async () => {
		if (!room || !code) return;

		// Check if a save-notebook-response-*.notebook.json is already open in
		// the sidebar. If so, append a new cell to it instead of creating a
		// brand-new file each time ("rough sheet" behaviour).
		let existingFilePath: string | null = null;
		room.sidebar.model.visitNodes((node) => {
			if (existingFilePath) return; // already found one
			const id = node.getId();
			if (
				id.startsWith("FILE--save-notebook-response-") &&
				id.endsWith(".notebook.json") &&
				node.isVisible?.() // only count visible (open) nodes
			) {
				existingFilePath = id.slice("FILE--".length);
			}
		});

		try {
			setIsSavingToNotebook(true);

			if (existingFilePath) {
				// Load the existing notebook, append the new cell, and save back.
				const notebookPath = existingFilePath;
				const loadResponse = await room.runRoomPixel<[string]>(
					`GetInsightAssets(filePath=[${JSON.stringify(notebookPath)}]);`,
					false,
					false,
				);
				const existingContent =
					loadResponse.pixelReturn[0]?.output ?? "";
				const updatedContent =
					appendCellToNotebook(existingContent, code, langStr) ??
					createNotebookFileContent(code, langStr);
				await room.runRoomPixel(
					`SaveInsightAssets(filePath=[${JSON.stringify(notebookPath)}], content=["<encode>${updatedContent}</encode>"]);`,
					false,
					false,
				);
				notifyFileEditorRefresh(
					notebookPath,
					`INSIGHT:${room.insightId}`,
				);
				const existingFileName =
					notebookPath.split("/").pop() ?? notebookPath;
				toast.success(`Appended to notebook ${existingFileName}`);
				// addSidebarNode focuses the tab if it already exists.
				room.addSidebarNode(`FILE--${notebookPath}`, {
					type: "tab",
					name: existingFileName,
					component: "room-file-editor",
					config: {
						name: existingFileName,
						path: notebookPath,
						initialTab: "preview",
					},
					enableClose: true,
				});
			} else {
				// No open notebook found — create a new one (original behaviour).
				const filePath = createNotebookFilePath();
				const notebookContent = createNotebookFileContent(
					code,
					langStr,
				);
				await room.runRoomPixel(
					`SaveInsightAssets(filePath=[${JSON.stringify(filePath)}], content=["<encode>${notebookContent}</encode>"]);`,
					false,
					false,
				);
				notifyFileEditorRefresh(filePath, `INSIGHT:${room.insightId}`);
				const fileName = filePath.split("/").pop() ?? filePath;
				toast.success(`Added to notebook as ${fileName}`);
				// Open the saved notebook in the sidebar's file editor, defaulting
				// to the Preview tab so the interactive notebook shows immediately.
				room.addSidebarNode(`FILE--${filePath}`, {
					type: "tab",
					name: fileName,
					component: "room-file-editor",
					config: {
						name: fileName,
						path: filePath,
						initialTab: "preview",
					},
					enableClose: true,
				});
			}
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
						disabled={!room || !code || isSavingToRoom}
						onClick={() => void saveInRoom()}
					>
						{isSavingToRoom ? "Saving..." : "Save In Room"}
					</Button>
					<Button
						className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!room || !code || isSavingToNotebook}
						onClick={() => void saveAsNotebook()}
					>
						{isSavingToNotebook ? "Adding..." : "Add to Notebook"}
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
						{/* Cap the rendered height so a really large response
						    scrolls within the block instead of stretching the
						    whole chat message. CellOutputBlock's popout still
						    opens the full result in a viewport-sized modal. */}
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
		</>
	);
};
