import { CopyIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	type Code,
	H1,
	H2,
	H3,
	H4,
	type Markdown,
	P,
	ScrollArea,
	toast,
} from "@semoss/ui/next";
import type { RoomStore } from "@/stores";
import { copyToClipboard } from "./clipboard";
import { CodePreviewBlock } from "./code-preview-block";
import { KNOWN_SHIKI_LANGS } from "./constants";
import { HtmlPreviewBlock } from "./html-preview-block";
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
			className="my-1 ml-4 list-disc text-base text-inherit [&>li]:mt-1"
			{...props}
		>
			{children}
		</ul>
	),
	ol: ({ children, ...props }) => (
		<ol
			className="my-1 ml-4 list-decimal text-base text-inherit [&>li]:mt-1"
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
				className="mt-1 ml-6 border-border border-l-2 pl-3 text-base text-foreground italic"
				{...props}
			>
				{children}
			</blockquote>
		);
	},
	code: ({ children, className, ...props }) => {
		const { t } = useTranslation("chat");
		// react-markdown sets className to "language-<lang>" on fenced code blocks.
		// Inline code (single backtick) has no className, so match will be null.
		const match = /language-(\w+)/.exec(className || "");
		// During streaming children can briefly be undefined before content arrives.
		// String() coerces undefined/null to "" so Shiki never receives a non-string.
		const code = children != null ? String(children) : "";
		console.log("Inline code value:", code);
		// Inline code — no language class means this is a `backtick` snippet inside
		// a paragraph. Return a plain <code> so we don't nest a <div> inside a <p>.
		if (!match?.[1]) {
			const InlineCode = () => {
				const [isHovered, setIsHovered] = useState(false);

				return (
					// biome-ignore lint/a11y/noStaticElementInteractions: Hover detection for showing copy button (actual button has proper a11y)
					<span
						className="group/inline-code relative inline-flex items-center"
						onMouseEnter={() => setIsHovered(true)}
						onMouseLeave={() => setIsHovered(false)}
					>
						<code className={className} {...props}>
							{children}
						</code>
						{isHovered && code && (
							<button
								type="button"
								className="ml-1 inline-flex size-4 items-center justify-center rounded bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
								onClick={() => {
									console.log(code);
									void copyToClipboard(
										code,
										() =>
											toast.success(
												t("notifications.copySuccess"),
											),
										(msg) => toast.error(msg),
									);
								}}
								aria-label="Copy inline code"
							>
								<CopyIcon className="size-3" />
							</button>
						)}
					</span>
				);
			};

			return <InlineCode />;
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

		if (lang === "html") {
			return (
				<HtmlPreviewBlock
					html={code}
					room={room}
					isLoading={isHtmlPreviewLoading}
					copyTooltip="Copy"
					copySuccessMessage={t("notifications.copySuccess")}
					copyLabel="Copy"
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
	table: ({ className, ...props }) => (
		<ScrollArea className="w-full" scrollOrientation="horizontal">
			<table
				data-slot="table"
				className={`min-w-full caption-bottom text-sm${className ? ` ${className}` : ""}`}
				{...props}
			/>
		</ScrollArea>
	),
});
