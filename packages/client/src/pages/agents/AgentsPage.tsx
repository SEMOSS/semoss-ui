import {
	Activity,
	BotMessageSquare,
	ChevronRight,
	Clock,
	Copy,
	RefreshCcw,
	Wrench,
	Zap,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Button, Spinner, toast } from "@semoss/ui/next";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

function formatDuration(ms: number): string {
	if (!ms || ms <= 0) return "—";
	if (ms < 1000) return `${ms}ms`;
	const s = Math.floor(ms / 1000);
	if (s < 60) return `${s}s`;
	const m = Math.floor(s / 60);
	const rem = s % 60;
	return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function formatDateTime(raw: string): string {
	if (!raw) return "—";
	try {
		const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
		const d = new Date(normalized);
		if (Number.isNaN(d.getTime())) return raw;
		return d.toLocaleString();
	} catch {
		return raw;
	}
}

function timeAgo(raw: string): string {
	if (!raw) return "";
	try {
		const d = new Date(raw.includes("T") ? raw : raw.replace(" ", "T"));
		const diff = Date.now() - d.getTime();
		if (diff < 60000) return "just now";
		if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
		if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
		return `${Math.floor(diff / 86400000)}d ago`;
	} catch {
		return "";
	}
}

const HARNESS_COLORS: Record<string, string> = {
	claude_code:
		"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
	room_loop: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
	AskPlayground:
		"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	github_copilot:
		"bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	orchestrator:
		"bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

function getHarnessColor(harness: string): string {
	return (
		HARNESS_COLORS[harness] ??
		"bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
	);
}

interface RoomGroup {
	roomId: string;
	projectId: string | null;
	traces: unknown[];
	totalRuns: number;
	totalToolCalls: number;
	totalInputTokens: number;
	totalOutputTokens: number;
	totalDurationMs: number;
	harnessTypes: string[];
	lastActivity: string;
	hasErrors: boolean;
	users: string[];
}

export const AgentsPage: React.FC = () => {
	const { monolithStore } = useRootStore();
	const navigate = useNavigate();

	const [rooms, setRooms] = useState<RoomGroup[]>([]);
	const [filteredRooms, setFilteredRooms] = useState<RoomGroup[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Filters
	const [searchQuery, setSearchQuery] = useState("");
	const [harnessFilter, setHarnessFilter] = useState("ALL");
	const [userFilter, setUserFilter] = useState("ALL");

	const fetchRooms = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await monolithStore.runQuery(
				`ListAgentTracesByRoom(limit=["200"]);`,
			);
			const output = res?.pixelReturn?.[0]?.output;
			if (Array.isArray(output)) {
				const mapped: RoomGroup[] = output.map(
					(r: Record<string, unknown>) => ({
						roomId: r.ROOM_ID ?? "unknown",
						projectId: r.PROJECT_ID ?? null,
						traces: (r.TRACES ?? []).map(
							(t: Record<string, unknown>) => ({
								TRACE_ID: t.TRACE_ID,
								HARNESS_NAME: t.HARNESS_NAME,
								STATUS: t.STATUS,
								STARTED_AT: t.STARTED_AT,
								DURATION_MS: t.DURATION_MS ?? 0,
								TOOL_CALL_COUNT: t.TOOL_CALL_COUNT ?? 0,
								ITERATIONS: t.ITERATIONS ?? 0,
							}),
						),
						totalRuns: r.TOTAL_RUNS ?? 0,
						totalToolCalls: r.TOTAL_TOOL_CALLS ?? 0,
						totalInputTokens: r.TOTAL_INPUT_TOKENS ?? 0,
						totalOutputTokens: r.TOTAL_OUTPUT_TOKENS ?? 0,
						totalDurationMs: r.TOTAL_DURATION_MS ?? 0,
						harnessTypes: r.HARNESS_TYPES ?? [],
						lastActivity: r.LAST_ACTIVITY ?? "",
						hasErrors: r.HAS_ERRORS ?? false,
						users: r.USERS ?? [],
					}),
				);
				setRooms(mapped);
			}
		} catch (e) {
			setError((e as Error).message ?? "Failed to load traces");
		} finally {
			setLoading(false);
		}
	}, [monolithStore]);

	useEffect(() => {
		fetchRooms();
	}, [fetchRooms]);

	// Derive unique filter options from room data
	const allUsers = React.useMemo(() => {
		const set = new Set<string>();
		for (const r of rooms) {
			for (const u of r.users) set.add(u);
		}
		return Array.from(set).sort();
	}, [rooms]);

	const allHarnesses = React.useMemo(() => {
		const set = new Set<string>();
		for (const r of rooms) {
			for (const h of r.harnessTypes) set.add(h);
		}
		return Array.from(set).sort();
	}, [rooms]);

	// Apply filters
	useEffect(() => {
		let result = rooms;

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(r) =>
					r.roomId.toLowerCase().includes(q) ||
					(r.projectId ?? "").toLowerCase().includes(q),
			);
		}

		if (harnessFilter !== "ALL") {
			result = result.filter((r) =>
				r.harnessTypes.includes(harnessFilter),
			);
		}

		if (userFilter !== "ALL") {
			result = result.filter((r) => r.users?.includes(userFilter));
		}

		setFilteredRooms(result);
	}, [rooms, searchQuery, harnessFilter, userFilter]);

	const hasActiveFilters =
		searchQuery || harnessFilter !== "ALL" || userFilter !== "ALL";

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<div className="flex flex-col gap-5 p-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-bold text-2xl tracking-tight">
							Agent Activity
						</h1>
						<p className="mt-0.5 text-muted-foreground text-sm">
							Monitor all agent runs grouped by conversation room
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={fetchRooms}
						disabled={loading}
					>
						{loading ? (
							<Spinner className="mr-2 size-4" />
						) : (
							<RefreshCcw className="mr-2 size-4" />
						)}
						Refresh
					</Button>
				</div>

				{error && <p className="text-red-600 text-sm">{error}</p>}

				{/* Filters */}
				<div className="flex flex-wrap items-center gap-3">
					<div className="relative">
						<input
							type="text"
							placeholder="Search rooms..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-8 w-52 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
						/>
					</div>
					<select
						value={harnessFilter}
						onChange={(e) => setHarnessFilter(e.target.value)}
						className="h-8 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
					>
						<option value="ALL">All harnesses</option>
						{allHarnesses.map((h) => (
							<option key={h} value={h}>
								{h}
							</option>
						))}
					</select>
					<select
						value={userFilter}
						onChange={(e) => setUserFilter(e.target.value)}
						className="h-8 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
					>
						<option value="ALL">All users</option>
						{allUsers.map((u) => (
							<option key={u} value={u}>
								{u}
							</option>
						))}
					</select>
					{hasActiveFilters && (
						<button
							type="button"
							className="h-8 rounded-md px-2 text-muted-foreground text-xs hover:bg-muted"
							onClick={() => {
								setSearchQuery("");
								setHarnessFilter("ALL");
								setUserFilter("ALL");
							}}
						>
							Clear filters
						</button>
					)}
					<span className="ml-auto text-muted-foreground text-xs">
						{filteredRooms.length} room
						{filteredRooms.length !== 1 ? "s" : ""} ·{" "}
						{filteredRooms.reduce((s, r) => s + r.totalRuns, 0)}{" "}
						total runs
					</span>
				</div>

				{/* Room cards */}
				<div className="grid gap-2">
					{filteredRooms.map((room) => (
						<button
							key={room.roomId}
							type="button"
							className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm"
							onClick={() => navigate(`room/${room.roomId}`)}
						>
							{/* Status indicator */}
							<div
								className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
									room.hasErrors
										? "bg-red-100 dark:bg-red-900/30"
										: "bg-emerald-100 dark:bg-emerald-900/30"
								}`}
							>
								<BotMessageSquare
									className={`size-5 ${
										room.hasErrors
											? "text-red-600 dark:text-red-400"
											: "text-emerald-600 dark:text-emerald-400"
									}`}
								/>
							</div>

							{/* Content */}
							<div className="flex min-w-0 flex-1 flex-col gap-1.5">
								<div className="flex items-center gap-2">
									<span className="truncate font-semibold text-sm">
										{room.projectId &&
										room.projectId !== "null" &&
										room.projectId !== null
											? room.projectId.replace(
													"SYSTEM__",
													"",
												)
											: `Room ${room.roomId.slice(0, 8)}`}
									</span>
									<span className="shrink-0 text-muted-foreground text-xs">
										{formatDateTime(room.lastActivity)} (
										{timeAgo(room.lastActivity)})
									</span>
									{/* User badge */}
									{room.users && room.users.length > 0 && (
										<span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
											{room.users[0]}
										</span>
									)}
								</div>

								{/* Room ID */}
								<div className="flex items-center gap-1.5">
									<span className="font-mono text-[10px] text-muted-foreground">
										{room.roomId}
									</span>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											try {
												navigator.clipboard.writeText(
													room.roomId,
												);
												toast.success(
													"Room ID copied to clipboard",
												);
											} catch {
												toast.error(
													"Failed to copy room ID",
												);
											}
										}}
										className="text-muted-foreground text-xs transition-colors hover:text-foreground"
										title="Copy room ID"
										aria-label="Copy room ID"
									>
										<Copy className="size-3.5" />
									</button>
								</div>

								{/* Harness pills */}
								<div className="flex flex-wrap items-center gap-1.5">
									{room.harnessTypes.map((h) => (
										<span
											key={h}
											className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium text-[10px] ${getHarnessColor(h)}`}
										>
											{h}
										</span>
									))}
									<span className="mx-1 text-border">|</span>
									<span className="flex items-center gap-1 text-muted-foreground text-xs">
										<Activity className="size-3" />
										{room.totalRuns}
									</span>
									<span className="flex items-center gap-1 text-muted-foreground text-xs">
										<Wrench className="size-3" />
										{room.totalToolCalls}
									</span>
									<span className="flex items-center gap-1 text-muted-foreground text-xs">
										<Zap className="size-3" />
										<span className="text-green-600 dark:text-green-400">
											↑
											{room.totalInputTokens.toLocaleString()}
										</span>
										<span className="text-blue-600 dark:text-blue-400">
											↓
											{room.totalOutputTokens.toLocaleString()}
										</span>
									</span>
									<span className="flex items-center gap-1 text-muted-foreground text-xs">
										<Clock className="size-3" />
										{formatDuration(room.totalDurationMs)}
									</span>
								</div>
							</div>

							{/* Chevron */}
							<ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
						</button>
					))}

					{filteredRooms.length === 0 && !loading && (
						<div className="py-12 text-center text-muted-foreground">
							{hasActiveFilters
								? "No rooms match current filters"
								: "No agent activity found"}
						</div>
					)}
				</div>
			</div>
		</>
	);
};
