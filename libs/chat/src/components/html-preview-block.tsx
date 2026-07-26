import { type CSSProperties, lazy, Suspense, useEffect, useState } from "react";
import { Code, Spinner } from "@semoss/ui/next";
import { BlockHeader } from "./block-header";
import { CopyButton } from "./copy-button";
import { FullViewDialog } from "./full-view-dialog";

/**
 * Lazy-loaded so `@codesandbox/sandpack-react` (a full sandboxed bundler
 * client, ~1MB minified — the single largest dependency in this package)
 * is never in the initial bundle for apps that don't hit this path, same
 * reasoning as MermaidBlock's `import("mermaid")`. Sandpack is a component
 * tree rather than a plain async function, so this uses `React.lazy` +
 * `Suspense` instead of a bare dynamic import.
 */
const SandpackHtmlPreview = lazy(() => import("./sandpack-html-preview"));

function SandpackPreviewFallback({ style }: { style?: CSSProperties }) {
	return (
		<div
			className="flex items-center justify-center"
			style={{ height: "62.5dvh", minHeight: "8rem", ...style }}
		>
			<Spinner />
		</div>
	);
}

/**
 * A still-streaming HTML fence can end mid-tag or mid-script/style block —
 * feeding that straight to Sandpack renders a broken preview for a moment.
 * Ported from playground's html-preview-block.tsx (same regexes), minus its
 * iframe scroll-position-sync script and per-chunk throttle timer — those
 * exist there to smooth a live typewriter-reveal effect this library
 * doesn't have; @semoss/chat's own 300ms streaming poll is already coarse
 * enough that re-rendering on every safe chunk needs no extra debounce.
 */
function isPreviewChunkSafe(value: string): boolean {
	if (!value.trim()) return false;

	const hasUnclosedInlineScript =
		/<script(?![^>]*\bsrc\s*=)[^>]*>(?![\s\S]*<\/script\s*>)/i.test(value);
	if (hasUnclosedInlineScript) return false;

	const hasUnclosedStyle = /<style[^>]*>(?![\s\S]*<\/style\s*>)/i.test(value);
	if (hasUnclosedStyle) return false;

	const endsWithPartialTag = /<[^>]*$/.test(value);
	if (endsWithPartialTag) return false;

	return true;
}

export interface HtmlPreviewBlockProps {
	html: string;
	/** The owning message's streaming status — while true, only advances the rendered preview to snapshots of `html` that pass isPreviewChunkSafe. */
	isLoading?: boolean;
}

/** Renders a ```html fenced code block as a live Sandpack preview with a Raw/Preview toggle, Full View, and Copy — dispatched from markdown-components.tsx's `code` override, matching playground's own create-markdown-components.tsx. Room-scoped "Save In Room" is deliberately not ported (see MermaidBlock). */
export function HtmlPreviewBlock({ html, isLoading }: HtmlPreviewBlockProps) {
	const [isFullViewOpen, setIsFullViewOpen] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isRaw, setIsRaw] = useState(false);
	const [renderedHtml, setRenderedHtml] = useState(() =>
		isLoading ? (isPreviewChunkSafe(html) ? html : "") : html,
	);

	useEffect(() => {
		if (!isLoading) {
			setRenderedHtml(html);
			return;
		}
		if (isPreviewChunkSafe(html)) {
			setRenderedHtml(html);
		}
	}, [html, isLoading]);

	return (
		<>
			<div className="relative overflow-hidden rounded-md border border-border bg-background">
				<BlockHeader
					label="HTML Preview"
					isCollapsed={isCollapsed}
					onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
				>
					<button
						type="button"
						disabled={!html}
						onClick={() => setIsRaw((prev) => !prev)}
						className="-my-1 h-6 rounded-sm px-2 text-muted-foreground text-xs transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
					>
						{isRaw ? "Preview" : "Raw"}
					</button>
					<button
						type="button"
						disabled={!html}
						onClick={() => setIsFullViewOpen(true)}
						className="-my-1 h-6 rounded-sm px-2 text-muted-foreground text-xs transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
					>
						Full View
					</button>
					<CopyButton value={html} label="Copy HTML" />
				</BlockHeader>
				{!isCollapsed &&
					(isRaw ? (
						<div className="p-3">
							<Code code={html} language="html" />
						</div>
					) : (
						<Suspense fallback={<SandpackPreviewFallback />}>
							<SandpackHtmlPreview
								html={renderedHtml}
								providerClassName="min-h-0"
								className="w-full"
								style={{ height: "62.5dvh", minHeight: "8rem" }}
							/>
						</Suspense>
					))}
			</div>
			<FullViewDialog
				title="HTML Preview"
				open={isFullViewOpen}
				onOpenChange={setIsFullViewOpen}
			>
				<Suspense
					fallback={
						<SandpackPreviewFallback
							style={{ height: "100%", minHeight: 0 }}
						/>
					}
				>
					<SandpackHtmlPreview
						html={renderedHtml}
						providerClassName="h-full min-h-0"
						className="h-full min-h-0 w-full"
						style={{ height: "100%", minHeight: 0 }}
						forceFullHeight
					/>
				</Suspense>
			</FullViewDialog>
		</>
	);
}
