import {
	CopyIcon,
	ExpandIcon,
	EyeIcon,
	PencilIcon,
	SaveIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { HtmlPreview } from "@semoss/shared";
import {
	Code,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility/clipboard";
import type { RoomStore } from "../../../room/store/room.store";
import { TooltipButton } from "../../tooltip-button";
import { BlockHeader } from "./block-header";
import {
	RESPONSE_BLOCK_MAX_HEIGHT,
	RESPONSE_BLOCK_MIN_HEIGHT,
} from "./constants";
import { SaveFileDialog } from "./save-file-dialog";
import { useHtmlPreviewStream } from "./use-html-preview-stream";
import { useStickToBottom } from "./use-stick-to-bottom";

/** Props for {@link HtmlPreviewBlock}. */
interface HtmlPreviewBlockProps {
	/** The block's HTML, which may still be streaming. */
	html: string;
	/** The room whose files Save writes to; without it Save is disabled. */
	room?: RoomStore;
	/** Whether the HTML is still streaming, so the preview updates on a throttle. */
	isLoading?: boolean;
}

/**
 * An HTML block in a response, previewed in a sandbox with Raw, Full View,
 * Save, and Copy. While it streams, the preview takes only complete chunks,
 * at most once per throttle; Copy and Save always use the original HTML.
 */
export const HtmlPreviewBlock = ({
	html,
	room,
	isLoading,
}: HtmlPreviewBlockProps) => {
	const { t } = useTranslation("chat");
	const [isFullViewOpen, setIsFullViewOpen] = useState(false);
	const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isRaw, setIsRaw] = useState(false);
	// the raw view is height capped, so it follows its own newest line
	const rawScroll = useStickToBottom(html);
	const previewHtml = useHtmlPreviewStream(html, !!isLoading);
	// focus goes back to Full View when its dialog closes
	const fullViewButtonRef = useRef<HTMLButtonElement>(null);

	return (
		<>
			<div className="relative overflow-hidden rounded-md border border-border bg-background">
				<BlockHeader
					label={t("blocks.htmlPreview")}
					isCollapsed={isCollapsed}
					onToggleCollapse={() =>
						setIsCollapsed((previous) => !previous)
					}
					isCollapseDisabled={!html}
				>
					<TooltipButton
						className="text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!html}
						onClick={() => setIsRaw((prev) => !prev)}
						aria-label={
							isRaw
								? t("blocks.switchToPreview")
								: t("blocks.editHtml")
						}
						tooltip={
							isRaw
								? t("blocks.switchToPreview")
								: t("blocks.editHtml")
						}
						tooltipSide="bottom"
						isTooltipHoverable
					>
						{isRaw ? (
							<EyeIcon aria-hidden className="size-3" />
						) : (
							<PencilIcon aria-hidden className="size-3" />
						)}
						{isRaw ? t("blocks.preview") : t("blocks.edit")}
					</TooltipButton>
					<TooltipButton
						ref={fullViewButtonRef}
						className="text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!html}
						aria-label={t("response.fullView")}
						onClick={() => setIsFullViewOpen(true)}
						tooltip={t("response.fullView")}
						tooltipSide="bottom"
						isTooltipHoverable
					>
						<ExpandIcon aria-hidden className="size-3" />
					</TooltipButton>
					<TooltipButton
						className="text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!room || !html || isLoading}
						aria-label={t("response.saveInRoom")}
						onClick={() => setIsSaveDialogOpen(true)}
						tooltip={t("response.saveInRoom")}
						tooltipSide="bottom"
						isTooltipHoverable
					>
						<SaveIcon aria-hidden className="size-3" />
					</TooltipButton>
					<TooltipButton
						className="text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!html || isLoading}
						aria-label={t("response.copy")}
						onClick={() =>
							void copyTextToClipboard(html, {
								onSuccess: () =>
									toast.success(
										t("notifications.copySuccess"),
									),
								onError: (message) => toast.error(message),
							})
						}
						tooltip={t("response.copy")}
						tooltipSide="bottom"
						isTooltipHoverable
					>
						<CopyIcon aria-hidden className="size-3" />
					</TooltipButton>
				</BlockHeader>
				{!isCollapsed &&
					(isRaw ? (
						// capped to the same height the preview uses, so switching
						// between them does not resize the message, and anything
						// longer scrolls inside the block
						<div
							ref={rawScroll.ref}
							onScroll={rawScroll.onScroll}
							className="overflow-auto p-3"
							style={{
								maxHeight: RESPONSE_BLOCK_MAX_HEIGHT,
								minHeight: RESPONSE_BLOCK_MIN_HEIGHT,
							}}
						>
							<Code code={html} language="html" />
						</div>
					) : (
						<div className="relative">
							<HtmlPreview
								html={previewHtml}
								providerClassName="min-h-0"
								className="w-full"
								style={{
									height: RESPONSE_BLOCK_MAX_HEIGHT,
									minHeight: RESPONSE_BLOCK_MIN_HEIGHT,
								}}
							/>
							{isLoading && (
								<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
									<output className="flex items-center gap-2 rounded-md border border-border/70 bg-background/75 px-3 py-1 font-medium text-muted-foreground text-xs shadow-sm">
										<Spinner
											aria-hidden
											className="size-3"
										/>
										{t("blocks.loadingPreview")}
									</output>
								</div>
							)}
						</div>
					))}
			</div>
			<Dialog open={isFullViewOpen} onOpenChange={setIsFullViewOpen}>
				<DialogContent
					showOverlay={false}
					aria-describedby={undefined}
					onCloseAutoFocus={(event) => {
						event.preventDefault();
						fullViewButtonRef.current?.focus();
					}}
					className="inset-0 top-0 left-0 h-dvh max-h-dvh w-dvw max-w-none translate-x-0 translate-y-0 gap-3 overflow-hidden rounded-none border-0 p-3 sm:max-w-none"
				>
					<DialogHeader className="shrink-0 pe-8">
						<DialogTitle>{t("blocks.htmlPreview")}</DialogTitle>
					</DialogHeader>
					<div className="relative min-h-0 flex-1 overflow-hidden">
						<HtmlPreview
							html={previewHtml}
							providerClassName="h-full min-h-0"
							className="h-full min-h-0 w-full"
							style={{ height: "100%", minHeight: 0 }}
							forceFullHeight
						/>
						{isLoading && (
							<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
								<output className="flex items-center gap-2 rounded-md border border-border/70 bg-background/75 px-3 py-1 font-medium text-muted-foreground text-xs shadow-sm">
									<Spinner aria-hidden className="size-3" />
									{t("blocks.loadingPreview")}
								</output>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
			<SaveFileDialog
				open={isSaveDialogOpen}
				content={html}
				onClose={() => setIsSaveDialogOpen(false)}
				room={room}
				extension="html"
			/>
		</>
	);
};
