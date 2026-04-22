import { CopyIcon, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { createHtmlResponseFilePath } from "./constants";
import { SandpackHtmlPreview } from "./sandpack-html-preview";

interface HtmlPreviewBlockProps {
	html: string;
	room?: RoomStore;
	isLoading?: boolean;
	copyTooltip: string;
	copySuccessMessage: string;
	copyLabel: string;
}

const HTML_PREVIEW_STREAM_THROTTLE_MS = 120;

const PREVIEW_SCROLL_SYNC_SCRIPT =
	"<script>" +
	"(function(){" +
	"var channel='__PREVIEW_CHANNEL__';" +
	"var key='playground-html-preview-scroll-'+channel;" +
	"var threshold=24;" +
	"function getScroller(){return document.scrollingElement||document.documentElement||document.body;}" +
	"function clamp(v,min,max){return Math.max(min,Math.min(max,v));}" +
	"function isAtBottom(el){return el.scrollHeight-el.clientHeight-el.scrollTop<=threshold;}" +
	"function readState(){try{var raw=sessionStorage.getItem(key);return raw?JSON.parse(raw):null;}catch(_err){return null;}}" +
	"function writeState(el){try{sessionStorage.setItem(key,JSON.stringify({scrollTop:el.scrollTop,scrollHeight:el.scrollHeight,atBottom:isAtBottom(el)}));}catch(_err){}}" +
	"function restoreState(el){var state=readState();if(!state){el.scrollTop=el.scrollHeight;writeState(el);return;}if(state.atBottom){el.scrollTop=el.scrollHeight;writeState(el);return;}var max=Math.max(0,el.scrollHeight-el.clientHeight);var top=typeof state.scrollTop==='number'?state.scrollTop:0;el.scrollTop=clamp(top,0,max);writeState(el);}" +
	"function init(){var el=getScroller();restoreState(el);window.addEventListener('scroll',function(){writeState(el);},{passive:true});window.addEventListener('pagehide',function(){writeState(el);});setTimeout(function(){writeState(el);},120);}" +
	"if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init,{once:true});}else{init();}" +
	"})();" +
	"</script>";

const injectPreviewScrollSync = (html: string, channel: string): string => {
	const script = PREVIEW_SCROLL_SYNC_SCRIPT.replace(
		/__PREVIEW_CHANNEL__/g,
		channel,
	);
	const bodyCloseIndex = html.lastIndexOf("</body>");
	return bodyCloseIndex !== -1
		? html.slice(0, bodyCloseIndex) + script + html.slice(bodyCloseIndex)
		: html + script;
};

const isPreviewChunkSafe = (value: string): boolean => {
	if (!value.trim()) return false;

	const hasUnclosedInlineScript =
		/<script(?![^>]*\bsrc\s*=)[^>]*>(?![\s\S]*<\/script\s*>)/i.test(value);
	if (hasUnclosedInlineScript) return false;

	const hasUnclosedStyle = /<style[^>]*>(?![\s\S]*<\/style\s*>)/i.test(value);
	if (hasUnclosedStyle) return false;

	const endsWithPartialTag = /<[^>]*$/.test(value);
	if (endsWithPartialTag) return false;

	return true;
};

export const HtmlPreviewBlock = ({
	html,
	room,
	isLoading,
	copyTooltip,
	copySuccessMessage,
	copyLabel,
}: HtmlPreviewBlockProps) => {
	const [isFullViewOpen, setIsFullViewOpen] = useState(false);
	const [isSavingToRoom, setIsSavingToRoom] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isRaw, setIsRaw] = useState(false);
	const [streamedHtml, setStreamedHtml] = useState(() =>
		isLoading ? (isPreviewChunkSafe(html) ? html : "") : html,
	);

	const previewChannelRef = useRef(
		`html-preview-${Math.random().toString(36).slice(2, 10)}`,
	);
	const latestSafeHtmlRef = useRef(streamedHtml);
	const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isLoadingRef = useRef(!!isLoading);

	useEffect(() => {
		isLoadingRef.current = !!isLoading;
	}, [isLoading]);

	useEffect(() => {
		if (!isLoading) {
			if (flushTimerRef.current) {
				clearTimeout(flushTimerRef.current);
				flushTimerRef.current = null;
			}
			latestSafeHtmlRef.current = html;
			setStreamedHtml(html);
			return;
		}

		if (!isPreviewChunkSafe(html)) {
			return;
		}

		latestSafeHtmlRef.current = html;

		if (!streamedHtml) {
			setStreamedHtml(html);
			return;
		}

		if (!flushTimerRef.current) {
			flushTimerRef.current = setTimeout(() => {
				flushTimerRef.current = null;
				if (!isLoadingRef.current) return;
				setStreamedHtml(latestSafeHtmlRef.current);
			}, HTML_PREVIEW_STREAM_THROTTLE_MS);
		}
	}, [html, isLoading, streamedHtml]);

	useEffect(() => {
		return () => {
			if (flushTimerRef.current) {
				clearTimeout(flushTimerRef.current);
			}
		};
	}, []);

	const previewHtml = isLoading ? streamedHtml : html;
	const sandpackHtml = useMemo(() => {
		return injectPreviewScrollSync(previewHtml, previewChannelRef.current);
	}, [previewHtml]);

	const saveInRoom = async () => {
		if (!room || !html) {
			return;
		}

		const filePath = createHtmlResponseFilePath();
		try {
			setIsSavingToRoom(true);

			await room.runRoomPixel(
				`SaveInsightAssets(filePath=[${JSON.stringify(filePath)}], content=["<encode>${html}</encode>"]);`,
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
					<Button
						className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!html}
						onClick={() => setIsRaw((prev) => !prev)}
					>
						{isRaw ? "Preview" : "Raw"}
					</Button>
					<Button
						className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={isLoading}
						onClick={() => setIsFullViewOpen(true)}
					>
						Full View
					</Button>
					<Button
						className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
						variant="ghost"
						size="sm"
						disabled={!room || !html || isSavingToRoom || isLoading}
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
								disabled={!html || isLoading}
								onClick={() =>
									void copyToClipboard(
										html,
										() => toast.success(copySuccessMessage),
										(message) => toast.error(message),
									)
								}
							>
								<CopyIcon className="size-3.5" />
								{copyLabel}
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{copyTooltip}
						</TooltipContent>
					</Tooltip>
				</BlockHeader>
				{!isCollapsed &&
					(isRaw ? (
						<div className="p-3">
							<Code code={html} language="html" />
						</div>
					) : (
						<div className="relative">
							<SandpackHtmlPreview
								html={sandpackHtml}
								providerClassName="min-h-0"
								className="w-full"
								style={{
									height: "62.5dvh",
									minHeight: "8rem",
								}}
							/>
							{isLoading && (
								<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
									<div className="flex items-center gap-2 rounded-md border border-border/70 bg-background/75 px-3 py-1 font-medium text-[11px] text-muted-foreground uppercase tracking-[0.08em] shadow-sm">
										<Loader2 className="size-3 animate-spin" />
										Loading Preview...
									</div>
								</div>
							)}
						</div>
					))}
			</div>
			<Dialog open={isFullViewOpen} onOpenChange={setIsFullViewOpen}>
				<DialogContent
					showOverlay={false}
					className="!inset-0 !top-0 !left-0 !flex !h-[100dvh] !max-h-[100dvh] !w-[100dvw] !max-w-[100dvw] !translate-x-0 !translate-y-0 !flex-col !gap-3 !overflow-hidden !rounded-none !border-0 !p-3 sm:!w-[100dvw] sm:!max-w-[100dvw]"
				>
					<DialogHeader className="shrink-0 pr-8">
						<DialogTitle>HTML Preview</DialogTitle>
					</DialogHeader>
					<div className="relative min-h-0 flex-1 overflow-hidden">
						<SandpackHtmlPreview
							html={sandpackHtml}
							providerClassName="h-full min-h-0"
							className="h-full min-h-0 w-full"
							style={{ height: "100%", minHeight: 0 }}
							forceFullHeight
						/>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};
