import { Check, Copy, Info, Terminal } from "lucide-react";
import {
	Children,
	createContext,
	isValidElement,
	useContext,
	useMemo,
	useState,
} from "react";
import {
	Code,
	CodeContainer,
	H4,
	Markdown,
	P,
	Separator,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { useEngine, usePixel } from "@/hooks";

/** One usage channel returned by `GetEngineUsage`. */
interface UsageSection {
	/** Channel identifier, for example `introduction`, `pixel`, `javascript`. */
	type: string;
	/** Full heading supplied by the backend. */
	label: string;
	/** Markdown body of the channel. */
	code: string;
	/** Unique tab value, since the backend could repeat a type. */
	value: string;
}

/**
 * Short tab titles per channel. The backend `label` is a full sentence
 * ("How to use in JavaScript/TypeScript with the @semoss/sdk"), which is far
 * too long for a tab trigger, so it stays as the panel heading and these
 * drive the trigger text instead.
 */
const TAB_TITLES: Record<string, string> = {
	introduction: "Overview",
	pixel: "Pixel",
	javascript: "JavaScript",
	python: "Python",
	java: "Java",
	langchain: "LangChain",
	openai: "OpenAI",
	anthropic: "Anthropic",
	ollama: "Ollama",
};

/** Backend marker for a channel whose documentation has not been written yet. */
const PENDING_CODE = "documentation pending";

/**
 * True while rendering inside a fenced block. react-markdown uses the same
 * `code` element for inline spans and fenced blocks and (since v9) no longer
 * passes an `inline` flag, so the `pre` renderer flags it for the `code` one.
 */
const FencedCodeContext = createContext(false);

/**
 * `GetEngineUsage` returns one entry per channel. Older engine types can come
 * back as an index-keyed object rather than an array, so accept both and drop
 * anything without a body.
 */
const normalizeSections = (data: unknown): UsageSection[] => {
	if (!data || typeof data !== "object") {
		return [];
	}

	const entries = Array.isArray(data) ? data : Object.values(data);

	return entries.flatMap((entry, index) => {
		if (!entry || typeof entry !== "object") {
			return [];
		}

		const { code, label, type } = entry as Partial<UsageSection>;
		if (typeof code !== "string" || !code.trim()) {
			return [];
		}

		const resolvedType =
			typeof type === "string" && type ? type : `section-${index}`;

		return [
			{
				type: resolvedType,
				label:
					typeof label === "string" && label ? label : resolvedType,
				code,
				value: `${resolvedType}-${index}`,
			},
		];
	});
};

/** Title-case an unrecognized channel so new backend integrations still read well. */
const getTabTitle = ({ type }: UsageSection) => {
	const known = TAB_TITLES[type.toLowerCase()];
	if (known) {
		return known;
	}

	return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

/**
 * True for a placeholder channel. Engine types the backend has not documented
 * yet (guardrails, for example) come back with every channel set to this
 * marker rather than being omitted.
 */
const isPending = ({ code }: UsageSection) =>
	code.trim().toLowerCase() === PENDING_CODE;

/**
 * Wraps a fenced code block with a header bar showing the language and a
 * copy-to-clipboard button.  Defined outside EngineUsagePage so React does
 * not treat it as a new component type on every render.
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
			{/* Header bar — language label left, copy button right */}
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
 * Markdown renderers for the usage panels.
 *
 * The kit's `Markdown` wrapper leans on `prose` utility classes, but the
 * Tailwind typography plugin is not installed, so those classes are inert and
 * every element has to be styled explicitly. These mirror the SEMOSS docs
 * portal: a hairline rule under each section heading, chip-styled inline code,
 * and spacing tuned to the panel's text-sm body copy. Declared once so React
 * does not treat them as new component types on every render.
 */
const MARKDOWN_COMPONENTS = {
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
};

/**
 * Wrap the Database, Storage, Model routes
 */
export const EngineUsagePage = () => {
	// get the database information
	const { engine } = useEngine();

	// get the engine info
	const GetEngineUsage = usePixel<UsageSection[]>(
		`GetEngineUsage(engine=["${engine.engine_id}"]);`,
	);

	const sections = useMemo(
		() => normalizeSections(GetEngineUsage.data),
		[GetEngineUsage.data],
	);

	// placeholder channels get their own message rather than an empty tab
	const documented = sections.filter((section) => !isPending(section));
	const hasPendingDocs =
		documented.length < sections.length &&
		documented.every(
			(section) => section.type.toLowerCase() === "introduction",
		);

	// show a loading screen when it is pending
	if (GetEngineUsage.status !== "SUCCESS") {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="flex min-w-0 flex-col gap-4">
			<div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-4">
				<Terminal className="mt-0.5 size-4 flex-shrink-0 text-muted-foreground" />
				<div className="flex flex-col gap-1">
					<span className="font-semibold text-sm">
						Test in the terminal
					</span>
					<P className="text-muted-foreground text-sm">
						Click{" "}
						<a
							href="../../terminal/dist/"
							rel="noopener noreferrer"
							target="_blank"
							className="text-primary underline underline-offset-4 hover:text-primary/80"
						>
							here
						</a>{" "}
						to open the terminal and test commands interactively
					</P>
				</div>
			</div>

			<H4 className="font-semibold">API & SDK Usage</H4>
			<Separator />

			{hasPendingDocs && (
				<div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-4">
					<Info className="mt-0.5 size-4 flex-shrink-0 text-muted-foreground" />
					<div className="flex flex-col gap-1">
						<span className="font-semibold text-sm">
							Usage examples are not available yet
						</span>
						<P className="text-muted-foreground text-sm">
							{documented.length > 0
								? "This engine type has not been documented yet. The overview below still covers how to reach any engine on the platform."
								: "This engine type has not been documented yet."}
						</P>
					</div>
				</div>
			)}

			{documented.length === 0 && !hasPendingDocs && (
				<div className="flex items-center justify-center p-8">
					<P className="text-muted-foreground">No Details</P>
				</div>
			)}

			{documented.length > 0 && (
				<Tabs
					key={engine.engine_id}
					defaultValue={documented[0].value}
					className="min-w-0 gap-4"
				>
					<TabsList className="h-auto flex-wrap justify-start">
						{documented.map((section) => (
							<TabsTrigger
								key={section.value}
								value={section.value}
							>
								{getTabTitle(section)}
							</TabsTrigger>
						))}
					</TabsList>

					{documented.map((section) => (
						<TabsContent
							key={section.value}
							value={section.value}
							className="flex min-w-0 flex-col gap-3"
						>
							{/* acts as the document title, so it is sized
							    above the h2 rules inside the body */}
							<h2 className="border-border border-b pb-[0.4rem] font-semibold text-[1.9rem] text-foreground leading-tight">
								{section.label}
							</h2>
							<Markdown
								className="w-full text-sm leading-[1.65]"
								components={MARKDOWN_COMPONENTS}
							>
								{section.code}
							</Markdown>
						</TabsContent>
					))}
				</Tabs>
			)}
		</div>
	);
};
