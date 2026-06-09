// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO

import { CircleDot, RefreshCw, Square, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@semoss/ui/next";
import { useAppDetail } from "@/contexts";
import { useRootStore } from "@/hooks";

interface ParsedLogLine {
	id: number;
	raw: string;
	level: "INFO" | "WARN" | "ERROR" | "DEBUG" | "TRACE" | "OTHER";
}

type LevelFilter = Record<string, boolean>;

const POLL_INTERVAL_MS = 2000;
const LEVEL_REGEX = /^\[(INFO|WARN|ERROR|DEBUG|TRACE)\s*\]/;

const LEVEL_CLASSES: Record<string, string> = {
	INFO: "text-slate-300",
	WARN: "text-yellow-400",
	ERROR: "text-red-400",
	DEBUG: "text-blue-400",
	TRACE: "text-slate-500",
	OTHER: "text-slate-400",
};

function parseLine(raw: string, id: number): ParsedLogLine {
	const match = raw.match(LEVEL_REGEX);
	const level = (match?.[1] as ParsedLogLine["level"]) ?? "OTHER";
	return { id, raw, level };
}

export const AppLogsPage = () => {
	const { appId } = useAppDetail();
	const { monolithStore } = useRootStore();
	const [lines, setLines] = useState<ParsedLogLine[]>([]);
	const [connected, setConnected] = useState(false);
	const [paused, setPaused] = useState(false);
	const [levelFilter, setLevelFilter] = useState<LevelFilter>({
		INFO: true,
		WARN: true,
		ERROR: true,
		DEBUG: false,
	});
	const terminalRef = useRef<HTMLDivElement>(null);
	const lineIdRef = useRef(0);
	const offsetRef = useRef<number>(-1); // -1 = initial load (get last ~50KB)
	const fileSizeRef = useRef<number>(0);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const pausedRef = useRef(paused);
	pausedRef.current = paused;

	const poll = useCallback(async () => {
		try {
			const res = await monolithStore.runQuery(
				`GetAppLogs(paramValues=[{"projectId": "${appId}", "offset": "${offsetRef.current}"}]);`,
			);
			const { operationType, output } = res.pixelReturn[0];
			if (operationType.includes("ERROR")) return;

			const data = output as unknown as {
				lines: string[];
				nextOffset: number;
				fileSize: number;
			};

			// Detect log rotation: if stored offset > new file size, file was rotated
			if (offsetRef.current > 0 && offsetRef.current > data.fileSize) {
				setLines([]);
				lineIdRef.current = 0;
			}

			offsetRef.current = data.nextOffset;
			fileSizeRef.current = data.fileSize;
			setConnected(true);

			if (!pausedRef.current && data.lines.length > 0) {
				const newParsed = data.lines.map((raw) =>
					parseLine(raw, ++lineIdRef.current),
				);
				setLines((prev) => {
					const combined = [...prev, ...newParsed];
					return combined.length > 5000
						? combined.slice(-5000)
						: combined;
				});
			}
		} catch {
			setConnected(false);
		}
	}, [appId, monolithStore]);

	// Start polling on mount, clean up on unmount
	useEffect(() => {
		offsetRef.current = -1;
		poll(); // immediate first fetch
		intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [poll]);

	// Auto-scroll to bottom when new lines arrive (unless paused)
	useEffect(() => {
		if (!paused && terminalRef.current) {
			terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
		}
	}, [lines, paused]);

	const toggleLevel = (level: string) =>
		setLevelFilter((prev) => ({ ...prev, [level]: !prev[level] }));

	const visibleLines = lines.filter((l) => levelFilter[l.level] ?? true);

	const levelButtons = [
		{ key: "INFO", activeClass: "bg-slate-700 text-slate-200" },
		{ key: "WARN", activeClass: "bg-yellow-900 text-yellow-300" },
		{ key: "ERROR", activeClass: "bg-red-900 text-red-300" },
		{ key: "DEBUG", activeClass: "bg-blue-900 text-blue-300" },
	];

	return (
		<div
			className="flex h-full flex-col gap-3"
			data-testid="app-logs-page-container"
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<CircleDot
						className={`size-3 ${connected ? "text-green-400" : "text-red-400"}`}
					/>
					<span
						className={`font-medium text-sm ${connected ? "text-green-400" : "text-red-400"}`}
					>
						{connected ? "Live" : "Disconnected"}
					</span>
					<span className="text-muted-foreground text-xs">
						{visibleLines.length} lines
					</span>
				</div>
				<div className="flex items-center gap-2">
					{levelButtons.map(({ key, activeClass }) => (
						<button
							key={key}
							type="button"
							onClick={() => toggleLevel(key)}
							className={`rounded px-2 py-0.5 font-mono text-xs transition-colors ${
								levelFilter[key]
									? activeClass
									: "bg-muted text-muted-foreground"
							}`}
							data-testid={`app-logs-page-level-${key.toLowerCase()}`}
						>
							{key}
						</button>
					))}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setPaused((p) => !p)}
						data-testid="app-logs-page-pause-button"
					>
						{paused ? (
							<>
								<RefreshCw className="mr-1 size-3" />
								Resume
							</>
						) : (
							<>
								<Square className="mr-1 size-3" />
								Pause
							</>
						)}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setLines([])}
						data-testid="app-logs-page-clear-button"
					>
						<Trash2 className="mr-1 size-3" />
						Clear
					</Button>
				</div>
			</div>
			<div
				ref={terminalRef}
				className="h-[calc(100vh-280px)] min-h-[400px] overflow-y-auto rounded-lg bg-gray-950 p-4 font-mono text-xs leading-5"
				data-testid="app-logs-page-terminal"
			>
				{visibleLines.length === 0 ? (
					<span className="text-slate-500 italic">
						{connected
							? "Waiting for activity on this app…"
							: "Connecting…"}
					</span>
				) : (
					visibleLines.map((line) => (
						<div
							key={line.id}
							className={`whitespace-pre-wrap break-all ${LEVEL_CLASSES[line.level]}`}
						>
							{line.raw}
						</div>
					))
				)}
			</div>
			<p className="text-muted-foreground text-xs">
				⚠ Logs are specific to this container. In a clustered deployment
				each pod streams its own log file independently.
			</p>
		</div>
	);
};
