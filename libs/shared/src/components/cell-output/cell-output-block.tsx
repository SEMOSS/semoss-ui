import {
	CheckIcon,
	ChevronRight as ChevronRightIcon,
	Copy as CopyIcon,
	Minus as MinusIcon,
	Plus as PlusIcon,
	Maximize2 as PopoutIcon,
	X as XIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	Markdown,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import {
	countInlineImages,
	countLines,
	formatBytes,
	hasInlineImage,
	isTabularArray,
	looksLikeHtmlDocument,
	looksLikeMarkdown,
	normalizeForMarkdown,
	parseStructuredOutput,
	splitMessageLines,
} from "@semoss/utility";
import { SandpackHtmlPreview } from "../html";
import { InlineImageSegments } from "./inline-image";
import { JsonViewer } from "./json-viewer";

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
	/** Optional parent-owned popout for the result panel. */
	onOutputPopout?: () => void;
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
	onOutputPopout,
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
			const v = parseStructuredOutput(line);
			return v !== null && typeof v === "object";
		});
	const outputValue = parseStructuredOutput(output);
	const isObjectOutput =
		outputValue !== null &&
		typeof outputValue === "object" &&
		!error &&
		!rawOutput;

	const isTableOutput = isObjectOutput && isTabularArray(outputValue);

	const htmlText = !isObjectOutput ? normalizeForMarkdown(output) : "";
	const isHtmlOutput =
		!isObjectOutput &&
		!error &&
		!rawOutput &&
		looksLikeHtmlDocument(htmlText);
	const isMarkdownOutput =
		!isObjectOutput &&
		!isHtmlOutput &&
		!error &&
		!rawOutput &&
		looksLikeMarkdown(output);

	const markdownText = isMarkdownOutput ? normalizeForMarkdown(output) : "";

	// Python executions return rendered figures as inline base64 images. In
	// FORMATTED mode we show the picture; RAW mode falls through to the plain
	// text branch so the underlying html stays copyable.
	const outputImageCount = countInlineImages(output);
	const showOutputImages =
		outputImageCount > 0 && !rawOutput && !isObjectOutput;
	const logsImageCount = logs.reduce(
		(total, entry) => total + countInlineImages(entry),
		0,
	);

	return (
		<div className={`py-2 ${error ? "bg-destructive/5" : ""}`}>
			{prompt && (
				<div className="flex items-start gap-1.5 px-3">
					{prompt.icon && (
						<span className="mt-[2px] inline-flex h-4 w-4 shrink-0 select-none items-center justify-center">
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
					// The Logs panel starts collapsed, so call out any images in
					// the header - otherwise a figure that fell back to the log
					// channel is invisible until the user expands it.
					meta={`${t("cellOutput.lines", {
						count: messageLines.length,
					})} · ${formatBytes(rawLogsText)}${
						logsImageCount > 0
							? ` · ${t("cellOutput.images", { count: logsImageCount })}`
							: ""
					}`}
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
						<FormattedLines
							lines={messageLines}
							expandRev={expandRev}
							expandAllTo={expandAllTo}
							className="flex flex-col gap-0.5 text-foreground"
						/>
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
					})} · ${formatBytes(output)}${
						outputImageCount > 0
							? ` · ${t("cellOutput.images", { count: outputImageCount })}`
							: ""
					}`}
					accent={error ? "red" : "blue"}
					collapsible
					headerExtras={
						<>
							{!error &&
								(outputValue !== null ||
									outputImageCount > 0 ||
									isHtmlOutput) && (
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
								onClick={() =>
									onOutputPopout
										? onOutputPopout()
										: setPopoutSection("result")
								}
							/>
						</>
					}
				>
					{isTableOutput ? (
						<DataTable
							rows={outputValue as Record<string, unknown>[]}
						/>
					) : isObjectOutput ? (
						<JsonViewer
							value={outputValue}
							forceVersion={expandRev}
							forceOpen={expandAllTo}
						/>
					) : isHtmlOutput ? (
						<div className="h-72">
							<SandpackHtmlPreview
								html={htmlText}
								forceFullHeight
								className="border-0"
							/>
						</div>
					) : isMarkdownOutput ? (
						<div className="prose prose-sm dark:prose-invert max-w-none">
							<Markdown>{markdownText}</Markdown>
						</div>
					) : showOutputImages ? (
						<InlineImageSegments
							text={output}
							textClassName={`whitespace-pre-wrap break-all ${
								error ? "text-destructive" : "text-foreground"
							}`}
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
						<FormattedLines
							lines={messageLines}
							expandRev={expandRev}
							expandAllTo={expandAllTo}
							className="flex flex-col gap-0.5 font-mono text-foreground text-sm"
							// the modal has room, so show figures at full size
							imageClassName="max-h-none"
						/>
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
							{!error &&
								(outputValue !== null ||
									outputImageCount > 0 ||
									isHtmlOutput) && (
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
					{isTableOutput ? (
						<DataTable
							rows={outputValue as Record<string, unknown>[]}
						/>
					) : isObjectOutput ? (
						<JsonViewer
							value={outputValue}
							forceVersion={expandRev}
							forceOpen={expandAllTo}
						/>
					) : isHtmlOutput ? (
						<div className="h-full min-h-0">
							<SandpackHtmlPreview
								html={htmlText}
								forceFullHeight
								className="border-0"
							/>
						</div>
					) : isMarkdownOutput ? (
						<div className="prose prose-sm dark:prose-invert max-w-none">
							<Markdown>{markdownText}</Markdown>
						</div>
					) : showOutputImages ? (
						<InlineImageSegments
							text={output}
							textClassName={`whitespace-pre-wrap break-all font-mono text-sm ${
								error ? "text-destructive" : "text-foreground"
							}`}
							// the modal has room, so show figures at full size
							imageClassName="max-h-none"
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
// FormattedLines — FORMATTED-mode log body, shared by the panel and its popout
// ---------------------------------------------------------------------------

interface FormattedLinesProps {
	lines: string[];
	expandRev: number;
	expandAllTo: boolean | undefined;
	className: string;
	imageClassName?: string;
}

/**
 * Renders each log line as, in priority order: an inline image preview, a
 * JSON tree, or plain text.
 */
const FormattedLines = ({
	lines,
	expandRev,
	expandAllTo,
	className,
	imageClassName,
}: FormattedLinesProps) => (
	<div className={className}>
		{lines.map((line, i) => {
			const key = `fmt-${i}-${line.length}-${line.slice(0, 16)}`;
			if (hasInlineImage(line)) {
				return (
					<InlineImageSegments
						key={key}
						text={line}
						imageClassName={imageClassName}
					/>
				);
			}
			const structured = parseStructuredOutput(line);
			return (
				<div key={key}>
					{structured !== null && typeof structured === "object" ? (
						// Per-line JSON tree — used when a `print(dict)` or
						// similar dumps a structured value to stdout.
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
);

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
			{/* `select-none` keeps the label, byte counter and toolbar out of
			    any selection that spans the panel. */}
			<div
				className={`flex select-none items-center gap-2 px-2.5 py-1 ${
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
		<Tooltip disableHoverableContent={false}>
			<TooltipTrigger asChild>
				<button
					type="button"
					className="select-none rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
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
		<Tooltip disableHoverableContent={false}>
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
			<Tooltip disableHoverableContent={false}>
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
			<Tooltip disableHoverableContent={false}>
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

export const PopoutModal = ({
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
	const contentRef = useRef<HTMLDivElement>(null);
	const returnFocusRef = useRef<HTMLElement | null>(
		typeof document !== "undefined" &&
			document.activeElement instanceof HTMLElement
			? document.activeElement
			: null,
	);

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent
				ref={contentRef}
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					contentRef.current?.focus();
				}}
				showCloseButton={false}
				aria-describedby={undefined}
				className="h-4/5 gap-0 overflow-hidden p-0 sm:max-w-6xl"
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					returnFocusRef.current?.focus();
				}}
			>
				<div className="flex shrink-0 flex-wrap items-center gap-2 border-border border-b px-4 py-2">
					<DialogTitle className="font-medium text-base leading-6">
						{title}
					</DialogTitle>
					{meta && (
						<span className="text-muted-foreground text-xs">
							{meta}
						</span>
					)}
					<div className="flex-1" />
					{actions}
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={onClose}
								aria-label={t("cellOutput.close")}
							>
								<XIcon aria-hidden className="size-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>{t("cellOutput.close")}</TooltipContent>
					</Tooltip>
				</div>
				<div className="min-h-0 flex-1 overflow-auto p-4">
					{children}
				</div>
			</DialogContent>
		</Dialog>
	);
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

// Re-export so consumers can compose their own renderers if they want just
// the JSON tree.
export { JsonViewer } from "./json-viewer";

/** Renders an array of objects as a simple table. */
function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
	const columns = Object.keys(rows[0]);
	return (
		<div className="overflow-auto">
			<table className="w-full border-collapse text-xs">
				<thead>
					<tr className="border-b bg-muted/50">
						{columns.map((col) => (
							<th
								key={col}
								className="whitespace-nowrap px-2 py-1.5 text-left font-semibold text-muted-foreground"
							>
								{col}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, i) => (
						<tr
							key={`row-${i}-${String(row[columns[0]] ?? i)}`}
							className="border-b last:border-0 hover:bg-muted/30"
						>
							{columns.map((col) => (
								<td
									key={col}
									className="whitespace-nowrap px-2 py-1 text-foreground"
								>
									{String(row[col] ?? "")}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
