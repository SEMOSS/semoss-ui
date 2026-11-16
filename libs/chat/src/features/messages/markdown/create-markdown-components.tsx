import { Download } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	type Code,
	H1,
	H2,
	H3,
	H4,
	type Markdown,
	P,
	ScrollArea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { downloadBlob } from "@semoss/utility/browser";
import { escapeCsvValue } from "@semoss/utility/csv";
import type { RoomStore } from "../../room/room.store";
import { BlockHeader } from "./block-header";
import { CodePreviewBlock } from "./code-preview-block";
import { KNOWN_SHIKI_LANGS } from "./constants";
import { MermaidBlock } from "./mermaid-block";
import { NotebookPreviewBlock } from "./notebook-preview-block";

/** The element renderers react-markdown takes. */
type MarkdownComponents = NonNullable<
	ComponentProps<typeof Markdown>["components"]
>;

/** The parts of a markdown syntax node a blockquote reads its text from. */
type BlockQuoteNode = {
	/** The node's kind, such as `paragraph` or `text`. */
	type?: string;
	/** A text node's text. */
	value?: string;
	/** The node's child nodes. */
	children?: unknown[];
};

/** What react-markdown passes the blockquote renderer. */
type BlockQuoteProps = ComponentProps<"blockquote"> & {
	/** The rendered quote. */
	children?: ReactNode;
	/** The quote's syntax node. */
	node?: unknown;
};

/**
 * Builds the `urlTransform` for anything rendered as assistant content.
 * Unmatched urls are rewritten to "", leaving the link inert.
 *
 * @param allowedUrlPrefixes - The theme's extra allowed prefixes, beside
 * `room://`, http(s), `mailto:`, and in-page anchors.
 * @returns The transform.
 */
export const createMarkdownUrlTransform =
	(allowedUrlPrefixes?: string[]) =>
	(url: string): string => {
		if (url.startsWith("room://")) return url;
		if (allowedUrlPrefixes?.some((prefix) => url.startsWith(prefix)))
			return url;
		if (/^(https?:|mailto:|#)/.test(url)) return url;
		return "";
	};

/**
 * The renderers for a response's markdown: headings, text, and lists in the
 * chat's type scale; `room://` links that open the room's files; a
 * `source:` quote as a small note; fenced code as a code, mermaid, or
 * notebook block; and tables with a collapse toggle and optional CSV export.
 *
 * @param room - The room links open in and blocks run and save in.
 * @param isPreviewLoading - Whether the text is still streaming, so mermaid
 * and notebook blocks wait to render.
 * @param enableTableExport - Whether tables offer Export CSV.
 * @returns The renderers.
 */
export const createMarkdownComponents = (
	room?: RoomStore,
	isPreviewLoading?: boolean,
	enableTableExport?: boolean,
): MarkdownComponents => ({
	h1: ({ children, ...props }) => (
		<H1 className="mt-5 font-semibold text-2xl text-inherit" {...props}>
			{children}
		</H1>
	),
	h2: ({ children, ...props }) => (
		<H2 className="mt-4 font-semibold text-inherit text-xl" {...props}>
			{children}
		</H2>
	),
	h3: ({ children, ...props }) => (
		<H3 className="mt-4 text-inherit text-lg" {...props}>
			{children}
		</H3>
	),
	h4: ({ children, ...props }) => (
		<H4 className="mt-3 text-inherit text-lg" {...props}>
			{children}
		</H4>
	),
	h5: ({ children, ...props }) => (
		<h5
			className="mt-2 scroll-m-20 font-semibold text-base text-inherit tracking-tight"
			{...props}
		>
			{children}
		</h5>
	),
	h6: ({ children, ...props }) => (
		<h6
			className="mt-2 scroll-m-20 font-medium text-base text-inherit tracking-tight"
			{...props}
		>
			{children}
		</h6>
	),
	p: ({ children, ...props }) => (
		<P className="mt-2 text-base text-inherit" {...props}>
			{children}
		</P>
	),
	a: ({ children, href, ...props }) => {
		if (href?.startsWith("room://") && room) {
			const path = `/${href.slice("room://".length)}`;

			// Folder link — ends with "/"
			if (path.endsWith("/")) {
				return (
					<button
						type="button"
						className="cursor-pointer font-medium text-base text-primary underline underline-offset-1"
						onClick={() => {
							room.openSidebarFileExplorer(path);
						}}
					>
						{children}
					</button>
				);
			}

			// File link
			const filename = path.split("/").filter(Boolean).pop() ?? path;
			return (
				<button
					type="button"
					className="cursor-pointer font-medium text-base text-primary underline underline-offset-1"
					onClick={() => {
						room.openSidebarFileExplorer();
						room.openFileSidebarPanel(path, filename);
					}}
				>
					{children}
				</button>
			);
		}
		return (
			<a
				href={href}
				className="font-medium text-base text-primary underline underline-offset-1"
				target="_blank"
				rel="noopener noreferrer"
				{...props}
			>
				{children}
			</a>
		);
	},
	ul: ({ children, ...props }) => (
		<ul
			className="my-1 ms-4 list-disc text-base text-inherit [&>li]:mt-1"
			{...props}
		>
			{children}
		</ul>
	),
	ol: ({ children, ...props }) => (
		<ol
			className="my-1 ms-4 list-decimal text-base text-inherit [&>li]:mt-1"
			{...props}
		>
			{children}
		</ol>
	),
	li: ({ children, ...props }) => (
		<li className="text-base text-inherit" {...props}>
			{children}
		</li>
	),
	blockquote: ({ children, node, ...props }: BlockQuoteProps) => {
		// the quote's plain text, to tell a `Source:` note from a quote
		const nodeChildren = (node as BlockQuoteNode | undefined)?.children;
		const text =
			nodeChildren
				?.flatMap((child) => {
					const typedChild = child as BlockQuoteNode;
					return typedChild.type === "paragraph"
						? (typedChild.children ?? [])
						: [typedChild];
				})
				.map((child) => {
					const typedChild = child as BlockQuoteNode;
					return typedChild.type === "text"
						? (typedChild.value ?? "")
						: "";
				})
				.join("") ?? "";

		if (/^source:/i.test(text.trim())) {
			return (
				<p className="mt-2 text-muted-foreground text-xs italic">
					{children}
				</p>
			);
		}

		return (
			<blockquote
				className="ms-6 mt-1 border-border border-s-2 ps-3 text-base text-foreground italic"
				{...props}
			>
				{children}
			</blockquote>
		);
	},
	code: ({ children, className, ...props }) => {
		// react-markdown sets className to "language-<lang>" on fenced code blocks.
		// Inline code (single backtick) has no className, so match will be null.
		const match = /language-(\w+)/.exec(className || "");
		// During streaming children can briefly be undefined before content arrives.
		// String() coerces undefined/null to "" so Shiki never receives a non-string.
		const code = children != null ? String(children) : "";

		// Inline code — no language class means this is a `backtick` snippet inside
		// a paragraph. Return a plain <code> so we don't nest a <div> inside a <p>.
		if (!match?.[1]) {
			return (
				<code className={className} {...props}>
					{children}
				</code>
			);
		}

		// Fenced code block — render the full UI with copy button and syntax highlighting.
		// During streaming the language token builds up incrementally (e.g. "h" →
		// "ht" → "htm" → "html"). Shiki throws on unknown IDs, so normalise to
		// "txt" for anything not in our known-language set.
		const rawLang = match[1].toLowerCase();
		const lang = (
			KNOWN_SHIKI_LANGS.has(rawLang) ? rawLang : "txt"
		) as ComponentProps<typeof Code>["language"];

		if (rawLang === "mermaid") {
			return (
				<MermaidBlock
					code={code}
					isLoading={isPreviewLoading}
					room={room}
				/>
			);
		}

		if (rawLang === "ipynb" || rawLang === "notebook") {
			return (
				<NotebookPreviewBlock
					content={code}
					isLoading={isPreviewLoading}
					room={room}
				/>
			);
		}

		return (
			<CodePreviewBlock
				code={code}
				language={lang}
				rawLanguage={rawLang}
				room={room}
			/>
		);
	},
	// react-markdown renders each renderer as a component, so the table's hooks hold
	table: ({ className, ...props }) => {
		const tableRef = useRef<HTMLTableElement>(null);
		const [isCollapsed, setIsCollapsed] = useState(false);
		const { t } = useTranslation("chat");

		/** Download the table's cells as a CSV file. */
		const handleExportCsv = () => {
			const table = tableRef.current;
			if (!table) return;

			const rows = Array.from(table.querySelectorAll("tr"));
			const csv = rows
				.map((row) =>
					Array.from(row.querySelectorAll("th, td"))
						.map((cell) => escapeCsvValue(cell.textContent ?? ""))
						.join(","),
				)
				.join("\n");

			const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
			const date = new Date().toISOString().slice(0, 10);
			downloadBlob(blob, `table_response_${date}.csv`);
		};

		return (
			<div className="overflow-hidden rounded-md border border-border bg-background">
				<BlockHeader
					label={t("blocks.table")}
					isCollapsed={isCollapsed}
					onToggleCollapse={() => setIsCollapsed((v) => !v)}
				>
					{enableTableExport && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									className="-my-1 h-6 px-2 text-muted-foreground text-xs hover:text-foreground"
									variant="ghost"
									size="sm"
									aria-label={t("blocks.exportToCsv")}
									onClick={handleExportCsv}
								>
									<Download className="size-3.5" />
									{t("blocks.exportCsv")}
								</Button>
							</TooltipTrigger>
							<TooltipContent side="left">
								{t("blocks.downloadAsCsv")}
							</TooltipContent>
						</Tooltip>
					)}
				</BlockHeader>
				{!isCollapsed && (
					<ScrollArea
						className="w-full"
						scrollOrientation="horizontal"
					>
						<table
							ref={tableRef}
							data-slot="table"
							className={`min-w-full caption-bottom text-sm${className ? ` ${className}` : ""}`}
							{...props}
						/>
					</ScrollArea>
				)}
			</div>
		);
	},
});
