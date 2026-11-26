import {
	CopyIcon,
	ExpandIcon,
	EyeIcon,
	PencilIcon,
	SaveIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { HtmlPreview } from "@semoss/shared";
import {
	Button,
	Code,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility/clipboard";
import type { RoomStore } from "@/stores";
import { BlockHeader } from "./block-header";
import {
	RESPONSE_BLOCK_MAX_HEIGHT,
	RESPONSE_BLOCK_MIN_HEIGHT,
} from "./constants";
import { SaveFileDialog } from "./save-file-dialog";
import { useHtmlPreviewStream } from "./use-html-preview-stream";
import { useStickToBottom } from "./use-stick-to-bottom";

interface HtmlPreviewBlockProps {
	html: string;
	room?: RoomStore;
	isLoading?: boolean;
	copyTooltip: string;
	copySuccessMessage: string;
}

export const HtmlPreviewBlock = ({
	html,
	room,
	isLoading,
	copyTooltip,
	copySuccessMessage,
}: HtmlPreviewBlockProps) => {
	const [isFullViewOpen, setIsFullViewOpen] = useState(false);
	const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isRaw, setIsRaw] = useState(false);
	// the raw view is height capped, so it follows its own newest line
	const rawScroll = useStickToBottom(html);
	const previewHtml = useHtmlPreviewStream(html, !!isLoading);
	const fullViewButtonRef = useRef<HTMLButtonElement>(null);

	return (
		<>
			<div className="relative overflow-hidden rounded-md border border-border bg-background">
				<BlockHeader
					label="HTML Preview"
					isCollapsed={isCollapsed}
					onToggleCollapse={() =>
						setIsCollapsed((previous) => !previous)
					}
					collapseDisabled={!html}
				>
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								className="text-muted-foreground text-xs hover:text-foreground"
								variant="ghost"
								size="sm"
								disabled={!html}
								onClick={() => setIsRaw((prev) => !prev)}
								aria-label={
									isRaw ? "Switch to Preview" : "Edit HTML"
								}
							>
								{isRaw ? (
									<EyeIcon aria-hidden className="size-3" />
								) : (
									<PencilIcon
										aria-hidden
										className="size-3"
									/>
								)}
								{isRaw ? "Preview" : "Edit"}
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{isRaw ? "Switch to Preview" : "Edit HTML"}
						</TooltipContent>
					</Tooltip>
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								ref={fullViewButtonRef}
								className="text-muted-foreground text-xs hover:text-foreground"
								variant="ghost"
								size="sm"
								disabled={!html}
								aria-label="Full View"
								onClick={() => setIsFullViewOpen(true)}
							>
								<ExpandIcon aria-hidden className="size-3" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">Full View</TooltipContent>
					</Tooltip>
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								className="text-muted-foreground text-xs hover:text-foreground"
								variant="ghost"
								size="sm"
								disabled={!room || !html || isLoading}
								aria-label="Save in Room"
								onClick={() => setIsSaveDialogOpen(true)}
							>
								<SaveIcon aria-hidden className="size-3" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							Save in Room
						</TooltipContent>
					</Tooltip>
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								className="text-muted-foreground text-xs hover:text-foreground"
								variant="ghost"
								size="sm"
								disabled={!html || isLoading}
								aria-label={copyTooltip}
								onClick={() =>
									void copyTextToClipboard(html, {
										onSuccess: () =>
											toast.success(copySuccessMessage),
										onError: (message) =>
											toast.error(message),
									})
								}
							>
								<CopyIcon aria-hidden className="size-3" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{copyTooltip}
						</TooltipContent>
					</Tooltip>
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
										Loading Preview...
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
						<DialogTitle>HTML Preview</DialogTitle>
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
									Loading Preview...
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
