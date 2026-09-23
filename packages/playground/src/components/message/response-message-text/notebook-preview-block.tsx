import {
	CopyIcon,
	ExpandIcon,
	EyeIcon,
	PencilIcon,
	PlayIcon,
	SaveIcon,
	SquareIcon,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Notebook,
	type NotebookHandle,
	type NotebookState,
	validateNotebook,
} from "@semoss/shared";
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
import { copyToClipboard } from "@/utility/clipboard";
import { BlockHeader } from "./block-header";
import { SaveFileDialog } from "./save-file-dialog";

interface NotebookPreviewBlockProps {
	/** Raw `.ipynb` JSON from the fenced block. */
	content: string;
	/** True while the message chunk is still streaming (JSON may be incomplete). */
	isLoading?: boolean;
	/** Room store; interactive editing/running requires an active room. */
	room?: RoomStore;
}

/**
 * A chat block that renders a fenced `.ipynb` payload as the interactive shared
 * Notebook (run cells, edit, save to the room). Falls back to a read-only JSON
 * view while streaming, when the JSON can't be parsed, or without a room.
 */
export const NotebookPreviewBlock = ({
	content,
	isLoading,
	room,
}: NotebookPreviewBlockProps) => {
	const { t } = useTranslation("chat");
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isRaw, setIsRaw] = useState(false);
	const [isFullViewOpen, setIsFullViewOpen] = useState(false);
	const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
	// Serialized notebook captured when the save dialog opens.
	const [saveContent, setSaveContent] = useState("");
	// Live state pushed up from the Notebook to drive the header Run/Stop.
	const [notebookState, setNotebookState] = useState<NotebookState>({
		isRunning: false,
		runProgress: null,
		hasCodeCells: false,
		hasOutputs: false,
	});
	// Handle to read the live (edited) notebook JSON for saving.
	const notebookRef = useRef<NotebookHandle>(null);
	const fullViewNotebookRef = useRef<NotebookHandle>(null);

	// Only mount the interactive Notebook once the JSON parses cleanly; while
	// streaming the payload is incomplete, so validation fails and we show JSON.
	const isValidNotebook = useMemo(() => {
		if (isLoading) {
			return false;
		}
		try {
			validateNotebook(content);
			return true;
		} catch {
			return false;
		}
	}, [content, isLoading]);

	const showNotebook = isValidNotebook && !!room && !isRaw;
	const isRunning = showNotebook && notebookState.isRunning;

	const openSaveDialog = () => {
		setSaveContent(notebookRef.current?.save() || content);
		setIsSaveDialogOpen(true);
	};

	return (
		<>
			<div className="relative overflow-hidden rounded-md border border-border bg-background">
				<BlockHeader
					label="Notebook"
					isCollapsed={isCollapsed}
					onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
					collapseDisabled={!content}
				>
					{isRunning ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									className="-my-1 h-6 px-2 text-destructive text-xs hover:text-destructive"
									variant="ghost"
									size="sm"
									aria-label={
										notebookState.runProgress
											? `Stop (${notebookState.runProgress.current} / ${notebookState.runProgress.total})`
											: "Stop"
									}
									onClick={() =>
										void notebookRef.current?.interrupt()
									}
								>
									<SquareIcon className="size-3" /> Stop
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{notebookState.runProgress
									? `Stop (${notebookState.runProgress.current} / ${notebookState.runProgress.total})`
									: "Stop"}
							</TooltipContent>
						</Tooltip>
					) : (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
									variant="ghost"
									size="sm"
									disabled={
										!showNotebook ||
										!notebookState.hasCodeCells
									}
									aria-label="Run all"
									onClick={() =>
										void notebookRef.current?.runAll()
									}
								>
									<PlayIcon className="size-3" /> Run
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								Run all
							</TooltipContent>
						</Tooltip>
					)}

					<Button
						className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!isValidNotebook || !room}
						onClick={() => setIsRaw((prev) => !prev)}
					>
						{isRaw ? (
							<EyeIcon className="size-3" />
						) : (
							<PencilIcon className="size-3" />
						)}
						{isRaw ? "Notebook" : "Edit"}
					</Button>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
								variant="ghost"
								size="sm"
								disabled={!content}
								aria-label="Copy notebook"
								onClick={() =>
									void copyToClipboard(
										content,
										() =>
											toast.success(
												t("notifications.copySuccess"),
											),
										(msg) => toast.error(msg),
									)
								}
							>
								<CopyIcon className="size-3" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">Copy</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
								variant="ghost"
								size="sm"
								disabled={!isValidNotebook || !room}
								aria-label="Save notebook to room"
								onClick={openSaveDialog}
							>
								<SaveIcon className="size-3" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">Save</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
								variant="ghost"
								size="sm"
								disabled={!content}
								aria-label="Full view"
								onClick={() => setIsFullViewOpen(true)}
							>
								<ExpandIcon className="size-3" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">Full view</TooltipContent>
					</Tooltip>
				</BlockHeader>
				{!isCollapsed &&
					(showNotebook ? (
						<div className="h-[60vh]">
							<Notebook
								ref={notebookRef}
								content={content}
								onStateChange={setNotebookState}
							/>
						</div>
					) : (
						<div className="p-3">
							<Code code={content} language="json" />
						</div>
					))}
				<SaveFileDialog
					open={isSaveDialogOpen}
					content={saveContent}
					extension="ipynb"
					onClose={() => setIsSaveDialogOpen(false)}
					room={room}
				/>
			</div>

			<Dialog open={isFullViewOpen} onOpenChange={setIsFullViewOpen}>
				<DialogContent className="h-dvh max-h-dvh w-dvw max-w-dvw grid-rows-[auto_1fr] overflow-hidden rounded-none border-0 p-3 sm:w-dvw sm:max-w-dvw">
					<DialogHeader>
						<DialogTitle>Notebook</DialogTitle>
					</DialogHeader>
					<div className="relative h-full min-h-0 overflow-hidden">
						{showNotebook ? (
							<Notebook
								ref={fullViewNotebookRef}
								content={content}
								onStateChange={() => {}}
							/>
						) : (
							<Code code={content} language="json" />
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};
