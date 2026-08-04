import {
	ChevronDown,
	ChevronRight,
	CircleDot,
	Search,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InsightWebSocket } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import { Button, ToggleGroup, ToggleGroupItem } from "@semoss/ui/next";
import {
	APP_LOG_LEVEL_CHIP_CLASSES,
	APP_LOG_LEVEL_TEXT_CLASSES,
	type ParsedAppLogLine,
	parseAppLogLine,
} from "@/utility/parse-app-log-line";

interface ParsedLogLine extends ParsedAppLogLine {
	id: number;
}

const MAX_LINES = 5000;
/** Lines longer than this collapse to a single truncated row until clicked. Typical EngineLogger lines run ~250-400 chars; this should only catch real outliers. */
const LONG_LINE_THRESHOLD = 500;

interface AppLogsMessage {
	action?: "watch_started" | "error";
	type?: "app_logs";
	projectId?: string;
	line?: string;
	message?: string;
}

function isAppLogsMessage(data: unknown): data is AppLogsMessage {
	return typeof data === "object" && data !== null;
}

interface WorkspaceConsoleProps {
	appId: string;
}

/**
 * Live tail of this app's log file, pushed over the same /insightSocket the
 * Terminal panel's insight already connects through. Ephemeral by design —
 * scrollback is dropped on unmount; there is no history to page through here.
 * For that, see the Logs tab (searches the file itself, not a live stream).
 */
export const WorkspaceConsole = ({ appId }: WorkspaceConsoleProps) => {
	const insight = useInsight();
	const [lines, setLines] = useState<ParsedLogLine[]>([]);
	const [connected, setConnected] = useState(false);
	const [paused, setPaused] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [activeLevels, setActiveLevels] = useState<string[]>([
		"INFO",
		"WARN",
		"ERROR",
	]);
	const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

	const wsRef = useRef<InsightWebSocket | null>(null);
	const pausedRef = useRef(paused);
	pausedRef.current = paused;
	const lineIdRef = useRef(0);
	const terminalRef = useRef<HTMLDivElement>(null);

	const appendLine = useCallback((raw: string) => {
		lineIdRef.current += 1;
		const parsed = { ...parseAppLogLine(raw), id: lineIdRef.current };
		setLines((prev) => {
			const combined = [...prev, parsed];
			return combined.length > MAX_LINES
				? combined.slice(-MAX_LINES)
				: combined;
		});
	}, []);

	const toggleExpanded = useCallback((id: number) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}, []);

	useEffect(() => {
		if (!insight.insightId) return;

		// `watched`/`cancelled` are scoped to THIS effect invocation's own `ws`
		// instance (closure, not a ref) — a ref shared across re-runs let a
		// stale socket's status callback race the real one and silently
		// suppress its `watch()` call under React 18 dev-mode's mount → cleanup
		// → mount cycle.
		let watched = false;
		let cancelled = false;
		setError(null);

		const ws = new InsightWebSocket(insight.insightId, {
			onStatusChange: (status) => {
				if (cancelled) return;
				setConnected(status === "connected");
				if (status === "connected" && !watched) {
					watched = true;
					ws.watch("app_logs", { projectId: appId });
				}
			},
			onMessage: (data) => {
				if (cancelled) return;
				if (!isAppLogsMessage(data)) return;
				if (data.action === "error") {
					setError(data.message ?? "Failed to watch app logs");
					return;
				}
				if (data.action === "watch_started") {
					setError(null);
					return;
				}
				if (data.type === "app_logs" && typeof data.line === "string") {
					if (!pausedRef.current) {
						appendLine(data.line);
					}
				}
			},
		});
		wsRef.current = ws;
		ws.connect();

		return () => {
			cancelled = true;
			ws.close();
			wsRef.current = null;
		};
	}, [insight.insightId, appId, appendLine]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: re-run on every new line to auto-scroll, even though `lines` itself isn't read in the body
	useEffect(() => {
		if (!paused && terminalRef.current) {
			terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
		}
	}, [lines, paused]);

	const visibleLines = useMemo(() => {
		const needle = search.trim().toLowerCase();
		return lines.filter((l) => {
			// OTHER/TRACE lines have no corresponding toggle button, so they
			// can never be added to `activeLevels` - excluding them here would
			// silently and permanently hide any line that doesn't match the
			// structured log pattern (e.g. multi-line stack traces).
			const isToggleable =
				l.level === "INFO" ||
				l.level === "WARN" ||
				l.level === "ERROR" ||
				l.level === "DEBUG";
			if (isToggleable && !activeLevels.includes(l.level)) return false;
			if (!needle) return true;
			return l.raw.toLowerCase().includes(needle);
		});
	}, [lines, activeLevels, search]);

	return (
		<div
			className="flex h-full flex-col bg-background"
			data-testid="workspace-console-container"
		>
			<div className="flex flex-wrap items-center justify-between gap-2 border-border border-b bg-muted/40 px-3 py-2">
				<div className="flex items-center gap-2">
					<CircleDot
						className={`size-3 ${connected ? "text-success" : "text-destructive"}`}
					/>
					<span className="font-medium text-foreground text-sm">
						{connected ? "Live" : "Connecting…"}
					</span>
					<span className="text-muted-foreground text-xs">
						{visibleLines.length} lines
					</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1.5 rounded border border-border bg-background px-2 py-1">
						<Search className="size-3 text-muted-foreground" />
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Filter…"
							className="w-28 bg-transparent text-foreground text-xs outline-none placeholder:text-muted-foreground"
							data-testid="workspace-console-search"
						/>
					</div>
					<ToggleGroup
						type="multiple"
						size="sm"
						variant="outline"
						value={activeLevels}
						onValueChange={setActiveLevels}
						data-testid="workspace-console-level-filter"
						className="gap-1"
						spacing={2}
					>
						<ToggleGroupItem
							value="INFO"
							aria-label="Toggle INFO"
							data-testid="workspace-console-level-toggle-info"
							className={`font-mono text-[10px] ${APP_LOG_LEVEL_CHIP_CLASSES.INFO}`}
						>
							INFO
						</ToggleGroupItem>
						<ToggleGroupItem
							value="WARN"
							aria-label="Toggle WARN"
							data-testid="workspace-console-level-toggle-warn"
							className={`font-mono text-[10px] ${APP_LOG_LEVEL_CHIP_CLASSES.WARN}`}
						>
							WARN
						</ToggleGroupItem>
						<ToggleGroupItem
							value="ERROR"
							aria-label="Toggle ERROR"
							data-testid="workspace-console-level-toggle-error"
							className={`font-mono text-[10px] ${APP_LOG_LEVEL_CHIP_CLASSES.ERROR}`}
						>
							ERROR
						</ToggleGroupItem>
						<ToggleGroupItem
							value="DEBUG"
							aria-label="Toggle DEBUG"
							data-testid="workspace-console-level-toggle-debug"
							className={`font-mono text-[10px] ${APP_LOG_LEVEL_CHIP_CLASSES.DEBUG}`}
						>
							DEBUG
						</ToggleGroupItem>
					</ToggleGroup>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setPaused((p) => !p)}
						data-testid="workspace-console-pause-button"
					>
						{paused ? "Resume" : "Pause"}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setLines([])}
						data-testid="workspace-console-clear-button"
					>
						<Trash2 className="size-3" />
					</Button>
				</div>
			</div>

			{error ? (
				<div
					className="border-destructive/30 border-b bg-destructive/10 px-3 py-2 text-destructive text-xs"
					data-testid="workspace-console-error"
				>
					{error}
				</div>
			) : null}

			<div
				ref={terminalRef}
				className="min-h-0 flex-1 overflow-y-auto bg-muted/70 px-4 py-2 font-mono text-[11.5px] leading-[1.9] dark:bg-background"
				data-testid="workspace-console-log"
			>
				{visibleLines.length === 0 ? (
					<span className="text-muted-foreground text-xs italic">
						{connected
							? "Waiting for activity on this app…"
							: "Connecting…"}
					</span>
				) : (
					visibleLines.map((line) => {
						const content = line.timestamp ? (
							<>
								<span className="text-muted-foreground">
									{line.timestamp}
								</span>{" "}
								<span
									className={`inline-block w-12 font-bold ${APP_LOG_LEVEL_TEXT_CLASSES[line.level]}`}
								>
									{line.level}
								</span>{" "}
								{line.source ? (
									<span className="text-muted-foreground/80">
										{line.source}
									</span>
								) : null}{" "}
								<span className="text-foreground">
									{line.message}
								</span>
							</>
						) : (
							<span className="text-muted-foreground">
								{line.raw}
							</span>
						);

						const isLong = line.raw.length > LONG_LINE_THRESHOLD;
						if (!isLong) {
							return (
								<div
									key={line.id}
									className="whitespace-pre-wrap break-all"
								>
									{content}
								</div>
							);
						}

						const isExpanded = expandedIds.has(line.id);
						return (
							<button
								key={line.id}
								type="button"
								onClick={() => toggleExpanded(line.id)}
								className={`flex w-full items-start gap-1 text-left hover:bg-muted/50 ${
									isExpanded
										? "whitespace-pre-wrap break-all"
										: "overflow-hidden"
								}`}
							>
								{isExpanded ? (
									<ChevronDown className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
								) : (
									<ChevronRight className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
								)}
								<span className={isExpanded ? "" : "truncate"}>
									{content}
								</span>
							</button>
						);
					})
				)}
			</div>
		</div>
	);
};
