import { load as parseYaml } from "js-yaml";
import * as React from "react";
import { type Components, default as ReactMarkdown } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Code, CodeContainer } from "./code";
import { Separator } from "./separator";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "./table";
import { H1, H2, H3, H4, List, P, Quote } from "./typography";

const FRONTMATTER_PATTERN = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

/**
 * Heading treatment shared by the `document` variant's `h1` and by
 * {@link MarkdownDocumentTitle}, so a panel title rendered above a document body
 * cannot drift from the body's own top-level heading.
 */
const DOCUMENT_TITLE_CLASS =
	"border-border border-b pb-1.5 font-semibold text-xl text-foreground leading-tight";

/**
 * Renders a heading styled as a document title, matching the top-level heading
 * inside a `<Markdown variant="document">` body.
 *
 * Use when a panel supplies its own title above the markdown - an engine usage
 * channel or a help dialog channel, for example - rather than restating the
 * classes at the call site.
 *
 * @component
 */
function MarkdownDocumentTitle({
	children,
	className,
	...props
}: React.ComponentProps<"h2">) {
	return (
		<h2 className={cn(DOCUMENT_TITLE_CLASS, className)} {...props}>
			{children}
		</h2>
	);
}

/**
 * True while rendering inside a fenced block. react-markdown uses the same
 * `code` element for inline spans and fenced blocks and (since v9) no longer
 * passes an `inline` flag, so the `pre` renderer flags it for the `code` one.
 */
const FencedCodeContext = React.createContext(false);

/**
 * Wraps a fenced code block with a header bar showing the language and a
 * copy-to-clipboard button. Used by the `document` variant.
 */
function DocumentCodeBlock({ children }: { children?: React.ReactNode }) {
	const [copied, setCopied] = React.useState(false);

	const { language, code } = React.useMemo(() => {
		let lang: string | undefined;
		let text = "";

		const walk = (child: React.ReactNode) => {
			if (typeof child === "string" || typeof child === "number") {
				text += String(child);
				return;
			}

			if (!React.isValidElement(child)) {
				return;
			}

			const props = child.props as {
				language?: string;
				code?: string;
				className?: string;
				children?: React.ReactNode;
			};

			if (!lang && typeof props.language === "string") {
				lang = props.language;
			}

			// react-markdown carries the fence language as `language-<lang>`
			// on the element's className rather than as a prop
			if (!lang && typeof props.className === "string") {
				lang = /language-(\w+)/.exec(props.className)?.[1];
			}

			if (typeof props.code === "string") {
				text += props.code;
				return;
			}

			if (props.children) {
				React.Children.forEach(props.children, walk);
			}
		};

		React.Children.forEach(children, walk);

		return { language: lang, code: text };
	}, [children]);

	const handleCopy = async (event: React.MouseEvent) => {
		event.stopPropagation();
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// clipboard is unavailable (insecure context, denied permission);
			// leave the button idle rather than surfacing a toast from the kit
		}
	};

	const regionLabel = language ? `${language} code sample` : "Code sample";

	return (
		<div className="my-2 overflow-hidden rounded-md border border-border">
			{/* Header bar - language label left, copy button right */}
			<div className="flex items-center justify-between border-border border-b bg-muted px-3 py-1.5">
				{/*
				 * text-foreground rather than text-muted-foreground: at text-xs
				 * (12px) WCAG 1.4.3 wants 4.5:1, and muted-foreground on muted
				 * measures 4.35:1 in the light theme.
				 */}
				{language && (
					<span className="font-mono text-foreground text-xs">
						{language}
					</span>
				)}
				<button
					type="button"
					onClick={handleCopy}
					aria-label={`Copy ${regionLabel.toLowerCase()}`}
					className="ml-auto flex items-center gap-1 rounded px-2 py-0.5 text-foreground text-xs transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
				>
					{/* Announced on change so the confirmation is not visual only */}
					<span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
				</button>
			</div>

			{/*
			 * A named <section> is an implicit role="region", and the tabIndex is
			 * what makes the horizontal scroller reachable and operable by
			 * keyboard (WCAG 2.1.1) - without it a wide sample can only be panned
			 * with a pointer. noNoninteractiveTabindex is suppressed rather than
			 * obeyed here: its "unsafe fix" of dropping tabIndex would reintroduce
			 * that keyboard trap.
			 */}
			<section
				className="focus-visible:-outline-offset-2 overflow-x-auto bg-muted/30 focus-visible:outline-2 focus-visible:outline-ring"
				// biome-ignore lint/a11y/noNoninteractiveTabindex: focusable by design so keyboard users can scroll a wide sample
				tabIndex={0}
				aria-label={regionLabel}
			>
				<CodeContainer className="min-w-max whitespace-pre rounded-none bg-transparent p-4">
					{children}
				</CodeContainer>
			</section>
		</div>
	);
}

/**
 * Renders markdown `code`, distinguishing a fenced block from an inline span.
 *
 * A top-level component rather than an inline arrow in the component map so the
 * `useContext` call sits at the top level of a real component, which is both the
 * hook contract and what `useHookAtTopLevel` checks for.
 */
function DocumentCode({
	children,
	className,
	...props
}: React.ComponentProps<"code">) {
	const isFenced = React.useContext(FencedCodeContext);
	const language = /language-(\w+)/.exec(className || "")?.[1];

	// A fenced block goes back to Code so Shiki highlights it and
	// DocumentCodeBlock can read the code off the rendered element. Only
	// genuinely inline code gets the chip - a chip's horizontal padding would
	// otherwise indent the first line of every block, since an inline box only
	// pads where it starts.
	if (isFenced) {
		return (
			<Code
				code={String(children)}
				language={
					language as React.ComponentProps<typeof Code>["language"]
				}
				{...props}
			/>
		);
	}

	// Deliberately em-relative rather than a scale step: inline code has to
	// shrink against whatever size the surrounding text is, which an absolute
	// step cannot express.
	return (
		<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
			{children}
		</code>
	);
}

function isPrimative(value: unknown): value is string | number | boolean {
	const type = typeof value;
	return type === "string" || type === "number" || type === "boolean";
}

function isObject(value: unknown): value is Record<string, unknown> {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return false;
	}

	return true;
}

function toCodeString(value: unknown): string {
	const output = JSON.stringify(value, null, 2);
	if (output) {
		return output;
	}

	return String(value);
}

function renderFrontmatterValue(value: unknown): React.ReactNode {
	if (isPrimative(value)) {
		return String(value);
	}

	if (value === null) {
		return <span className="text-muted-foreground">null</span>;
	}

	if (Array.isArray(value)) {
		if (value.length === 0) {
			return <span className="text-muted-foreground">[]</span>;
		}

		if (value.every((item) => isPrimative(item))) {
			return value.join(", ");
		}

		return (
			<CodeContainer className="mt-0 rounded-md border bg-muted/40 p-2">
				<Code code={toCodeString(value)} language="json" />
			</CodeContainer>
		);
	}

	if (isObject(value)) {
		if (Object.keys(value).length === 0) {
			return <span className="text-muted-foreground">{"{}"}</span>;
		}

		return (
			<CodeContainer className="mt-0 rounded-md border bg-muted/40 p-2">
				<Code code={toCodeString(value)} language="json" />
			</CodeContainer>
		);
	}

	return (
		<CodeContainer className="mt-0 rounded-md border bg-muted/40 p-2">
			<Code code={toCodeString(value)} language="json" />
		</CodeContainer>
	);
}

interface MarkdownProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Markdown content to render */
	children: string | null | undefined;
	/** Custom components to override default rendering */
	components?: Partial<Components>;
	/**
	 * Rendering preset.
	 *
	 * - `default` - tuned for chat replies and inline snippets.
	 * - `document` - long-form pages such as engine usage channels and skill
	 *   files: underlined section headings, chip-styled inline code, and fenced
	 *   blocks with a language bar and copy button.
	 *
	 * `components` still wins over whichever preset is active, so a caller can
	 * override a single element without restating the rest.
	 */
	variant?: "default" | "document";
	/** Override URL transformation (e.g. to allow custom protocols through sanitization) */
	urlTransform?: (url: string) => string | null | undefined;
}

function Markdown({
	children,
	components,
	variant = "default",
	className,
	urlTransform,
	...props
}: MarkdownProps) {
	const defaultComponents: Components = React.useMemo(
		() => ({
			h1: ({ children, ...props }) => <H1 {...props}>{children}</H1>,
			h2: ({ children, ...props }) => (
				<H2 className="mt-10" {...props}>
					{children}
				</H2>
			),
			h3: ({ children, ...props }) => (
				<H3 className="mt-8" {...props}>
					{children}
				</H3>
			),
			h4: ({ children, ...props }) => (
				<H4 className="mt-6" {...props}>
					{children}
				</H4>
			),
			h5: ({ children, ...props }) => (
				<h5
					className="mt-4 scroll-m-20 font-medium text-lg tracking-tight"
					{...props}
				>
					{children}
				</h5>
			),
			h6: ({ children, ...props }) => (
				<h6
					className="mt-4 scroll-m-20 font-medium text-base tracking-tight"
					{...props}
				>
					{children}
				</h6>
			),
			p: ({ children, ...props }) => (
				<P className="mt-6" {...props}>
					{children}
				</P>
			),
			a: ({ children, href, ...props }) => (
				<a
					href={href}
					className="font-medium text-primary underline underline-offset-4"
					target="_blank"
					rel="noopener noreferrer"
					{...props}
				>
					{children}
				</a>
			),
			ul: ({ children, ...props }) => <List {...props}>{children}</List>,
			ol: ({ children, ...props }) => (
				<ol className="my-6 ms-6 list-decimal [&>li]:mt-2" {...props}>
					{children}
				</ol>
			),
			li: ({ children, ...props }) => <li {...props}>{children}</li>,
			blockquote: ({ children, ...props }) => (
				<Quote className="mt-6" {...props}>
					{children}
				</Quote>
			),
			hr: ({ ...props }) => (
				<Separator className="mt-6 mb-4" {...props} />
			),
			table: ({ ...props }) => <Table {...props} />,
			thead: ({ ...props }) => <TableHeader {...props} />,
			tbody: ({ ...props }) => <TableBody {...props} />,
			tfoot: ({ ...props }) => <TableFooter {...props} />,
			tr: ({ ...props }) => <TableRow {...props} />,
			// GFM only emits header cells in thead, so every th is a column
			// header. Without scope a screen reader cannot associate a data
			// cell with its heading (WCAG 1.3.1).
			th: ({ ...props }) => <TableHead scope="col" {...props} />,
			td: ({ ...props }) => <TableCell {...props} />,
			pre: ({ ...props }) => <CodeContainer {...props} />,
			code: ({ children, className, ...props }) => {
				const match = /language-(\w+)/.exec(className || "");
				const code = children as string;

				if (match?.[1]) {
					const lang = match[1] as React.ComponentProps<
						typeof Code
					>["language"];

					return (
						<Code
							code={code}
							language={lang ? lang : "txt"}
							{...props}
						/>
					);
				}

				return <Code code={code} {...props} />;
			},
			// Fall back to an empty alt rather than leaving the attribute off:
			// a missing alt makes assistive tech announce the file name, while
			// alt="" correctly marks the image decorative (WCAG 1.1.1).
			img: ({ src, alt, ...props }) => (
				<img src={src} alt={alt ?? ""} {...props} />
			),
		}),
		[],
	);

	/**
	 * Long-form document styling: a hairline rule under each section heading,
	 * chip-styled inline code, fenced blocks with a language bar and copy button,
	 * and tighter vertical rhythm than the default (which is tuned for chat and
	 * inline snippets). Only the elements that differ are listed; everything else
	 * falls through to `defaultComponents`.
	 */
	const documentComponents: Partial<Components> = React.useMemo(
		() => ({
			pre: ({ children }) => (
				<FencedCodeContext.Provider value={true}>
					<DocumentCodeBlock>{children}</DocumentCodeBlock>
				</FencedCodeContext.Provider>
			),
			code: DocumentCode,
			p: ({ children }) => (
				<p className="my-3 text-foreground">{children}</p>
			),
			// Sizes come off the shared scale in globals.css rather than
			// arbitrary rem values, so document headings stay in step with the
			// rest of the system.
			h1: ({ children }) => (
				<h1 className={cn("mb-4", DOCUMENT_TITLE_CLASS)}>{children}</h1>
			),
			h2: ({ children }) => (
				<h2 className="mt-6 mb-2 border-border border-b pb-1 font-semibold text-base text-foreground leading-tight">
					{children}
				</h2>
			),
			h3: ({ children }) => (
				<h3 className="mt-5 mb-1.5 font-semibold text-foreground text-sm leading-tight">
					{children}
				</h3>
			),
			h4: ({ children }) => (
				<h4 className="mt-4 mb-1.5 font-semibold text-foreground text-xs uppercase leading-tight tracking-wide">
					{children}
				</h4>
			),
			ul: ({ children }) => (
				<ul className="my-3 list-disc ps-6 text-foreground marker:text-muted-foreground">
					{children}
				</ul>
			),
			ol: ({ children }) => (
				<ol className="my-3 list-decimal ps-6 text-foreground marker:text-muted-foreground">
					{children}
				</ol>
			),
			li: ({ children }) => <li className="my-1">{children}</li>,
			blockquote: ({ children }) => (
				<blockquote className="my-4 border-border border-s-[3px] px-4 py-1 text-muted-foreground">
					{children}
				</blockquote>
			),
			hr: () => <hr className="my-8 border-border border-t" />,
			// Underlined at rest, not only on hover: a link distinguished from
			// body text by color alone fails WCAG 1.4.1, and hover is not
			// available to keyboard or touch users.
			a: ({ children, href }) => (
				<a
					href={href}
					target="_blank"
					rel="noopener noreferrer"
					className="font-medium text-primary underline underline-offset-4"
				>
					{children}
				</a>
			),
		}),
		[],
	);

	const mergedComponents = React.useMemo(() => {
		return {
			...defaultComponents,
			...(variant === "document" ? documentComponents : {}),
			...(components || {}),
		};
	}, [defaultComponents, documentComponents, variant, components]);

	const { content, frontmatter } = React.useMemo(() => {
		if (!children) {
			return {
				content: children || "",
				frontmatter: null,
			};
		}

		const match = FRONTMATTER_PATTERN.exec(children);
		if (!match) {
			return {
				content: children,
				frontmatter: null,
			};
		}

		const frontmatterText = match[1];
		const markdownContent = children.slice(match[0].length);

		try {
			const parsed = parseYaml(frontmatterText);
			if (isObject(parsed)) {
				return {
					content: markdownContent,
					frontmatter: {
						kind: "parsed",
						value: parsed,
					},
				};
			}
		} catch {
			return {
				content: markdownContent,
				frontmatter: {
					kind: "raw",
					value: frontmatterText,
				},
			};
		}

		return {
			content: markdownContent,
			frontmatter: null,
		};
	}, [children]);

	if (!children) {
		return null;
	}

	return (
		<div
			data-slot="markdown"
			className={cn(
				"[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
				className,
			)}
			{...props}
		>
			{frontmatter && frontmatter.kind === "raw" && frontmatter.value && (
				<section className="mt-2 mb-6">
					<CodeContainer className="overflow-hidden rounded-xl border bg-background">
						<Code
							code={String(frontmatter.value)}
							language="yaml"
						/>
					</CodeContainer>
				</section>
			)}
			{frontmatter &&
				frontmatter.kind === "parsed" &&
				Object.entries(frontmatter.value).length > 0 && (
					<section className="mt-2 mb-6">
						<Table wrapperClassName="overflow-y-hidden rounded-xl border bg-background">
							<TableBody>
								{Object.entries(frontmatter.value).map(
									([key, value]) => {
										return (
											<TableRow key={key}>
												<TableCell
													className="max-w-[200px] truncate align-top font-medium"
													title={String(key)}
												>
													{key}
												</TableCell>
												<TableCell className="whitespace-normal align-top">
													{renderFrontmatterValue(
														value,
													)}
												</TableCell>
											</TableRow>
										);
									},
								)}
							</TableBody>
						</Table>
					</section>
				)}

			{content && (
				<ReactMarkdown
					remarkPlugins={[remarkGfm]}
					rehypePlugins={[rehypeRaw]}
					components={mergedComponents}
					urlTransform={urlTransform}
				>
					{content}
				</ReactMarkdown>
			)}
		</div>
	);
}

export { Markdown, MarkdownDocumentTitle };
export type { MarkdownProps };
