import { Download } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useRef, useState } from "react";
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
import type { RoomStore } from "@/stores";
import { BlockHeader } from "./block-header";
import { CodePreviewBlock } from "./code-preview-block";
import { KNOWN_SHIKI_LANGS } from "./constants";
import { MermaidBlock } from "./mermaid-block";

type MarkdownComponents = NonNullable<
	ComponentProps<typeof Markdown>["components"]
>;

type BlockQuoteNode = {
	type?: string;
	value?: string;
	children?: unknown[];
};

type BlockQuoteProps = ComponentProps<"blockquote"> & {
	children?: ReactNode;
	node?: unknown;
};

export const createMarkdownComponents = (
	room?: RoomStore,
	isHtmlPreviewLoading?: boolean,
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
							room.addSidebarNode(`FILE_EXPLORER--${path}`, {
								type: "tab",
								name: "Files",
								component: "room-file-explorer",
								config: { initialPath: path },
								enableClose: true,
							});
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
						room.addSidebarNode("FILE_EXPLORER", {
							type: "tab",
							name: "Files",
							component: "room-file-explorer",
							config: {},
							enableClose: true,
						});
						room.addSidebarNode(`FILE--${path}`, {
							type: "tab",
							name: filename,
							component: "room-file-editor",
							config: { name: filename, path },
							enableClose: true,
						});
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
					isLoading={isHtmlPreviewLoading}
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
	table: ({ className, ...props }) => {
		const tableRef = useRef<HTMLTableElement>(null);
		const [isCollapsed, setIsCollapsed] = useState(false);

		const exportCsv = () => {
			const table = tableRef.current;
			if (!table) return;

			const rows = Array.from(table.querySelectorAll("tr"));
			const csv = rows
				.map((row) =>
					Array.from(row.querySelectorAll("th, td"))
						.map((cell) => {
							const text = (cell.textContent ?? "").replace(
								/"/g,
								'""',
							);
							return `"${text}"`;
						})
						.join(","),
				)
				.join("\n");

			const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
			const url = URL.createObjectURL(blob);
			const date = new Date().toISOString().slice(0, 10);
			const a = document.createElement("a");
			a.href = url;
			a.download = `table_response_${date}.csv`;
			a.click();
			URL.revokeObjectURL(url);
		};

		return (
			<div className="overflow-hidden rounded-md border border-border bg-background">
				<BlockHeader
					label="Table"
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
									aria-label="Export to CSV"
									onClick={exportCsv}
								>
									<Download className="size-3.5" />
									Export CSV
								</Button>
							</TooltipTrigger>
							<TooltipContent side="left">
								Download as CSV
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
