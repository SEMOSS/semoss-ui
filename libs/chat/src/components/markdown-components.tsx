import { DownloadIcon } from "lucide-react";
import { type ComponentProps, useRef, useState } from "react";
import { cn } from "@semoss/ui";
import {
	Code,
	CodeContainer,
	type Markdown,
	ScrollArea,
} from "@semoss/ui/next";
import { ChatHeader } from "./chat-header";
import { CopyButton } from "./copy-button";
import { FullViewDialog } from "./full-view-dialog";
import { HtmlPreviewBlock } from "./html-preview-block";
import { MermaidBlock } from "./mermaid-block";

type MarkdownComponents = NonNullable<
	ComponentProps<typeof Markdown>["components"]
>;

/** Every language libs/ui/src/next/code.tsx's Shiki instance actually registers — anything else falls back to "txt" rather than throwing. */
const KNOWN_CODE_LANGUAGES = new Set([
	"text",
	"txt",
	"jsx",
	"tsx",
	"javascript",
	"js",
	"typescript",
	"ts",
	"html",
	"css",
	"python",
	"py",
	"json",
	"java",
	"markdown",
	"md",
	"yaml",
	"yml",
	"xml",
	"sh",
	"bash",
	"csv",
	"tsv",
]);

type CodeLanguage = ComponentProps<typeof Code>["language"];

interface BlockQuoteNode {
	type?: string;
	tagName?: string;
	value?: string;
	children?: unknown[];
}

/**
 * Detects a source:-prefixed blockquote by walking the node's text
 * content. Playground's own create-markdown-components.tsx checks
 * `type === "paragraph"`/`type === "text"` (mdast shape) — but
 * @semoss/ui/next's Markdown always runs rehypeRaw, which converts the
 * tree to hast *before* components render, so the real node shape here is
 * `{ type: "element", tagName: "p" }` for a paragraph, not
 * `{ type: "paragraph" }`. Confirmed empirically (logged the actual node)
 * rather than assumed — this matches what react-markdown actually hands
 * our components in this setup, not playground's source verbatim.
 */
function extractBlockquoteText(node: unknown): string {
	const children = (node as BlockQuoteNode | undefined)?.children;
	return (
		children
			?.flatMap((child) => {
				const typed = child as BlockQuoteNode;
				return typed.type === "element" && typed.tagName === "p"
					? (typed.children ?? [])
					: [typed];
			})
			.map((child) => {
				const typed = child as BlockQuoteNode;
				return typed.type === "text" ? (typed.value ?? "") : "";
			})
			.join("") ?? ""
	);
}

function MarkdownBlockquote({
	children,
	node,
	...props
}: ComponentProps<"blockquote"> & { node?: unknown }) {
	const text = extractBlockquoteText(node);

	if (/^source:/i.test(text.trim())) {
		// A <div>, not playground's own <p> — `children` here already
		// includes a nested <p> from the default paragraph handler, and a
		// <p> inside a <p> is invalid HTML (React warns on it); a <div>
		// gets the identical visual/text result without that.
		return (
			<div className="text-muted-foreground text-xs italic">
				{children}
			</div>
		);
	}

	return (
		<blockquote
			className="ms-6 border-border border-s-2 ps-3 text-sm italic"
			{...props}
		>
			{children}
		</blockquote>
	);
}

function CodeBlock({
	code,
	language,
}: {
	code: string;
	language?: CodeLanguage;
}) {
	const [isFullViewOpen, setIsFullViewOpen] = useState(false);
	const label = language ?? "code";

	return (
		<>
			<div className="overflow-hidden rounded-md border border-border bg-background p-4">
				<ChatHeader label={label}>
					<button
						type="button"
						onClick={() => setIsFullViewOpen(true)}
						className="-my-1 h-6 rounded-sm px-2 text-muted-foreground text-xs transition-colors hover:text-foreground"
					>
						Full View
					</button>
					<CopyButton value={code} label="Copy code" />
				</ChatHeader>
				<CodeContainer>
					<Code code={code} language={language} />
				</CodeContainer>
			</div>
			<FullViewDialog
				title={label}
				open={isFullViewOpen}
				onOpenChange={setIsFullViewOpen}
			>
				<Code code={code} language={language} />
			</FullViewDialog>
		</>
	);
}

function createMarkdownCode(isLoading: boolean | undefined) {
	return function MarkdownCode({
		children,
		className,
	}: ComponentProps<"code"> & { node?: unknown }) {
		const match = /language-(\w+)/.exec(className || "");
		const code = children != null ? String(children) : "";

		// Inline (single-backtick) code has no language class — plain <code>,
		// same as @semoss/ui/next's own Markdown default for this case.
		if (!match?.[1]) {
			return <code className={className}>{children}</code>;
		}

		const rawLang = match[1].toLowerCase();

		if (rawLang === "mermaid") {
			return <MermaidBlock code={code} isLoading={isLoading} />;
		}

		const language = (
			KNOWN_CODE_LANGUAGES.has(rawLang) ? rawLang : "txt"
		) as CodeLanguage;

		if (language === "html") {
			return <HtmlPreviewBlock html={code} isLoading={isLoading} />;
		}

		return <CodeBlock code={code} language={language} />;
	};
}

function csvEscape(value: string): string {
	return `"${value.replace(/"/g, '""')}"`;
}

function exportTableAsCsv(table: HTMLTableElement): void {
	const rows = Array.from(table.querySelectorAll("tr"));
	const csv = rows
		.map((row) =>
			Array.from(row.querySelectorAll("th, td"))
				.map((cell) => csvEscape(cell.textContent ?? ""))
				.join(","),
		)
		.join("\n");

	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = "table_response.csv";
	anchor.click();
	URL.revokeObjectURL(url);
}

function MarkdownTable({
	className,
	...props
}: ComponentProps<"table"> & { node?: unknown }) {
	const tableRef = useRef<HTMLTableElement>(null);
	const [isCollapsed, setIsCollapsed] = useState(false);

	return (
		<div className="overflow-hidden rounded-md border border-border bg-background">
			<ChatHeader
				label="Table"
				isCollapsed={isCollapsed}
				onToggleCollapse={() => setIsCollapsed((value) => !value)}
			>
				<button
					type="button"
					onClick={() => {
						if (tableRef.current) {
							exportTableAsCsv(tableRef.current);
						}
					}}
					aria-label="Export to CSV"
					className="inline-flex items-center gap-1 rounded-sm px-1 text-muted-foreground transition-colors hover:text-foreground"
				>
					<DownloadIcon className="size-3.5" />
					Export CSV
				</button>
			</ChatHeader>
			{!isCollapsed && (
				<ScrollArea className="w-full" scrollOrientation="horizontal">
					<table
						ref={tableRef}
						data-slot="table"
						className={cn(
							"min-w-full caption-bottom text-sm",
							className,
						)}
						{...props}
					/>
				</ScrollArea>
			)}
		</div>
	);
}

/**
 * The `components` override passed to @semoss/ui/next's Markdown —
 * layered on top of its already-solid defaults (headings, lists, GFM
 * tables via remark-gfm, rehypeRaw for embedded HTML, Shiki-highlighted
 * code via its own `code`/`pre` handling). Matches playground's real
 * create-markdown-components.tsx behavior: source:-prefixed citation
 * styling, a copyable/labeled+full-view code block (dispatching to
 * MermaidBlock/HtmlPreviewBlock for ```mermaid/```html fences, exactly
 * like playground's own `code` override does), and a collapsible/
 * exportable table. `isLoading` (the owning message's streaming status)
 * is threaded through to Mermaid/HTML-preview so they can skip attempting
 * to render a still-incomplete fence — mirrors playground's
 * `isHtmlPreviewLoading`, just derived from `ChatMessage.status` instead
 * of a typewriter-reveal state this library doesn't have.
 */
export function createMarkdownComponents(
	isLoading?: boolean,
): MarkdownComponents {
	return {
		blockquote: MarkdownBlockquote,
		code: createMarkdownCode(isLoading),
		table: MarkdownTable,
	};
}
