import { Check, Copy } from "lucide-react";
import {
	Children,
	createContext,
	isValidElement,
	useContext,
	useMemo,
	useState,
} from "react";
import { Code, CodeContainer, Markdown, toast } from "@semoss/ui/next";

/**
 * True while rendering inside a fenced block. react-markdown uses the same
 * `code` element for inline spans and fenced blocks and (since v9) no longer
 * passes an `inline` flag, so the `pre` renderer flags it for the `code` one.
 */
const FencedCodeContext = createContext(false);

/**
 * Wraps a fenced code block with a header bar showing the language and a
 * copy-to-clipboard button. Defined at module scope so React does not treat it
 * as a new component type on every render.
 */
const CodeBlockWithCopy = ({ children }: { children: React.ReactNode }) => {
	const [copied, setCopied] = useState(false);

	const extractCodeDetails = (node: React.ReactNode) => {
		let language: string | undefined;
		let code = "";

		const walk = (child: React.ReactNode) => {
			if (typeof child === "string" || typeof child === "number") {
				code += String(child);
				return;
			}

			if (!isValidElement(child)) {
				return;
			}

			const props = child.props as {
				language?: string;
				code?: string;
				className?: string;
				children?: React.ReactNode;
			};

			if (!language && typeof props.language === "string") {
				language = props.language;
			}

			// react-markdown carries the fence language as `language-<lang>`
			// on the element's className rather than as a prop
			if (!language && typeof props.className === "string") {
				language = /language-(\w+)/.exec(props.className)?.[1];
			}

			if (typeof props.code === "string") {
				code += props.code;
				return;
			}

			if (props.children) {
				Children.forEach(props.children, walk);
			}
		};

		Children.forEach(node, walk);

		return { language, code };
	};

	const { language, code } = extractCodeDetails(children);

	const handleCopy = async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Failed to copy code");
		}
	};

	return (
		<div className="my-2 overflow-hidden rounded-md border border-border">
			{/* Header bar - language label left, copy button right */}
			<div className="flex items-center justify-between border-border border-b bg-muted px-3 py-1.5">
				{language && (
					<span className="font-mono text-muted-foreground text-xs">
						{language}
					</span>
				)}
				<button
					type="button"
					onClick={handleCopy}
					className="ml-auto flex items-center gap-1 rounded px-2 py-0.5 text-muted-foreground text-xs transition-colors hover:bg-background hover:text-foreground"
				>
					{copied ? (
						<>
							<Check className="size-3" />
							Copied
						</>
					) : (
						<>
							<Copy className="size-3" />
							Copy
						</>
					)}
				</button>
			</div>

			{/* Scrollable code area */}
			<div className="overflow-x-auto bg-muted/30">
				<CodeContainer className="min-w-max whitespace-pre rounded-none bg-transparent p-4">
					{children}
				</CodeContainer>
			</div>
		</div>
	);
};

/**
 * Markdown renderers shared by every long-form document panel: engine usage
 * channels and skill files.
 *
 * The kit's `Markdown` wrapper leans on `prose` utility classes, but the
 * Tailwind typography plugin is not installed, so those classes are inert and
 * every element has to be styled explicitly. These mirror the SEMOSS docs
 * portal: a hairline rule under each section heading, chip-styled inline code,
 * and spacing tuned to the panel's text-sm body copy. Declared once so React
 * does not treat them as new component types on every render.
 */
export const MARKDOWN_COMPONENTS = {
	pre: ({ children }: { children?: React.ReactNode }) => (
		<FencedCodeContext.Provider value={true}>
			<CodeBlockWithCopy>{children}</CodeBlockWithCopy>
		</FencedCodeContext.Provider>
	),
	code: ({
		children,
		className,
		...props
	}: {
		children?: React.ReactNode;
		className?: string;
	}) => {
		const isFenced = useContext(FencedCodeContext);
		const language = /language-(\w+)/.exec(className || "")?.[1];

		// A fenced block goes back to the kit so Shiki highlights it (when the
		// fence names a language) and CodeBlockWithCopy can read the code off
		// the rendered element. Only genuinely inline code gets the chip - a
		// chip's horizontal padding would otherwise indent the first line of
		// every block, since an inline box only pads where it starts.
		if (isFenced) {
			return (
				<Code
					code={String(children)}
					language={
						language as React.ComponentProps<
							typeof Code
						>["language"]
					}
					{...props}
				/>
			);
		}

		return (
			<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
				{children}
			</code>
		);
	},
	p: ({ children }: { children?: React.ReactNode }) => (
		<p className="my-3 text-foreground">{children}</p>
	),
	h1: ({ children }: { children?: React.ReactNode }) => (
		<h1 className="mb-4 border-border border-b pb-[0.4rem] font-semibold text-[1.9rem] text-foreground leading-tight">
			{children}
		</h1>
	),
	h2: ({ children }: { children?: React.ReactNode }) => (
		<h2 className="mt-8 mb-3 border-border border-b pb-[0.3rem] font-semibold text-[1.4rem] text-foreground leading-tight">
			{children}
		</h2>
	),
	h3: ({ children }: { children?: React.ReactNode }) => (
		<h3 className="mt-6 mb-2 font-semibold text-[1.15rem] text-foreground leading-tight">
			{children}
		</h3>
	),
	h4: ({ children }: { children?: React.ReactNode }) => (
		<h4 className="mt-5 mb-2 font-semibold text-base text-foreground leading-tight">
			{children}
		</h4>
	),
	ul: ({ children }: { children?: React.ReactNode }) => (
		<ul className="my-3 list-disc ps-6 text-foreground marker:text-muted-foreground">
			{children}
		</ul>
	),
	ol: ({ children }: { children?: React.ReactNode }) => (
		<ol className="my-3 list-decimal ps-6 text-foreground marker:text-muted-foreground">
			{children}
		</ol>
	),
	li: ({ children }: { children?: React.ReactNode }) => (
		<li className="my-1">{children}</li>
	),
	blockquote: ({ children }: { children?: React.ReactNode }) => (
		<blockquote className="my-4 border-border border-s-[3px] px-4 py-1 text-muted-foreground">
			{children}
		</blockquote>
	),
	hr: () => <hr className="my-8 border-border border-t" />,
	a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="text-primary no-underline hover:underline"
		>
			{children}
		</a>
	),
	// Deliberately no table/thead/tbody/tr/th/td entries. The kit's Markdown
	// already maps those to its design-system Table primitives, and since
	// `components` is spread over the kit's defaults, overriding them here would
	// shadow the design system with hand-rolled markup for no gain. Tables in
	// skill files and usage channels render through the kit.
};

/** A document's parsed YAML frontmatter block and the markdown body after it. */
export interface ParsedFrontmatter {
	/** Top level scalar keys from the frontmatter, in document order. */
	meta: Record<string, string>;
	/** Everything after the closing delimiter, or the whole input when absent. */
	body: string;
}

/**
 * Split a leading `---` delimited frontmatter block off a markdown document.
 *
 * A SKILL.md carries its name and description in frontmatter, and that block is
 * the source of truth the backend reads - it is metadata, not body copy. Left
 * in place it renders as a horizontal rule followed by stray `name:` and
 * `description:` text, so it is pulled out here and displayed as a header
 * instead.
 *
 * Deliberately minimal: only top level `key: value` scalars are read, which is
 * all a SKILL.md frontmatter uses. Anything it cannot parse is left in `body`
 * so no content is silently dropped.
 *
 * @param source Raw markdown file contents.
 * @returns The parsed metadata and the remaining body.
 */
export const parseFrontmatter = (source: string): ParsedFrontmatter => {
	if (!source.startsWith("---")) {
		return { meta: {}, body: source };
	}

	const lines = source.split("\n");
	// find the closing delimiter, skipping the opening one on line 0
	const closingIndex = lines.findIndex(
		(line, index) => index > 0 && line.trim() === "---",
	);

	if (closingIndex === -1) {
		return { meta: {}, body: source };
	}

	const meta: Record<string, string> = {};
	let currentKey: string | null = null;

	for (const line of lines.slice(1, closingIndex)) {
		const match = /^([A-Za-z0-9_-]+):\s?(.*)$/.exec(line);
		if (match) {
			currentKey = match[1];
			meta[currentKey] = match[2].trim();
			continue;
		}

		// a wrapped continuation of the previous value
		if (currentKey && line.trim()) {
			meta[currentKey] = `${meta[currentKey]} ${line.trim()}`.trim();
		}
	}

	return {
		meta,
		body: lines
			.slice(closingIndex + 1)
			.join("\n")
			.trimStart(),
	};
};

export interface MarkdownDocumentProps {
	/** Raw markdown source, frontmatter included. */
	children: string;
	/**
	 * Render a leading `---` frontmatter block as a metadata header rather than
	 * as body markdown. Defaults to true. Documents with no frontmatter are
	 * unaffected either way.
	 */
	showFrontmatter?: boolean;
	/** Extra classes for the wrapper. */
	className?: string;
}

/**
 * Renders a long-form markdown document with the shared document styling, so
 * skill files and engine usage channels read identically.
 *
 * @component
 */
export const MarkdownDocument: React.FC<MarkdownDocumentProps> = ({
	children,
	showFrontmatter = true,
	className,
}) => {
	const { meta, body } = useMemo(
		() => parseFrontmatter(children ?? ""),
		[children],
	);

	const title = meta.name;
	const description = meta.description;
	const hasHeader = showFrontmatter && Boolean(title || description);

	return (
		<div className={className}>
			{hasHeader && (
				<div className="mb-6 rounded-md border border-border bg-muted/30 px-4 py-3">
					{title && (
						<div className="font-mono font-semibold text-foreground text-sm">
							{title}
						</div>
					)}
					{description && (
						<p className="mt-1 text-muted-foreground text-sm leading-relaxed">
							{description}
						</p>
					)}
				</div>
			)}
			<Markdown components={MARKDOWN_COMPONENTS}>
				{showFrontmatter ? body : children}
			</Markdown>
		</div>
	);
};
