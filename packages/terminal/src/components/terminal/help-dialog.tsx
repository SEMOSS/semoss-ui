import { Check, Copy } from "lucide-react";
import {
	Children,
	isValidElement,
	type ReactNode,
	useEffect,
	useState,
} from "react";
import { useInsight } from "@semoss/sdk/react";
import {
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
					[activeType]: "Failed to fetch usage (no response)",
				}));
				setUsageByType((prev) => ({
					...prev,
					[activeType]: { usage: null },
				}));
				return;
			}
			if (resp.operationType.some((t) => t.indexOf("ERROR") > -1)) {
				const err =
					typeof resp.output === "string"
						? resp.output
						: `GetEngineUsage(type=["${activeType}"]) returned an error.`;
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
					<DialogTitle>Terminal Help</DialogTitle>
				</DialogHeader>

				<Tabs
					value={activeType}
					onValueChange={(v) => setActiveType(v as EngineType)}
					className="flex min-h-0 flex-1 flex-col"
				>
					<TabsList className="mx-5 mt-3 self-start">
						{ENGINE_TYPES.map((t) => (
							<TabsTrigger key={t} value={t}>
								{t.charAt(0) + t.slice(1).toLowerCase()}
							</TabsTrigger>
						))}
					</TabsList>

					{ENGINE_TYPES.map((t) => (
						<TabsContent
							key={t}
							value={t}
							className="min-h-0 flex-1 overflow-y-auto px-5 pb-5"
						>
							{loadingType === t && (
								<div className="flex h-full items-center justify-center">
									<Spinner />
								</div>
							)}
							{loadingType !== t && errorByType[t] && (
								<div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
									{errorByType[t]}
								</div>
							)}
							{loadingType !== t && usageByType[t] && (
								<UsagePane fetched={usageByType[t]} type={t} />
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
	if (!fetched) return null;
	const usage = fetched.usage;
	const entries = usage ? Object.entries(usage) : [];
	const hasRenderableEntries = entries.some(([, v]) => v?.code);

	if (hasRenderableEntries) {
		return (
			<div className="flex flex-col gap-4 py-4">
				{entries.map(([key, entry], idx) => {
					if (!entry?.code) return null;
					return (
						<div key={key} className="flex flex-col gap-2">
							{idx > 0 && (
								<div className="border-border border-t" />
							)}
							{entry.label && (
								<h3 className="font-semibold text-foreground text-sm">
									{entry.label}
								</h3>
							)}
							<Markdown
								components={{
									pre: ({ children }) => (
										<CodeBlockWithCopy>
											{children}
										</CodeBlockWithCopy>
									),
									p: ({ children }) => (
										<p className="mt-0 text-foreground text-sm leading-relaxed">
											{children}
										</p>
									),
								}}
							>
								{entry.code}
							</Markdown>
						</div>
					);
				})}
			</div>
		);
	}

	// No structured entries — either the backend returned an unexpected
	// shape, or there genuinely is no documented usage for this engine
	// type. Surface the raw payload so the user can copy whatever's there
	// instead of staring at an empty pane.
	const hasRaw = fetched.raw !== undefined && fetched.raw !== null;
	return (
		<div className="flex flex-col gap-3 py-4">
			<p className="text-muted-foreground text-sm">
				No structured usage examples were returned for {type}.
			</p>
			{hasRaw && (
				<div className="overflow-hidden rounded-md border border-border">
					<div className="border-border border-b bg-muted px-3 py-1.5 text-muted-foreground text-xs">
						Raw response
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
				children?: ReactNode;
			};
			if (!language && typeof props.language === "string") {
				language = props.language;
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
			toast.error("Failed to copy code");
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
							<Check className="size-3" /> Copied
						</>
					) : (
						<>
							<Copy className="size-3" /> Copy
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
