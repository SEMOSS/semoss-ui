import {
	ChevronDown,
	ChevronRight,
	CirclePause,
	CirclePlay,
	Trash2,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, Input } from "@semoss/ui/next";
import type {
	BrowserDebugEvent,
	BrowserNetworkDebugEvent,
} from "../types/browserEvents";

interface BrowserDebugPanelProps {
	events: BrowserDebugEvent[];
	droppedCount: number;
	isPaused: boolean;
	onTogglePause: () => void;
	onClear: () => void;
	onClose: () => void;
}

type DebugTab = "network" | "console";

const formatTime = (timestamp: number): string =>
	new Date(timestamp).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		fractionalSecondDigits: 3,
	});

const requestName = (url: string): string => {
	try {
		const parsed = new URL(url);
		const segments = parsed.pathname.split("/").filter(Boolean);
		return segments.at(-1) || parsed.hostname || url;
	} catch {
		return url;
	}
};

const statusClass = (row: BrowserNetworkDebugEvent): string => {
	if (row.phase === "failed" || (row.status && row.status >= 400)) {
		return "text-danger";
	}
	if (row.status && row.status >= 300) return "text-warning";
	if (row.status) return "text-success";
	return "text-ink-muted";
};

/** Browser-neutral Network and Console diagnostics for the active session. */
export function BrowserDebugPanel({
	events,
	droppedCount,
	isPaused,
	onTogglePause,
	onClear,
	onClose,
}: BrowserDebugPanelProps) {
	const [activeTab, setActiveTab] = useState<DebugTab>("network");
	const [filter, setFilter] = useState("");
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const networkRows = useMemo(() => {
		const rows = new Map<string, BrowserNetworkDebugEvent>();
		for (const event of events) {
			if (event.kind !== "network") continue;
			const existing = rows.get(event.requestId);
			rows.set(
				event.requestId,
				existing
					? { ...existing, ...event, timestamp: existing.timestamp }
					: event,
			);
		}
		return Array.from(rows.values());
	}, [events]);

	const consoleRows = useMemo(
		() => events.filter((event) => event.kind !== "network"),
		[events],
	);

	const normalizedFilter = filter.trim().toLowerCase();
	const filteredNetworkRows = networkRows.filter((row) =>
		[
			row.method,
			row.url,
			row.resourceType,
			row.status,
			row.error,
			row.tabId,
		]
			.filter((value) => value !== undefined)
			.some((value) =>
				String(value).toLowerCase().includes(normalizedFilter),
			),
	);
	const filteredConsoleRows = consoleRows.filter((row) =>
		[
			row.level,
			row.message,
			row.kind === "console" ? row.source : undefined,
			row.tabId,
		]
			.filter((value) => value !== undefined)
			.some((value) =>
				String(value).toLowerCase().includes(normalizedFilter),
			),
	);

	return (
		<section
			aria-label="Browser debug panel"
			className="flex h-64 shrink-0 flex-col border-line border-t bg-surface"
		>
			<div className="flex min-h-10 items-center gap-1 border-line border-b px-2">
				<Button
					size="sm"
					variant={activeTab === "network" ? "default" : "ghost"}
					onClick={() => setActiveTab("network")}
				>
					Network ({networkRows.length})
				</Button>
				<Button
					size="sm"
					variant={activeTab === "console" ? "default" : "ghost"}
					onClick={() => setActiveTab("console")}
				>
					Console ({consoleRows.length})
				</Button>
				<Input
					value={filter}
					onChange={(event) => setFilter(event.target.value)}
					placeholder="Filter events"
					aria-label="Filter browser debug events"
					className="ml-2 h-8 max-w-64"
				/>
				{isPaused && <Badge variant="outline">Paused</Badge>}
				{droppedCount > 0 && (
					<Badge variant="destructive">{droppedCount} dropped</Badge>
				)}
				<div className="ml-auto flex items-center gap-1">
					<Button
						size="icon-sm"
						variant="ghost"
						aria-label={
							isPaused
								? "Resume debug capture"
								: "Pause debug capture"
						}
						onClick={onTogglePause}
					>
						{isPaused ? <CirclePlay /> : <CirclePause />}
					</Button>
					<Button
						size="icon-sm"
						variant="ghost"
						aria-label="Clear debug events"
						onClick={onClear}
					>
						<Trash2 />
					</Button>
					<Button
						size="icon-sm"
						variant="ghost"
						aria-label="Close debug panel"
						onClick={onClose}
					>
						<X />
					</Button>
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-auto font-mono text-xs">
				{activeTab === "network" ? (
					<div className="min-w-[48rem]">
						<div className="sticky top-0 grid grid-cols-[2rem_5rem_minmax(16rem,1fr)_5rem_6rem_5rem_7rem] border-line border-b bg-surface-raised px-2 py-1.5 font-medium text-ink-muted">
							<span />
							<span>Method</span>
							<span>Name</span>
							<span>Status</span>
							<span>Type</span>
							<span>Time</span>
							<span>Tab</span>
						</div>
						{filteredNetworkRows.length === 0 ? (
							<p className="p-4 text-ink-muted">
								No matching network requests
							</p>
						) : (
							filteredNetworkRows.map((row) => {
								const expanded = expandedId === row.requestId;
								return (
									<div
										key={row.requestId}
										className="border-line border-b"
									>
										<button
											type="button"
											className="grid w-full grid-cols-[2rem_5rem_minmax(16rem,1fr)_5rem_6rem_5rem_7rem] items-center px-2 py-1.5 text-left hover:bg-surface-raised"
											onClick={() =>
												setExpandedId(
													expanded
														? null
														: row.requestId,
												)
											}
										>
											{expanded ? (
												<ChevronDown />
											) : (
												<ChevronRight />
											)}
											<span>{row.method}</span>
											<span
												className="truncate"
												title={row.url}
											>
												{requestName(row.url)}
											</span>
											<span className={statusClass(row)}>
												{row.phase === "failed"
													? "Failed"
													: row.status || "Pending"}
											</span>
											<span>{row.resourceType}</span>
											<span>
												{row.durationMs === undefined
													? "—"
													: `${row.durationMs} ms`}
											</span>
											<span>{row.tabId}</span>
										</button>
										{expanded && (
											<div className="space-y-1 bg-canvas px-10 py-2 text-ink-muted">
												<p className="break-all">
													<span className="font-semibold text-ink">
														URL:
													</span>{" "}
													{row.url}
												</p>
												<p>
													<span className="font-semibold text-ink">
														Started:
													</span>{" "}
													{formatTime(row.timestamp)}
												</p>
												{row.statusText && (
													<p>
														<span className="font-semibold text-ink">
															Status:
														</span>{" "}
														{row.status}{" "}
														{row.statusText}
													</p>
												)}
												{row.error && (
													<p className="text-danger">
														<span className="font-semibold">
															Error:
														</span>{" "}
														{row.error}
													</p>
												)}
											</div>
										)}
									</div>
								);
							})
						)}
					</div>
				) : filteredConsoleRows.length === 0 ? (
					<p className="p-4 text-ink-muted">
						No matching console messages
					</p>
				) : (
					<div>
						{filteredConsoleRows.map((row) => (
							<div
								key={row.id}
								className={`grid grid-cols-[5rem_5rem_minmax(16rem,1fr)_7rem] gap-2 border-line border-b px-3 py-1.5 ${row.level === "error" ? "text-danger" : "text-ink"}`}
							>
								<span>{formatTime(row.timestamp)}</span>
								<span>
									{row.kind === "page-error"
										? "page error"
										: row.level}
								</span>
								<span className="break-words">
									{row.message}
									{row.kind === "console" && row.source && (
										<span className="ml-2 text-ink-muted">
											{row.source}
										</span>
									)}
								</span>
								<span>{row.tabId}</span>
							</div>
						))}
					</div>
				)}
			</div>
		</section>
	);
}
