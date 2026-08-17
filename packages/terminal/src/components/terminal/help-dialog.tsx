import { Check, Copy } from "lucide-react";
import {
	Children,
	type ComponentProps,
	createContext,
	isValidElement,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import {
	Code,
	CodeContainer,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Markdown,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { runPixel } from "../../utility/pixel";

const ENGINE_TYPES = [
	"MODEL",
	"DATABASE",
	"VECTOR",
	"FUNCTION",
	"STORAGE",
] as const;
type EngineType = (typeof ENGINE_TYPES)[number];

type UsageEntry = { code?: string; label?: string; type?: string };
type UsageMap = Record<string, UsageEntry>;

/**
 * Short tab titles per usage channel. The backend `label` is a full sentence
 * ("How to use in JavaScript/TypeScript with the @semoss/sdk"), too long for a
 * tab trigger, so it stays as the panel heading and these drive the trigger.
 */
const CHANNEL_TITLES: Record<string, string> = {
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

/** Title-case an unrecognized channel so new backend integrations still read well. */
const getChannelTitle = (key: string, entry: UsageEntry) => {
	const type = entry.type || key;
	const known = CHANNEL_TITLES[type.toLowerCase()];
	if (known) {
		return known;
	}

	return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

/**
 * True for a placeholder channel. Engine types the backend has not documented
 * yet come back with every channel set to this marker rather than being omitted.
 */
const isPendingEntry = (entry: UsageEntry) =>
	(entry.code ?? "").trim().toLowerCase() === PENDING_CODE;

/**
 * Markdown renderers for the channel panels.
 *
 * The kit's `Markdown` wrapper leans on `prose` utility classes, but the
 * Tailwind typography plugin is not installed, so those classes are inert and
 * every element has to be styled explicitly. These mirror the SEMOSS docs
 * portal: a hairline rule under each section heading, chip-styled inline code,
 * and spacing tuned to the dialog's text-sm body copy.
 */
const MARKDOWN_COMPONENTS = {
	pre: ({ children }: { children?: ReactNode }) => (
		<FencedCodeContext.Provider value={true}>
			<CodeBlockWithCopy>{children}</CodeBlockWithCopy>
		</FencedCodeContext.Provider>
	),
	code: ({
		children,
		className,
		...props
	}: {
		children?: ReactNode;
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
						language as ComponentProps<typeof Code>["language"]
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
	p: ({ children }: { children?: ReactNode }) => (
		<p className="my-3 text-foreground">{children}</p>
	),
	h1: ({ children }: { children?: ReactNode }) => (
		<h1 className="mb-4 border-border border-b pb-[0.4rem] font-semibold text-[1.9rem] text-foreground leading-tight">
			{children}
		</h1>
	),
	h2: ({ children }: { children?: ReactNode }) => (
		<h2 className="mt-8 mb-3 border-border border-b pb-[0.3rem] font-semibold text-[1.4rem] text-foreground leading-tight">
			{children}
		</h2>
	),
	h3: ({ children }: { children?: ReactNode }) => (
		<h3 className="mt-6 mb-2 font-semibold text-[1.15rem] text-foreground leading-tight">
			{children}
		</h3>
	),
	h4: ({ children }: { children?: ReactNode }) => (
		<h4 className="mt-5 mb-2 font-semibold text-base text-foreground leading-tight">
			{children}
		</h4>
	),
	ul: ({ children }: { children?: ReactNode }) => (
		<ul className="my-3 list-disc ps-6 text-foreground marker:text-muted-foreground">
			{children}
		</ul>
	),
	ol: ({ children }: { children?: ReactNode }) => (
		<ol className="my-3 list-decimal ps-6 text-foreground marker:text-muted-foreground">
			{children}
		</ol>
	),
	li: ({ children }: { children?: ReactNode }) => (
		<li className="my-1">{children}</li>
	),
	blockquote: ({ children }: { children?: ReactNode }) => (
		<blockquote className="my-4 border-border border-s-[3px] px-4 py-1 text-muted-foreground">
			{children}
		</blockquote>
	),
	hr: () => <hr className="my-8 border-border border-t" />,
	a: ({ children, href }: { children?: ReactNode; href?: string }) => (
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

interface FetchedUsage {
	/** Parsed `{label, code}` entries, if the backend returned the expected shape. */
	usage: UsageMap | null;
	/** Raw response — shown when `usage` is empty so an unexpected shape is still visible. */
	raw?: unknown;
}

interface HelpDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Engine-usage cheat sheet. One tab per engine type — each one fires
 * `GetEngineUsage(type="<TYPE>")` lazily the first time it's selected and
 * renders the returned markdown with copyable code blocks so the user can
 * paste straight into the REPL or a file.
 */
export const HelpDialog = ({ open, onOpenChange }: HelpDialogProps) => {
	const { actions } = useInsight();
	const { t } = useTranslation("dialog");
	const [activeType, setActiveType] = useState<EngineType>("MODEL");
	// cache fetched data per type so re-selecting a tab is instant
	const [usageByType, setUsageByType] = useState<
		Partial<Record<EngineType, FetchedUsage>>
	>({});
	const [loadingType, setLoadingType] = useState<EngineType | null>(null);
	const [errorByType, setErrorByType] = useState<
		Partial<Record<EngineType, string>>
	>({});

	// Fetch on first visit to each tab while the dialog is open.
	useEffect(() => {
		if (!open) return;
		if (usageByType[activeType] !== undefined) return; // cached
		let cancelled = false;
		setLoadingType(activeType);
		(async () => {
			const resp = await runPixel<unknown>(
				actions,
				`GetEngineUsage(type=["${activeType}"]);`,
			);
			if (cancelled) return;
			setLoadingType(null);
			if (!resp) {
				setErrorByType((prev) => ({
					...prev,
					[activeType]: t("help.fetchFailed"),
				}));
				setUsageByType((prev) => ({
					...prev,
					[activeType]: { usage: null },
				}));
				return;
			}
			if (resp.operationType.some((op) => op.indexOf("ERROR") > -1)) {
				const err =
					typeof resp.output === "string"
						? resp.output
						: t("help.usageReturnedError", { type: activeType });
				setErrorByType((prev) => ({ ...prev, [activeType]: err }));
				setUsageByType((prev) => ({
					...prev,
					[activeType]: { usage: null, raw: resp.output },
				}));
				return;
			}
			setUsageByType((prev) => ({
				...prev,
				[activeType]: parseUsageResponse(resp.output),
			}));
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, activeType]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="flex flex-col overflow-hidden p-0"
				style={{
					width: "min(90vw, 1100px)",
					height: "min(90vh, 800px)",
					maxWidth: "min(90vw, 1100px)",
				}}
			>
				<DialogHeader className="border-border border-b px-5 py-3">
					<DialogTitle>{t("help.title")}</DialogTitle>
				</DialogHeader>

				<Tabs
					value={activeType}
					onValueChange={(v) => setActiveType(v as EngineType)}
					className="flex min-h-0 flex-1 flex-col"
				>
					<TabsList className="mx-5 mt-3 self-start">
						{ENGINE_TYPES.map((et) => (
							<TabsTrigger key={et} value={et}>
								{et.charAt(0) + et.slice(1).toLowerCase()}
							</TabsTrigger>
						))}
					</TabsList>

					{ENGINE_TYPES.map((et) => (
						<TabsContent
							key={et}
							value={et}
							className="min-h-0 flex-1 overflow-y-auto px-5 pb-5"
						>
							{loadingType === et && (
								<div className="flex h-full items-center justify-center">
									<Spinner />
								</div>
							)}
							{loadingType !== et && errorByType[et] && (
								<div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
									{errorByType[et]}
								</div>
							)}
							{loadingType !== et && usageByType[et] && (
								<UsagePane
									fetched={usageByType[et]}
									type={et}
								/>
							)}
						</TabsContent>
					))}
				</Tabs>
			</DialogContent>
		</Dialog>
	);
};

const UsagePane = ({
	fetched,
	type,
}: {
	fetched: FetchedUsage | undefined;
	type: EngineType;
}) => {
	const { t } = useTranslation("dialog");
	if (!fetched) return null;
	const usage = fetched.usage;
	const entries = usage ? Object.entries(usage) : [];
	const renderable = entries.filter(([, v]) => v?.code);
	// placeholder channels get their own message rather than an empty tab
	const documented = renderable.filter(([, v]) => !isPendingEntry(v));
	const hasPendingDocs =
		documented.length < renderable.length &&
		documented.every(
			([key, v]) => (v.type || key).toLowerCase() === "introduction",
		);

	if (documented.length > 0) {
		return (
			<Tabs
				key={type}
				defaultValue={documented[0][0]}
				className="gap-3 py-4"
			>
				{hasPendingDocs && (
					<p className="text-muted-foreground text-sm">
						{t("help.pendingMessage", { type })}
					</p>
				)}

				<TabsList className="h-auto flex-wrap justify-start">
					{documented.map(([key, entry]) => (
						<TabsTrigger key={key} value={key}>
							{getChannelTitle(key, entry)}
						</TabsTrigger>
					))}
				</TabsList>

				{documented.map(([key, entry]) => (
					<TabsContent
						key={key}
						value={key}
						className="flex flex-col gap-2"
					>
						{entry.label && (
							/* acts as the document title, so it is sized
							   above the h2 rules inside the body */
							<h2 className="border-border border-b pb-[0.4rem] font-semibold text-[1.9rem] text-foreground leading-tight">
								{entry.label}
							</h2>
						)}
						<Markdown
							className="w-full text-sm leading-[1.65]"
							components={MARKDOWN_COMPONENTS}
						>
							{entry.code}
						</Markdown>
					</TabsContent>
				))}
			</Tabs>
		);
	}

	// Nothing renderable: either every channel is still a placeholder, or the
	// backend returned an unexpected shape. Say which, then surface the raw
	// payload so the user can copy whatever's there instead of staring at an
	// empty pane.
	const isDocumentationPending = renderable.length > 0;
	const hasRaw =
		!isDocumentationPending &&
		fetched.raw !== undefined &&
		fetched.raw !== null;
	return (
		<div className="flex flex-col gap-3 py-4">
			<p className="text-muted-foreground text-sm">
				{isDocumentationPending
					? t("help.pendingMessage", { type })
					: t("help.emptyMessage", { type })}
			</p>
			{hasRaw && (
				<div className="overflow-hidden rounded-md border border-border">
					<div className="border-border border-b bg-muted px-3 py-1.5 text-muted-foreground text-xs">
						{t("help.rawResponse")}
					</div>
					<pre className="overflow-x-auto whitespace-pre-wrap break-all bg-muted/30 p-3 font-mono text-foreground text-xs">
						{safeStringify(fetched.raw)}
					</pre>
				</div>
			)}
		</div>
	);
};

/**
 * Normalize `GetEngineUsage(type=...)`'s output into a `{label, code}` map.
 *
 * The backend has historically returned a few different shapes:
 *  - `{ apiCall: { label, code }, … }` (current expected)
 *  - `[ { label, code }, … ]` (some types use an array)
 *  - A single `{ label, code }` object (legacy)
 *
 * Anything else falls through to the raw view so the user can still see what
 * came back.
 */
const parseUsageResponse = (output: unknown): FetchedUsage => {
	if (output === null || output === undefined) {
		return { usage: null, raw: output };
	}
	if (Array.isArray(output)) {
		const map: UsageMap = {};
		for (let i = 0; i < output.length; i++) {
			const entry = output[i];
			if (isUsageEntry(entry)) map[String(i)] = entry;
		}
		return { usage: Object.keys(map).length ? map : null, raw: output };
	}
	if (typeof output === "object") {
		const obj = output as Record<string, unknown>;
		if (isUsageEntry(obj)) {
			return { usage: { default: obj as UsageEntry }, raw: output };
		}
		const map: UsageMap = {};
		for (const [k, v] of Object.entries(obj)) {
			if (isUsageEntry(v)) map[k] = v as UsageEntry;
		}
		return { usage: Object.keys(map).length ? map : null, raw: output };
	}
	return { usage: null, raw: output };
};

const isUsageEntry = (v: unknown): v is UsageEntry => {
	if (v === null || typeof v !== "object") return false;
	const o = v as Record<string, unknown>;
	return typeof o.code === "string";
};

const safeStringify = (value: unknown): string => {
	try {
		if (typeof value === "string") return value;
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
};

/**
 * Wraps a fenced code block with a language label + Copy button. Mirrors
 * the one in `packages/client/src/pages/engine/engine-usage-page.tsx` so the
 * cheat sheet renders identically in the client and the terminal.
 */
const CodeBlockWithCopy = ({ children }: { children: ReactNode }) => {
	const { t } = useTranslation("dialog");
	const [copied, setCopied] = useState(false);

	const extractCodeDetails = (node: ReactNode) => {
		let language: string | undefined;
		let code = "";
		const walk = (child: ReactNode) => {
			if (typeof child === "string" || typeof child === "number") {
				code += String(child);
				return;
			}
			if (!isValidElement(child)) return;
			const props = child.props as {
				language?: string;
				code?: string;
				className?: string;
				children?: ReactNode;
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
			if (props.children) Children.forEach(props.children, walk);
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
			toast.error(t("help.copyFailed"));
		}
	};

	return (
		<div className="my-2 overflow-hidden rounded-md border border-border">
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
							<Check className="size-3" /> {t("help.copied")}
						</>
					) : (
						<>
							<Copy className="size-3" /> {t("help.copy")}
						</>
					)}
				</button>
			</div>
			<div className="overflow-x-auto bg-muted/30">
				<CodeContainer className="min-w-max whitespace-pre rounded-none bg-transparent p-4">
					{children}
				</CodeContainer>
			</div>
		</div>
	);
};
