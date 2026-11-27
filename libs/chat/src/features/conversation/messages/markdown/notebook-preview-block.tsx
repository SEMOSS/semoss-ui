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
	toast,
} from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility/clipboard";
import type { RoomStore } from "../../../room/store/room.store";
import { NEW_INSIGHT_ID } from "../../../room/store/room-placeholders";
import { TooltipButton } from "../../tooltip-button";
import { BlockHeader } from "./block-header";
import { SaveFileDialog } from "./save-file-dialog";

/** Props for {@link NotebookPreviewBlock}. */
interface NotebookPreviewBlockProps {
	/** Raw `.ipynb` JSON from the fenced block. */
	content: string;
	/** True while the message chunk is still streaming (JSON may be incomplete). */
	isLoading?: boolean;
	/**
	 * Room store; the interactive notebook runs in its insight, so it needs a
	 * room that has one.
	 */
	room?: RoomStore;
}

/**
 * A chat block that renders a fenced `.ipynb` payload as the interactive shared
 * Notebook (run cells, edit, save to the room). Falls back to a read-only JSON
 * view while streaming, when the JSON can't be parsed, or without a room with
 * an insight (a new chat's draft before it is prepared).
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

	// cells run in the room's insight, which a new chat's draft does not have
	// until it is prepared, so it shows the JSON until then
	const hasInsight = !!room && room.insightId !== NEW_INSIGHT_ID;
	const shouldShowNotebook = isValidNotebook && hasInsight && !isRaw;
	const isRunning = shouldShowNotebook && notebookState.isRunning;

	/** Open Save with the notebook as edited, or the block's JSON before it mounts. */
	const handleOpenSaveDialog = () => {
		setSaveContent(notebookRef.current?.save() || content);
		setIsSaveDialogOpen(true);
	};

	return (
		<>
			<div className="relative overflow-hidden rounded-md border border-border bg-background">
				<BlockHeader
					label={t("blocks.notebook")}
					isCollapsed={isCollapsed}
					onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
					isCollapseDisabled={!content}
				>
					{isRunning ? (
						<TooltipButton
							className="-my-1 h-6 px-2 text-destructive text-xs hover:text-destructive"
							variant="ghost"
							size="sm"
							aria-label={
								notebookState.runProgress
									? t(
											"blocks.stopProgress",
											notebookState.runProgress,
										)
									: t("blocks.stop")
							}
							onClick={() =>
								void notebookRef.current?.interrupt()
							}
							tooltip={
								notebookState.runProgress
									? t(
											"blocks.stopProgress",
											notebookState.runProgress,
										)
									: t("blocks.stop")
							}
							tooltipSide="bottom"
						>
							<SquareIcon className="size-3" /> {t("blocks.stop")}
						</TooltipButton>
					) : (
						<TooltipButton
							className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
							variant="ghost"
							size="sm"
							disabled={
								!shouldShowNotebook ||
								!notebookState.hasCodeCells
							}
							aria-label={t("blocks.runAll")}
							onClick={() => void notebookRef.current?.runAll()}
							tooltip={t("blocks.runAll")}
							tooltipSide="bottom"
						>
							<PlayIcon className="size-3" /> {t("blocks.run")}
						</TooltipButton>
					)}

					<Button
						className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!isValidNotebook || !hasInsight}
						onClick={() => setIsRaw((prev) => !prev)}
					>
						{isRaw ? (
							<EyeIcon className="size-3" />
						) : (
							<PencilIcon className="size-3" />
						)}
						{isRaw ? t("blocks.notebook") : t("blocks.edit")}
					</Button>
					<TooltipButton
						className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!content}
						aria-label={t("blocks.copyNotebook")}
						onClick={() =>
							void copyTextToClipboard(content, {
								onSuccess: () =>
									toast.success(
										t("notifications.copySuccess"),
									),
								onError: (msg) => toast.error(msg),
							})
						}
						tooltip={t("response.copy")}
						tooltipSide="bottom"
					>
						<CopyIcon className="size-3" />
					</TooltipButton>
					<TooltipButton
						className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!isValidNotebook || !room}
						aria-label={t("blocks.saveNotebookToRoom")}
						onClick={handleOpenSaveDialog}
						tooltip={t("common:buttons.save")}
						tooltipSide="bottom"
					>
						<SaveIcon className="size-3" />
					</TooltipButton>
					<TooltipButton
						className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!content}
						aria-label={t("response.fullView")}
						onClick={() => setIsFullViewOpen(true)}
						tooltip={t("response.fullView")}
						tooltipSide="bottom"
					>
						<ExpandIcon className="size-3" />
					</TooltipButton>
				</BlockHeader>
				{!isCollapsed &&
					(shouldShowNotebook ? (
						<div className="h-[60vh]">
							<Notebook
								ref={notebookRef}
								content={content}
								insightId={room?.insightId ?? ""}
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
						<DialogTitle>{t("blocks.notebook")}</DialogTitle>
					</DialogHeader>
					<div className="relative h-full min-h-0 overflow-hidden">
						{shouldShowNotebook ? (
							<Notebook
								ref={fullViewNotebookRef}
								content={content}
								insightId={room?.insightId ?? ""}
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
