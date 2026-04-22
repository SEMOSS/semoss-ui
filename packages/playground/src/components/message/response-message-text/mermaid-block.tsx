import { CopyIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

/**
 * Mermaid bakes fixed pixel width/height attributes and a max-width inline
 * style onto the root <svg> element. Those fight CSS sizing, so strip them
 * before storing — the viewBox is preserved, so aspect ratio stays correct.
 */
function normalizeMermaidSvg(svg: string): string {
	return svg
		.replace(/(<svg\b[^>]*?)\s+width="[^"]*"/i, "$1")
		.replace(/(<svg\b[^>]*?)\s+height="[^"]*"/i, "$1")
		.replace(/(<svg\b[^>]*?style="[^"]*?)max-width:[^;}"]*;?\s*/i, "$1");
}

interface MermaidBlockProps {
	code: string;
	isLoading?: boolean;
	room?: RoomStore;
}

export const MermaidBlock = ({ code, isLoading, room }: MermaidBlockProps) => {
	const [svg, setSvg] = useState<string | null>(null);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isFullViewOpen, setIsFullViewOpen] = useState(false);
	const [isSavingToRoom, setIsSavingToRoom] = useState(false);
	const [isRaw, setIsRaw] = useState(false);
	const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`);

	useEffect(() => {
		// Don't attempt to render while the definition is still streaming —
		// incomplete syntax reliably throws inside mermaid.render().
		if (isLoading || !code.trim()) return;

		let cancelled = false;
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
				if (!cancelled) setSvg(normalizeMermaidSvg(rendered));
			})
			.catch(() => {
				// svg stays null — showCode fallback renders the raw definition
			});

		return () => {
			cancelled = true;
		};
	}, [code, isLoading]);

	const saveInRoom = async () => {
		if (!room || !code) return;
		const filePath = `save-mermaid-response-${Date.now()}.mmd`;
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

	// Show raw code while streaming, rendering, on error, or when user toggled Raw.
	const showCode = isLoading || !svg || isRaw;

	return (
		<>
			<div className="relative overflow-hidden rounded-md border border-border bg-background">
				<BlockHeader
					label="Mermaid"
					isCollapsed={isCollapsed}
					onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
					collapseDisabled={!code}
				>
					<Button
						className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={isLoading || !svg}
						onClick={() => setIsRaw((prev) => !prev)}
					>
						{isRaw ? "Diagram" : "Raw"}
					</Button>
					<Button
						className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!svg}
						onClick={() => setIsFullViewOpen(true)}
					>
						Full View
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
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="-my-1 -mr-2 h-6 gap-1 px-2 text-muted-foreground text-xs hover:text-foreground"
								variant="ghost"
								size="sm"
								disabled={!code}
								onClick={() =>
									void copyToClipboard(
										code,
										() => toast.success("Copied"),
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
				{!isCollapsed &&
					(showCode ? (
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
				<DialogContent className="h-[100dvh] max-h-[100dvh] w-[100dvw] max-w-[100dvw] grid-rows-[auto_1fr] overflow-hidden rounded-none border-0 p-3 sm:w-[100dvw] sm:max-w-[100dvw]">
					<DialogHeader>
						<DialogTitle>Mermaid</DialogTitle>
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
