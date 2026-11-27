import { CopyIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
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
import { TooltipButton } from "../../tooltip-button";
import { BlockHeader } from "./block-header";

/**
 * Mermaid bakes fixed pixel width/height attributes and a max-width inline
 * style onto the root <svg> element. Those fight CSS sizing, so strip them
 * before storing — the viewBox is preserved, so aspect ratio stays correct.
 *
 * @param svg - The SVG mermaid rendered.
 * @returns The SVG without its fixed size.
 */
function normalizeMermaidSvg(svg: string): string {
	return svg
		.replace(/(<svg\b[^>]*?)\s+width="[^"]*"/i, "$1")
		.replace(/(<svg\b[^>]*?)\s+height="[^"]*"/i, "$1")
		.replace(/(<svg\b[^>]*?style="[^"]*?)max-width:[^;}"]*;?\s*/i, "$1");
}

/** Props for {@link MermaidBlock}. */
interface MermaidBlockProps {
	/** The diagram's mermaid definition. */
	code: string;
	/** Whether the definition is still streaming, so it is not rendered yet. */
	isLoading?: boolean;
	/** The room whose files Save in Room writes to; without it the action is disabled. */
	room?: RoomStore;
}

/**
 * A mermaid code block in a response, drawn as its diagram once it has
 * streamed, with Raw, Full View, Save in Room, and Copy.
 */
export const MermaidBlock = ({ code, isLoading, room }: MermaidBlockProps) => {
	const { t } = useTranslation("chat");
	const [svg, setSvg] = useState<string | null>(null);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isFullViewOpen, setIsFullViewOpen] = useState(false);
	const [isSavingToRoom, setIsSavingToRoom] = useState(false);
	const [isRaw, setIsRaw] = useState(false);
	// mermaid needs an id per render target
	const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`);

	useEffect(() => {
		// Don't attempt to render while the definition is still streaming —
		// incomplete syntax reliably throws inside mermaid.render().
		if (isLoading || !code.trim()) return;

		let isCancelled = false;
		setSvg(null);

		import("mermaid")
			.then(({ default: mermaid }) => {
				const isDark =
					document.documentElement.classList.contains("dark");
				mermaid.initialize({
					startOnLoad: false,
					theme: isDark ? "dark" : "default",
				});
				return mermaid.render(idRef.current, code);
			})
			.then(({ svg: rendered }) => {
				if (!isCancelled) setSvg(normalizeMermaidSvg(rendered));
			})
			.catch(() => {
				// svg stays null — shouldShowCode fallback renders the raw definition
			});

		return () => {
			isCancelled = true;
		};
	}, [code, isLoading]);

	/** Save the definition to the room's files as a `.mmd` file. */
	const handleSaveInRoom = async () => {
		if (!room || !code) return;
		const filePath = `save-mermaid-response-${Date.now()}.mmd`;
		try {
			setIsSavingToRoom(true);
			await room.runRoomPixel(
				`SaveInsightAssets(filePath=[${JSON.stringify(filePath)}], content=["<encode>${code}</encode>"]);`,
				{ showLoading: false, setErrorOnFail: false },
			);
			toast.success(t("notifications.savedInRoom", { filePath }));
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("blocks.error");

			toast.error(message);
		} finally {
			setIsSavingToRoom(false);
		}
	};

	// Show raw code while streaming, rendering, on error, or when user toggled Raw.
	const shouldShowCode = isLoading || !svg || isRaw;

	return (
		<>
			<div className="relative overflow-hidden rounded-md border border-border bg-background">
				<BlockHeader
					label={t("blocks.mermaid")}
					isCollapsed={isCollapsed}
					onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
					isCollapseDisabled={!code}
				>
					<Button
						className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={isLoading || !svg}
						onClick={() => setIsRaw((prev) => !prev)}
					>
						{isRaw ? t("response.diagram") : t("response.raw")}
					</Button>
					<Button
						className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!svg}
						onClick={() => setIsFullViewOpen(true)}
					>
						{t("response.fullView")}
					</Button>
					<Button
						className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!room || !code || isSavingToRoom}
						onClick={() => void handleSaveInRoom()}
					>
						{isSavingToRoom
							? t("response.savingToRoom")
							: t("response.saveInRoom")}
					</Button>
					<TooltipButton
						className="-my-1 -me-2 h-6 gap-1 px-2 text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!code}
						onClick={() =>
							void copyTextToClipboard(code, {
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
						<CopyIcon className="size-3.5" />
						{t("response.copy")}
					</TooltipButton>
				</BlockHeader>
				{!isCollapsed &&
					(shouldShowCode ? (
						<div className="p-3">
							<Code code={code} language="txt" />
						</div>
					) : (
						<div
							className="overflow-x-auto p-4 [&>svg]:h-auto [&>svg]:w-full"
							// mermaid.render() returns a sanitised SVG string
							// biome-ignore lint/security/noDangerouslySetInnerHtml: mermaid output is sanitized
							dangerouslySetInnerHTML={{ __html: svg }}
						/>
					))}
			</div>
			<Dialog open={isFullViewOpen} onOpenChange={setIsFullViewOpen}>
				<DialogContent className="h-dvh max-h-dvh w-dvw max-w-dvw grid-rows-[auto_1fr] overflow-hidden rounded-none border-0 p-3 sm:w-dvw sm:max-w-dvw">
					<DialogHeader>
						<DialogTitle>{t("blocks.mermaid")}</DialogTitle>
					</DialogHeader>
					<div className="relative h-full min-h-0 overflow-auto p-4 [&>div>svg]:h-auto [&>div>svg]:w-full">
						{svg && (
							<div
								// biome-ignore lint/security/noDangerouslySetInnerHtml: mermaid output is sanitized
								dangerouslySetInnerHTML={{ __html: svg }}
							/>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};
