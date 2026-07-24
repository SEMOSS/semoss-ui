import DOMPurify from "dompurify";
import {
	CheckIcon,
	ChevronRight as ChevronRightIcon,
	Copy as CopyIcon,
	Minus as MinusIcon,
	Plus as PlusIcon,
	Maximize2 as PopoutIcon,
	X as XIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import { JsonViewer } from "./json-viewer";

const detectAndRenderMime = (output: string): ReactNode | null => {
	if (!output || typeof output !== "string") return null;
	const trimmed = output.trim();

	// Base64 PNG (iVBOR signature)
	if (/^iVBOR[0-9A-Za-z+/=]+$/.test(trimmed.replace(/\s+/g, ""))) {
		return (
			<img
				src={`data:image/png;base64,${trimmed}`}
				alt="Cell output visualization"
				className="max-h-96 max-w-full rounded border"
			/>
		);
	}

	// Base64 JPEG (/9j/ signature)
	if (/^\/9j\/[0-9A-Za-z+/=]+$/.test(trimmed.replace(/\s+/g, ""))) {
		return (
			<img
				src={`data:image/jpeg;base64,${trimmed}`}
				alt="Cell output visualization"
				className="max-h-96 max-w-full rounded border"
			/>
		);
	}

	// SVG - executed code output is not trusted content, so sanitize before
	// injecting; this renders directly into the DOM (no sandboxed iframe).
	if (trimmed.startsWith("<svg") && trimmed.includes("</svg>")) {
		return (
			<div
				className="max-h-96 max-w-full overflow-auto rounded border bg-background p-2"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via DOMPurify above
				dangerouslySetInnerHTML={{
					__html: DOMPurify.sanitize(trimmed, {
						USE_PROFILES: { svg: true, svgFilters: true },
					}),
				}}
			/>
		);
	}

	// HTML (div, table, etc.)
	const lower = trimmed.toLowerCase();
	if (
		(lower.startsWith("<div") ||
			lower.startsWith("<table") ||
			lower.startsWith("<html")) &&
		(trimmed.includes("</div>") ||
			trimmed.includes("</table>") ||
			trimmed.includes("</html>"))
	) {
		return (
			<div
				className="max-h-96 max-w-full overflow-auto rounded border bg-background p-2"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via DOMPurify above
				dangerouslySetInnerHTML={{
					__html: DOMPurify.sanitize(trimmed),
				}}
			/>
		);
	}

	// Plotly/Altair JSON specs
	try {
		const parsed = JSON.parse(trimmed);
		if (
			typeof parsed === "object" &&
			parsed !== null &&
			Array.isArray(parsed.data) &&
			typeof parsed.layout === "object"
		) {
			return (
				<div className="max-w-full text-xs">
					<div className="mb-1 text-muted-foreground">
						[Plotly visualization]
					</div>
					<div className="max-h-48 overflow-auto">
						<JsonViewer value={parsed} />
					</div>
				</div>
			);
		}

		if (
			typeof parsed === "object" &&
			parsed !== null &&
			((typeof parsed.$schema === "string" &&
				parsed.$schema.toLowerCase().includes("vega-lite")) ||
				("mark" in parsed && "encoding" in parsed))
		) {
			return (
				<div className="max-w-full text-xs">
					<div className="mb-1 text-muted-foreground">
						[Altair/Vega-Lite visualization]
					</div>
					<div className="max-h-48 overflow-auto">
						<JsonViewer value={parsed} />
					</div>
				</div>
			);
		}
	} catch {
		// Not JSON, fall through to text
	}

	return null;
};

export interface CellOutputBlockProps {
	/**
	 * The input "prompt" row. `icon` shows on the left (persona logo,
	 * language badge, etc.) and `text` is the actual command/expression.
	 * Both are optional — omit to skip the prompt line entirely.
	 */
	prompt?: {
		icon?: ReactNode;
		text: string;
	};

	/** Result / return value as a string. Render with `bg-red-*` when `error`. */
	output?: string;

	/**
	 * Captured stdout/stderr entries — one entry per `print()` / `cat()` call
	 * (concatenated across all console polls for this run). May contain
	 * embedded `\n`s; FORMATTED mode splits on them, RAW mode keeps each
	 * entry intact as its own row.
	 */
	logs?: string[];

	/** True while the job is still running. Shows a "Running…" spinner. */
	pending?: boolean;

	/** Marks the row as an error: red panel, red border, red text. */
	error?: boolean;
}

/**
 * Single-step output renderer shared by `@semoss/terminal`'s REPL transcript
 * and the notebook code-cell. Renders three optional panels stacked under a
 * "prompt" row:
 *
 *  - **Prompt** — `icon > text` + Copy command
 *  - **Logs**   — bordered panel, Raw/Formatted toggle, Copy, Popout. Header
 *    shows "{lines} lines · {bytes}".
 *  - **Result/Error** — bordered panel, Raw/Formatted toggle, Copy, Popout,
 *    and Expand-All / Collapse-All when the value parses as JSON (rendered
 *    via `<JsonViewer>`).
 *
 * Sized for `min-width: 0` flex parents (any panel) — no hardcoded widths.
 */
export const CellOutputBlock = ({
	prompt,
	output = "",
	logs = [],
	pending = false,
	error = false,
}: CellOutputBlockProps) => {
	// `common` is preloaded by every app's I18nBuilder (it's in each app's
	// initial `ns`), so this works from libs/shared without coupling.
	const { t } = useTranslation("common");
	const [rawOutput, setRawOutput] = useState(false);
	const [rawLogsMode, setRawLogsMode] = useState(false);
	const [popoutSection, setPopoutSection] = useState<
		null | "logs" | "result"
	>(null);

	// Bumped by Expand-all / Collapse-all controls so every JsonViewer node
	// re-syncs to the same open state.
	const [expandRev, setExpandRev] = useState(0);
	const [expandAllTo, setExpandAllTo] = useState<boolean | undefined>(
		undefined,
	);

	// RAW mode = one row per original `logs[i]` entry, trailing newline
	// stripped (so the spacing reads cleanly). No splitting, no joining.
	// FORMATTED mode = `logs[i]` split on `\n` for readability and JSON-like
	// lines fed through the JsonViewer.
	const rawLogLines = logs.map((m) => m.replace(/\n$/, ""));
	const messageLines = splitMessageLines(logs);
	// Used for the "Copy logs" payload and the byte counter; we still want
	// the raw blob there since users typically paste this into a bug report.
	const rawLogsText = logs.join("");
	// Are there any JSON / Python-dict log lines we can expand? If so we
	// surface the Expand/Collapse-all buttons on the Logs panel header too.
	const hasStructuredLogs =
		!rawLogsMode &&
		messageLines.some((line) => {
			const v = tryParseStructured(line);
			return v !== null && typeof v === "object";
		});
	const outputValue = parseOutputValue(output);
	const isObjectOutput =
		outputValue !== null &&
		typeof outputValue === "object" &&
		!error &&
		!rawOutput;
	const mimeContent =
		!error && !rawOutput && output ? detectAndRenderMime(output) : null;

	return (
		<div className={`py-2 ${error ? "bg-destructive/5" : ""}`}>
			{prompt && (
				<div className="flex items-start gap-1.5 px-3">
					{prompt.icon && (
						<span className="mt-[2px] inline-flex h-4 w-4 shrink-0 items-center justify-center">
							{prompt.icon}
						</span>
					)}
					<span className="select-none text-muted-foreground">
						&gt;
					</span>
					<span className="flex-1 whitespace-pre-wrap break-all text-foreground">
						{prompt.text}
					</span>
					<CopyButton
						value={prompt.text}
						label={t("cellOutput.copy.command")}
					/>
				</div>
			)}

			{messageLines.length > 0 && (
				<Panel
					label={t("cellOutput.panels.logs")}
					meta={`${t("cellOutput.lines", {
						count: messageLines.length,
					})} · ${formatBytes(rawLogsText)}`}
					accent="zinc"
					collapsible
					defaultCollapsed
					headerExtras={
						<>
							<RawToggle
								raw={rawLogsMode}
								onToggle={() => setRawLogsMode((v) => !v)}
							/>
							{hasStructuredLogs && (
								<ExpandAllToggle
									onExpand={() => {
										setExpandAllTo(true);
										setExpandRev((r) => r + 1);
									}}
									onCollapse={() => {
										setExpandAllTo(false);
										setExpandRev((r) => r + 1);
									}}
								/>
							)}
							<CopyButton
								value={
									rawLogsMode
										? rawLogsText
										: messageLines.join("\n")
								}
								label={t("cellOutput.copy.logs")}
							/>
							<PopoutButton
								onClick={() => setPopoutSection("logs")}
							/>
						</>
					}
				>
					{rawLogsMode ? (
						<div className="flex flex-col gap-0.5 font-mono text-foreground">
							{rawLogLines.map((line, i) => (
								<div
									key={`raw-${i}-${line.length}-${line.slice(0, 16)}`}
									className="whitespace-pre-wrap break-all"
								>
									{line || " "}
								</div>
							))}
						</div>
					) : (
						<div className="flex flex-col gap-0.5 text-foreground">
							{messageLines.map((line, i) => {
								const structured = tryParseStructured(line);
								const mime = detectAndRenderMime(line);
								return (
									<div
										key={`fmt-${i}-${line.length}-${line.slice(0, 16)}`}
									>
										{mime ? (
											mime
										) : structured !== null &&
											typeof structured === "object" ? (
											// Per-line JSON tree — used when a
											// `print(dict)` or similar dumps a
											// structured value to stdout.
											<JsonViewer
												value={structured}
												forceVersion={expandRev}
												forceOpen={expandAllTo}
											/>
										) : (
											<div className="whitespace-pre-wrap break-all">
												{line || " "}
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</Panel>
			)}

			{pending && !output && (
				<div className="mt-1.5 ml-6 flex items-center gap-2 text-muted-foreground italic">
					<span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
					{t("cellOutput.running")}
				</div>
			)}

			{output && (
				<Panel
					label={
						error
							? t("cellOutput.panels.error")
							: t("cellOutput.panels.result")
					}
					meta={`${t("cellOutput.lines", {
						count: countLines(output),
					})} · ${formatBytes(output)}`}
					accent={error ? "red" : "blue"}
					collapsible
					headerExtras={
						<>
							{!error && outputValue !== null && (
								<RawToggle
									raw={rawOutput}
									onToggle={() => setRawOutput((v) => !v)}
								/>
							)}
							{isObjectOutput && (
								<ExpandAllToggle
									onExpand={() => {
										setExpandAllTo(true);
										setExpandRev((r) => r + 1);
									}}
									onCollapse={() => {
										setExpandAllTo(false);
										setExpandRev((r) => r + 1);
									}}
								/>
							)}
							<CopyButton
								value={output}
								label={t("cellOutput.copy.output")}
							/>
							<PopoutButton
								onClick={() => setPopoutSection("result")}
							/>
						</>
					}
				>
					{mimeContent ? (
						mimeContent
					) : isObjectOutput ? (
						<JsonViewer
							value={outputValue}
							forceVersion={expandRev}
							forceOpen={expandAllTo}
						/>
					) : (
						<div
							className={`whitespace-pre-wrap break-all ${
								error ? "text-destructive" : "text-foreground"
							}`}
						>
							{output}
						</div>
					)}
				</Panel>
			)}

			{popoutSection === "logs" && (
				<PopoutModal
					title={t("cellOutput.panels.logs")}
					meta={`${t("cellOutput.lines", {
						count: messageLines.length,
					})} · ${formatBytes(rawLogsText)}`}
					actions={
						<>
							<RawToggle
								raw={rawLogsMode}
								onToggle={() => setRawLogsMode((v) => !v)}
							/>
							{hasStructuredLogs && (
								<ExpandAllToggle
									onExpand={() => {
										setExpandAllTo(true);
										setExpandRev((r) => r + 1);
									}}
									onCollapse={() => {
										setExpandAllTo(false);
										setExpandRev((r) => r + 1);
									}}
								/>
							)}
							<CopyButton
								value={
									rawLogsMode
										? rawLogsText
										: messageLines.join("\n")
								}
								label={t("cellOutput.copy.logs")}
							/>
						</>
					}
					onClose={() => setPopoutSection(null)}
				>
					{rawLogsMode ? (
						<div className="flex flex-col gap-0.5 font-mono text-foreground text-sm">
							{rawLogLines.map((line, i) => (
								<div
									key={`popout-raw-${i}-${line.length}-${line.slice(0, 16)}`}
									className="whitespace-pre-wrap break-all"
								>
									{line || " "}
								</div>
							))}
						</div>
					) : (
						<div className="flex flex-col gap-0.5 font-mono text-foreground text-sm">
							{messageLines.map((line, i) => {
								const structured = tryParseStructured(line);
								const mime = detectAndRenderMime(line);
								return (
									<div
										key={`popout-fmt-${i}-${line.length}-${line.slice(0, 16)}`}
									>
										{mime ? (
											mime
										) : structured !== null &&
											typeof structured === "object" ? (
											<JsonViewer
												value={structured}
												forceVersion={expandRev}
												forceOpen={expandAllTo}
											/>
										) : (
											<div className="whitespace-pre-wrap break-all">
												{line || " "}
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</PopoutModal>
			)}

			{popoutSection === "result" && (
				<PopoutModal
					title={
						error
							? t("cellOutput.panels.error")
							: t("cellOutput.panels.result")
					}
					meta={`${t("cellOutput.lines", {
						count: countLines(output),
					})} · ${formatBytes(output)}`}
					actions={
						<>
							{!error && outputValue !== null && (
								<RawToggle
									raw={rawOutput}
									onToggle={() => setRawOutput((v) => !v)}
								/>
							)}
							{isObjectOutput && (
								<ExpandAllToggle
									onExpand={() => {
										setExpandAllTo(true);
										setExpandRev((r) => r + 1);
									}}
									onCollapse={() => {
										setExpandAllTo(false);
										setExpandRev((r) => r + 1);
									}}
								/>
							)}
							<CopyButton
								value={output}
								label={t("cellOutput.copy.output")}
							/>
						</>
					}
					onClose={() => setPopoutSection(null)}
				>
					{isObjectOutput ? (
						<JsonViewer
							value={outputValue}
							forceVersion={expandRev}
							forceOpen={expandAllTo}
						/>
					) : (
						<pre
							className={`whitespace-pre-wrap break-all font-mono text-sm ${
								error ? "text-destructive" : "text-foreground"
							}`}
						>
							{output}
						</pre>
					)}
				</PopoutModal>
			)}
		</div>
	);
};

// ---------------------------------------------------------------------------
// Panel — bordered + labeled wrapper used for Logs / Result / Error blocks
// ---------------------------------------------------------------------------

interface PanelProps {
	label: string;
	meta?: string;
	accent: "blue" | "red" | "zinc";
	headerExtras?: ReactNode;
	children: ReactNode;
	/**
	 * When true, renders a chevron on the leading edge of the header and
	 * collapses the body on click. Used by the Logs panel so verbose
	 * stdout/stderr starts hidden and the Result panel reads cleanly.
	 */
	collapsible?: boolean;
	/** Initial state when `collapsible` is enabled. Defaults to expanded. */
	defaultCollapsed?: boolean;
}

// Panel's leading edge aligns with the prompt-row logo (the row uses `px-3`,
// so 12px / `ms-3` lines the panel up with the icon). Trailing edge keeps a
// matching `me-3` gap from the transcript scroll edge. Accent stripe
// (`border-s-4`) sits on the reading-leading edge in both LTR and RTL.
const ACCENT_STYLES = {
	blue: {
		wrapper:
			"mt-2 ms-3 me-3 overflow-hidden rounded-md border border-s-4 border-border border-s-primary bg-background",
		header: "border-border bg-primary/10 text-primary",
	},
	red: {
		wrapper:
			"mt-2 ms-3 me-3 overflow-hidden rounded-md border border-s-4 border-destructive/30 border-s-destructive bg-destructive/5",
		header: "border-destructive/30 bg-destructive/10 text-destructive",
	},
	zinc: {
		wrapper:
			"mt-2 ms-3 me-3 overflow-hidden rounded-md border border-s-4 border-border border-s-muted-foreground/60 bg-muted/40",
		header: "border-border bg-background text-muted-foreground",
	},
} as const;

const Panel = ({
	label,
	meta,
	accent,
	headerExtras,
	children,
	collapsible = false,
	defaultCollapsed = false,
}: PanelProps) => {
	const styles = ACCENT_STYLES[accent];
	const [collapsed, setCollapsed] = useState(
		collapsible ? defaultCollapsed : false,
	);
	const toggle = () => {
		if (collapsible) setCollapsed((c) => !c);
	};
	return (
		<div className={styles.wrapper}>
			<div
				className={`flex items-center gap-2 px-2.5 py-1 ${
					collapsed ? "" : "border-b"
				} ${styles.header}`}
			>
				{collapsible && (
					<button
						type="button"
						onClick={toggle}
						aria-expanded={!collapsed}
						aria-label={label}
						className="-ms-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded hover:bg-current/10"
					>
						<ChevronRightIcon
							className={`h-3 w-3 transition-transform ${collapsed ? "rtl:-rotate-180" : "rotate-90"}`}
						/>
					</button>
				)}
				<button
					type="button"
					onClick={toggle}
					disabled={!collapsible}
					className={`flex items-center gap-2 ${collapsible ? "cursor-pointer" : "cursor-default"}`}
				>
					<span className="font-semibold text-[10px] uppercase tracking-wider">
						{label}
					</span>
					{meta && (
						<span className="font-normal text-[10px] opacity-70">
							{meta}
						</span>
					)}
				</button>
				<span className="flex-1" />
				{headerExtras}
			</div>
			{!collapsed && <div className="px-2.5 py-1.5">{children}</div>}
		</div>
	);
};

// ---------------------------------------------------------------------------
// Per-row toolbar buttons
// ---------------------------------------------------------------------------

const CopyButton = ({ value, label }: { value: string; label: string }) => {
	const { t } = useTranslation("common");
	const [copied, setCopied] = useState(false);
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
		} catch {
			// ignore
		}
	};
	useEffect(() => {
		if (!copied) return;
		const timer = setTimeout(() => setCopied(false), 1500);
		return () => clearTimeout(timer);
	}, [copied]);
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
					onClick={copy}
					aria-label={label}
				>
					{copied ? (
						<CheckIcon className="h-3.5 w-3.5" />
					) : (
						<CopyIcon className="h-3.5 w-3.5" />
					)}
				</button>
			</TooltipTrigger>
			<TooltipContent>
				{copied ? t("cellOutput.copy.copied") : label}
			</TooltipContent>
		</Tooltip>
	);
};

const PopoutButton = ({ onClick }: { onClick: () => void }) => {
	const { t } = useTranslation("common");
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
					onClick={onClick}
					aria-label={t("cellOutput.popout")}
				>
					<PopoutIcon className="h-3.5 w-3.5" />
				</button>
			</TooltipTrigger>
			<TooltipContent>{t("cellOutput.popout")}</TooltipContent>
		</Tooltip>
	);
};

const RawToggle = ({
	raw,
	onToggle,
}: {
	raw: boolean;
	onToggle: () => void;
}) => {
	const { t } = useTranslation("common");
	return (
		<div className="inline-flex overflow-hidden rounded border border-current/30 font-medium text-[10px]">
			<button
				type="button"
				className={
					"px-1.5 py-0" +
					(!raw
						? "bg-current/15"
						: "bg-transparent hover:bg-current/10")
				}
				onClick={() => {
					if (raw) onToggle();
				}}
			>
				{t("cellOutput.format.formatted")}
			</button>
			<button
				type="button"
				className={
					"border-current/30 border-l px-1.5 py-0" +
					(raw
						? "bg-current/15"
						: "bg-transparent hover:bg-current/10")
				}
				onClick={() => {
					if (!raw) onToggle();
				}}
			>
				{t("cellOutput.format.raw")}
			</button>
		</div>
	);
};

const ExpandAllToggle = ({
	onExpand,
	onCollapse,
}: {
	onExpand: () => void;
	onCollapse: () => void;
}) => {
	const { t } = useTranslation("common");
	return (
		<div className="inline-flex overflow-hidden rounded border border-current/30">
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						className="flex items-center px-1 py-0.5 hover:bg-current/10"
						onClick={onExpand}
						aria-label={t("cellOutput.expandAll")}
					>
						<PlusIcon className="h-3 w-3" />
					</button>
				</TooltipTrigger>
				<TooltipContent>{t("cellOutput.expandAll")}</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						className="flex items-center border-current/30 border-l px-1 py-0.5 hover:bg-current/10"
						onClick={onCollapse}
						aria-label={t("cellOutput.collapseAll")}
					>
						<MinusIcon className="h-3 w-3" />
					</button>
				</TooltipTrigger>
				<TooltipContent>{t("cellOutput.collapseAll")}</TooltipContent>
			</Tooltip>
		</div>
	);
};

// ---------------------------------------------------------------------------
// PopoutModal — viewport-sized modal that re-renders panel content bigger
// ---------------------------------------------------------------------------

const PopoutModal = ({
	title,
	meta,
	actions,
	children,
	onClose,
}: {
	title: string;
	meta?: string;
	/** Toolbar buttons (Copy, Raw/Formatted toggle, Expand-all, etc.) shown
	 * in the header next to the close button — mirror of the inline panel's
	 * own header so the user has the same controls in the bigger view. */
	actions?: ReactNode;
	children: ReactNode;
	onClose: () => void;
}) => {
	const { t } = useTranslation("common");
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			tabIndex={-1}
			className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
			onClick={(e) => {
				// only close when the click is on the backdrop itself, not on
				// the modal content bubbling up
				if (e.target === e.currentTarget) onClose();
			}}
			onKeyDown={(e) => {
				if (e.key === "Escape") onClose();
			}}
		>
			<div
				className="flex max-h-[90vh] max-w-[90vw] flex-col overflow-hidden rounded-lg bg-background shadow-2xl"
				style={{
					width: "min(90vw, 1100px)",
					height: "min(90vh, 800px)",
				}}
			>
				<div className="flex items-center gap-2 border-border border-b px-4 py-2">
					<div className="font-semibold text-foreground text-sm">
						{title}
					</div>
					{meta && (
						<div className="text-muted-foreground text-xs">
							{meta}
						</div>
					)}
					<div className="flex-1" />
					{actions}
					<button
						type="button"
						className="ml-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
						onClick={onClose}
						aria-label={t("cellOutput.close")}
					>
						<XIcon className="h-4 w-4" />
					</button>
				</div>
				<div className="min-h-0 flex-1 overflow-auto p-4">
					{children}
				</div>
			</div>
		</div>
	);
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const splitMessageLines = (messages: string[]): string[] => {
	const out: string[] = [];
	for (const msg of messages) {
		if (msg === undefined || msg === null) continue;
		const trimmed = msg.replace(/\n$/, "");
		const parts = trimmed.split("\n");
		out.push(...parts);
	}
	return out;
};

const countLines = (text: string): number => {
	if (!text) return 0;
	const trimmed = text.endsWith("\n") ? text.slice(0, -1) : text;
	if (!trimmed) return 0;
	return trimmed.split("\n").length;
};

const formatBytes = (text: string): string => {
	const n = new Blob([text || ""]).size;
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
	return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const parseOutputValue = (output: string): unknown | null => {
	return tryParseStructured(output);
};

/**
 * Try to coerce a string into a JSON-ish value so we can render it via the
 * JsonViewer. Handles both real JSON and Python's dict/list repr (single
 * quotes + `True`/`False`/`None`) — which is what `print(some_dict)` emits.
 *
 * Returns `null` when the string doesn't look structured or can't be parsed.
 */
const tryParseStructured = (raw: string): unknown | null => {
	if (!raw) return null;
	const trimmed = raw.trim();
	if (
		!(trimmed.startsWith("{") && trimmed.endsWith("}")) &&
		!(trimmed.startsWith("[") && trimmed.endsWith("]"))
	) {
		return null;
	}
	// Pass 1 — straight JSON.
	try {
		return JSON.parse(trimmed);
	} catch {
		// fall through
	}
	// Pass 2 — best-effort Python repr → JSON. Swap single → double quotes
	// for keys/strings and convert Python literals. We intentionally don't
	// try to handle every edge case (escaped quotes inside strings) — if
	// it doesn't round-trip, we just give up and render as plain text.
	try {
		const swapped = trimmed
			.replace(/(^|[\s,{[(])'((?:\\.|[^'\\])*)'/g, '$1"$2"')
			.replace(/\bTrue\b/g, "true")
			.replace(/\bFalse\b/g, "false")
			.replace(/\bNone\b/g, "null");
		return JSON.parse(swapped);
	} catch {
		return null;
	}
};

// Re-export so consumers can compose their own renderers if they want just
// the JSON tree.
export { JsonViewer } from "./json-viewer";
