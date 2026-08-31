import {
	ChevronDownIcon,
	CopyIcon,
	FileCodeIcon,
	NotebookPenIcon,
	PlayIcon,
	SaveIcon,
} from "lucide-react";
import { type ComponentProps, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { CellOutputBlock, unwrapPixelOutput } from "@semoss/shared";
import {
	Button,
	Code,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import type { RoomStore } from "@/stores";
import { copyToClipboard } from "@/utility/clipboard";
import { BlockHeader } from "./block-header";
import {
	buildExecutePixel,
	CODE_LANG_EXT,
	CODE_LANG_LABELS,
	formatExecuteOutput,
	MAX_EXECUTE_LOG_CHARS,
	RESPONSE_BLOCK_MAX_HEIGHT,
} from "./constants";
import { SaveCodeNotebookDialog } from "./save-code-notebook-dialog";
import { SaveFileDialog } from "./save-file-dialog";
import { useStickToBottom } from "./use-stick-to-bottom";

interface CodePreviewBlockProps {
	/** The code block's source text. */
	code: string;
	/** Shiki-safe language used for syntax highlighting */
	language: ComponentProps<typeof Code>["language"];
	/** Original language token from the fence (used for label + filename) */
	rawLanguage?: string;
	/** Room store used to execute code and save/append to notebooks. */
	room?: RoomStore;
}

/**
 * A chat code block with actions: syntax-highlighted preview, run server-side
 * (Python / R / pixel), copy, save to the room, a full-screen view, and an
 * "Add to Notebook" flow that appends the run as a cell to a new or existing
 * .ipynb.
 */
export const CodePreviewBlock = ({
	code,
	language,
	rawLanguage,
	room,
}: CodePreviewBlockProps) => {
	const { t } = useTranslation("chat");
	const [isFullViewOpen, setIsFullViewOpen] = useState(false);
	const [isAddToNotebookOpen, setIsAddToNotebookOpen] = useState(false);
	const [isSaveCodeDialogOpen, setIsSaveCodeDialogOpen] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);
	// the block is height capped, so it follows its own newest line
	const codeScroll = useStickToBottom(code);
	const [isExecuting, setIsExecuting] = useState(false);
	const [executeResult, setExecuteResult] = useState<
		| React.ComponentProps<typeof SaveCodeNotebookDialog>["result"]
		| undefined
	>(undefined);

	const langStr = rawLanguage ?? language ?? "txt";
	const normalizedLang = langStr.toLowerCase();
	const canSaveAsNotebook =
		normalizedLang === "py" || normalizedLang === "python";
	const codeExtension =
		(CODE_LANG_EXT[normalizedLang] ?? normalizedLang) || "txt";
	const langLabel = CODE_LANG_LABELS[langStr] ?? langStr.toUpperCase();
	const executePixel = buildExecutePixel(langStr, code);
	const canExecute = executePixel !== null;

	/** Opens the save-as dialog with a generated default name. */
	const openSaveCodeDialog = () => {
		setIsSaveCodeDialogOpen(true);
	};

	/**
	 * Run the code block server-side, streaming console logs into state and
	 * mapping the final result (or error) into the output panel.
	 */
	const execute = async () => {
		if (!room || !executePixel) {
			return;
		}
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
			const message =
				error instanceof Error && error.message
					? error.message
					: "Error";
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

	return (
		<>
			<div className="relative overflow-clip rounded-md border border-border bg-background">
				<BlockHeader
					label={langLabel}
					isCollapsed={isCollapsed}
					onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
					collapseDisabled={!code}
				>
					{canExecute && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									className="text-muted-foreground text-xs hover:text-foreground"
									variant="ghost"
									size="sm"
									disabled={!room || isExecuting}
									onClick={() => void execute()}
								>
									{isExecuting ? (
										<Spinner className="size-3" />
									) : (
										<PlayIcon className="size-3" />
									)}
									{isExecuting ? "Running" : "Run"}
								</Button>
							</TooltipTrigger>
							<TooltipContent>Run the script</TooltipContent>
						</Tooltip>
					)}

					{canSaveAsNotebook ? (
						<DropdownMenu>
							<Tooltip>
								<TooltipTrigger asChild>
									<DropdownMenuTrigger asChild>
										<Button
											className="text-muted-foreground text-xs hover:text-foreground"
											variant="ghost"
											size="sm"
											disabled={!room || !code}
										>
											<SaveIcon className="size-3" />

											<ChevronDownIcon className="size-3" />
										</Button>
									</DropdownMenuTrigger>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									Save
								</TooltipContent>
							</Tooltip>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>Save</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={openSaveCodeDialog}>
									<FileCodeIcon />
									Code
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => setIsAddToNotebookOpen(true)}
								>
									<NotebookPenIcon />
									Notebook
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									className="text-muted-foreground text-xs hover:text-foreground"
									variant="ghost"
									size="sm"
									disabled={!room || !code}
									onClick={openSaveCodeDialog}
								>
									<SaveIcon className="size-3" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">Save</TooltipContent>
						</Tooltip>
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
						disabled={!code}
						onClick={() => setIsFullViewOpen(true)}
					>
						Full View
					</Button>
				</BlockHeader>
				{!isCollapsed && (
					<div className="p-3">
						<div className="-mb-7 sticky top-2 z-10 float-right ml-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className="h-6 gap-1 px-2 text-muted-foreground text-xs hover:text-foreground"
										variant="ghost"
										size="sm"
										disabled={!code}
										onClick={() =>
											void copyToClipboard(
												code,
												() =>
													toast.success(
														t(
															"notifications.copySuccess",
														),
													),
												(msg) => toast.error(msg),
											)
										}
									>
										<CopyIcon className="size-3.5" />
										Copy
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									Copy
								</TooltipContent>
							</Tooltip>
						</div>
						{/* Cap to the HTML preview height so long code scrolls in place. */}
						<div
							ref={codeScroll.ref}
							onScroll={codeScroll.onScroll}
							className="overflow-auto"
							style={{ maxHeight: RESPONSE_BLOCK_MAX_HEIGHT }}
						>
							<Code code={code} language={language ?? "txt"} />
						</div>
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
								onClick={() => setExecuteResult(undefined)}
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
				<DialogContent className="h-dvh max-h-dvh w-dvw max-w-dvw grid-rows-[auto_1fr] overflow-hidden rounded-none border-0 p-3 sm:w-dvw sm:max-w-dvw">
					<DialogHeader>
						<DialogTitle>{langLabel}</DialogTitle>
					</DialogHeader>
					<div className="relative h-full min-h-0 overflow-auto">
						<Code code={code} language={language ?? "txt"} />
					</div>
				</DialogContent>
			</Dialog>

			<SaveCodeNotebookDialog
				open={isAddToNotebookOpen}
				onOpenChange={setIsAddToNotebookOpen}
				code={code}
				result={executeResult}
				room={room}
			/>

			<SaveFileDialog
				open={isSaveCodeDialogOpen}
				content={code}
				onClose={() => setIsSaveCodeDialogOpen(false)}
				room={room}
				extension={codeExtension}
			/>
		</>
	);
};
