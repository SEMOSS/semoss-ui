import { useEffect, useRef, useState } from "react";
import { Code } from "@semoss/ui/next";
import { ChatHeader } from "./chat-header";
import { CopyButton } from "./copy-button";
import { FullViewDialog } from "./full-view-dialog";

/**
 * Mermaid bakes fixed pixel width/height attributes and a max-width inline
 * style onto the root <svg> element. Those fight CSS sizing, so strip them
 * before storing — the viewBox is preserved, so aspect ratio stays correct.
 * Ported verbatim from playground's mermaid-block.tsx.
 */
function normalizeMermaidSvg(svg: string): string {
	return svg
		.replace(/(<svg\b[^>]*?)\s+width="[^"]*"/i, "$1")
		.replace(/(<svg\b[^>]*?)\s+height="[^"]*"/i, "$1")
		.replace(/(<svg\b[^>]*?style="[^"]*?)max-width:[^;}"]*;?\s*/i, "$1");
}

export interface MermaidBlockProps {
	code: string;
	/** The owning message's streaming status — skips rendering a still-incomplete diagram definition, which reliably throws inside mermaid.render(). */
	isLoading?: boolean;
}

/** Renders a ```mermaid fenced code block as a diagram (lazy-loads `mermaid` so it's never in the initial bundle for apps that don't hit this path) with a Raw/Diagram toggle, Full View, and Copy — dispatched from markdown-components.tsx's `code` override, matching playground's own create-markdown-components.tsx. Room-scoped "Save In Room" is deliberately not ported — that needs a real room/pixel-execution context this library doesn't have (see docs/chat-components/PLAN.md's deferred items). */
export function MermaidBlock({ code, isLoading }: MermaidBlockProps) {
	const [svg, setSvg] = useState<string | null>(null);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isFullViewOpen, setIsFullViewOpen] = useState(false);
	const [isRaw, setIsRaw] = useState(false);
	const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`);

	useEffect(() => {
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
				// svg stays null — the raw-code fallback below renders the
				// definition instead of a broken diagram.
			});

		return () => {
			cancelled = true;
		};
	}, [code, isLoading]);

	// Show raw code while streaming, rendering, on error, or when user toggled Raw.
	const showCode = isLoading || !svg || isRaw;

	return (
		<>
			<div className="relative overflow-hidden rounded-md border border-border bg-background">
				<ChatHeader
					label="Mermaid"
					isCollapsed={isCollapsed}
					onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
				>
					<button
						type="button"
						disabled={isLoading || !svg}
						onClick={() => setIsRaw((prev) => !prev)}
						className="-my-1 h-6 rounded-sm px-2 text-muted-foreground text-xs transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
					>
						{isRaw ? "Diagram" : "Raw"}
					</button>
					<button
						type="button"
						disabled={!svg}
						onClick={() => setIsFullViewOpen(true)}
						className="-my-1 h-6 rounded-sm px-2 text-muted-foreground text-xs transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
					>
						Full View
					</button>
					<CopyButton value={code} label="Copy Mermaid definition" />
				</ChatHeader>
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
							dangerouslySetInnerHTML={{ __html: svg ?? "" }}
						/>
					))}
			</div>
			<FullViewDialog
				title="Mermaid"
				open={isFullViewOpen}
				onOpenChange={setIsFullViewOpen}
			>
				{svg && (
					<div
						className="[&>svg]:h-auto [&>svg]:w-full"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: mermaid output is sanitized
						dangerouslySetInnerHTML={{ __html: svg }}
					/>
				)}
			</FullViewDialog>
		</>
	);
}
