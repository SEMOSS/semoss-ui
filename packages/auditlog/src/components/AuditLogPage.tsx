/** biome-ignore-all lint/nursery/useSortedClasses: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */

import { Loader2, Moon, Radio, Sun } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import {
	type AuditLog,
	buildSearchPayload,
	ChartPanel,
	EventHistory,
	FiltersRow,
	type SearchToken,
} from "@semoss/shared";
import { Button } from "@semoss/ui/next";
import { useUserRootStore } from "@/hooks/useUserRootStore";

type EngineOption = { value: string; label: string };
type EngineDetails = Record<string, EngineOption[]>;

const ROWS_PER_PAGE = 10;

const ENGINE_TYPES = [
	"APP",
	"MODEL",
	"DATABASE",
	"VECTOR",
	"FUNCTION",
	"STORAGE",
	"PROJECT",
];

const INITIAL_ENGINE_DETAILS: EngineDetails = Object.fromEntries(
	ENGINE_TYPES.map((t) => [t, []]),
);

const DASHBOARD_DURATIONS = [
	{ label: "Today", value: "today", dateRangeType: "DAY", dateRangeValue: 1 },
	{
		label: "Last 7 Days",
		value: "7days",
		dateRangeType: "WEEK",
		dateRangeValue: 1,
	},
	{
		label: "Last 30 Days",
		value: "30days",
		dateRangeType: "MONTH",
		dateRangeValue: 1,
	},
	{
		label: "Custom",
		value: "custom",
		dateRangeType: "CUSTOM",
		dateRangeValue: 1,
	},
] as const;

type DurationValue = (typeof DASHBOARD_DURATIONS)[number]["value"];

export const AuditLogPage = () => {
	const { insightId } = useInsight();
	const rootStore = useUserRootStore(insightId);
	const userId = rootStore?.user?.id ?? "";

	const [dark, setDark] = useState(false);
	const [chartTab, setChartTab] = useState<"bar" | "timeline">("timeline");
	const [chartPage, setChartPage] = useState(0);
	const [searchTokens, setSearchTokens] = useState<SearchToken[]>([]);
	const [searchFreeText, setSearchFreeText] = useState("");
	const [selected, setSelected] = useState<AuditLog | null>(null);
	const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

	const [logs, setLogs] = useState<AuditLog[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(0);
	const [engineDetails, setEngineDetails] = useState<EngineDetails>({
		...INITIAL_ENGINE_DETAILS,
	});

	const [engineType, setEngType] = useState("");
	const [engineId, setEngId] = useState("");
	const todayStr = new Date().toISOString().split("T")[0];
	const [dateFrom, setDateFrom] = useState(todayStr);
	const [dateTo, setDateTo] = useState(todayStr);
	const [durationValue, setDurationValue] = useState<DurationValue>("today");
	const [selectedUser, setSelectedUser] = useState("");
	const [userOptions, setUserOptions] = useState<
		{ value: string; label: string }[]
	>([]);

	const filteredData = useRef({
		engineType: "",
		engineId: "",
		selectedUser: "",
		customDateRange: { from: new Date(), to: new Date() },
		SelectedDuration:
			DASHBOARD_DURATIONS[0] as (typeof DASHBOARD_DURATIONS)[number],
	});

	// Keep search state in a ref so fetchLogs always reads the latest values
	const searchRef = useRef<{
		tokens: SearchToken[];
		freeText: string;
	}>({
		tokens: [],
		freeText: "",
	});

	// Sync ref whenever state changes
	useEffect(() => {
		searchRef.current = { tokens: searchTokens, freeText: searchFreeText };
	}, [searchTokens, searchFreeText]);

	useEffect(() => {
		document.documentElement.classList.add("dark");
	}, []);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", dark);
	}, [dark]);

	const toggleDark = () => setDark((d) => !d);

	useEffect(() => {
		console.log("Filters:", {
			engineType,
			engineId,
			dateFrom,
			dateTo,
			duration: durationValue,
		});
	}, [engineType, engineId, dateFrom, dateTo, durationValue]);

	const fetchLogs = useCallback(
		async (limit: number, offset: number) => {
			if (!insightId || !userId) return;
			setLoading(true);
			try {
				const now = new Date();
				const pad = (n: number) => String(n).padStart(2, "0");
				const dateTime =
					`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
					`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

				const {
					engineType: eType,
					engineId: eId,
					selectedUser: sUser,
					customDateRange,
					SelectedDuration,
				} = filteredData.current;

				const startDate = customDateRange.from
					? new Date(
							new Date(customDateRange.from).setUTCHours(
								0,
								0,
								0,
								0,
							),
						)
					: null;
				const endDate = customDateRange.to
					? new Date(
							new Date(customDateRange.to).setUTCHours(
								23,
								59,
								59,
								999,
							),
						)
					: null;

				const customPart =
					SelectedDuration.dateRangeType === "CUSTOM" &&
					startDate &&
					endDate
						? `,"startDate":"${startDate.toISOString()}","endDate":"${endDate.toISOString()}"`
						: "";

				// Build search payload from tokens + free text
				const searchPayload = buildSearchPayload(
					searchRef.current.tokens,
					searchRef.current.freeText,
				);

				let searchPart = "";
				if (searchPayload) {
					if (searchPayload.search) {
						searchPart += `,"search":${JSON.stringify(searchPayload.search)}`;
					}
					if (searchPayload.others) {
						searchPart += `,"others":"${searchPayload.others}"`;
					}
				}

				const pixel =
					`AuditLogReport(paramValues=[{` +
					`"filterUserId":"${sUser}",` +
					`"projectId":"${eType === "APP" ? eId : ""}",` +
					`"engineId":"${eType === "APP" ? "" : eId}",` +
					`"dateTime":"${dateTime}",` +
					`"limit":"${limit}",` +
					`"offset":"${offset}",` +
					`"dateRangeType":"${SelectedDuration.dateRangeType || "DAY"}",` +
					`"dateRangeValue":${SelectedDuration.dateRangeValue}` +
					`${customPart}${searchPart}}]);`;

				const response = await runPixel(pixel, insightId);
				const data = response.pixelReturn[0].output;

				let logsArray: AuditLog[] = [];
				let count = 0;

				if (Array.isArray(data)) {
					logsArray = data as AuditLog[];
					count = data.length;
				} else if (
					data &&
					typeof data === "object" &&
					"logs" in data &&
					Array.isArray(data.logs)
				) {
					logsArray = data.logs as AuditLog[];
					count =
						("totalCount" in data
							? (data as { totalCount: number }).totalCount
							: null) ?? data.logs.length;
				}

				setLogs(logsArray);
				setTotalCount(count);
				setSelected(logsArray[0] ?? null);

				// Extract unique userIds for the User dropdown
				const uniqueUsers = Array.from(
					new Set(logsArray.map((l) => l.userId).filter(Boolean)),
				).map((id) => ({ value: id, label: id }));
				setUserOptions(uniqueUsers);
			} catch (err) {
				console.error("Error fetching audit logs:", err);
				setLogs([]);
				setSelected(null);
			} finally {
				setLoading(false);
			}
		},
		[insightId, userId],
	);

	useEffect(() => {
		fetchLogs(ROWS_PER_PAGE, page * ROWS_PER_PAGE);
	}, [page, fetchLogs]);

	const fetchEngineDetails = useCallback(
		async (type: string) => {
			if (!insightId || !type) return;
			try {
				const updated: EngineDetails = { ...INITIAL_ENGINE_DETAILS };

				if (type === "APP") {
					const resp = await runPixel(`MyProjects();`, insightId);
					const data = resp.pixelReturn[0].output as Array<{
						project_id: string;
						project_name: string;
					}>;
					updated.APP = data.map((p) => ({
						value: p.project_id,
						label: p.project_name,
					}));
				} else {
					const resp = await runPixel(`MyEngines();`, insightId);
					const data = resp.pixelReturn[0].output as Array<{
						database_id: string;
						app_type: string;
						app_name: string;
					}>;
					data.forEach((engine) => {
						if (Object.hasOwn(updated, engine.app_type)) {
							updated[engine.app_type] = [
								...updated[engine.app_type],
								{
									value: engine.database_id,
									label: engine.app_name,
								},
							];
						}
					});
				}
				setEngineDetails((prev) => ({ ...prev, ...updated }));
			} catch (err) {
				console.error("Error fetching engine details:", err);
			}
		},
		[insightId],
	);

	const handleEngineTypeChange = (type: string) => {
		setEngType(type);
		setEngId("");
		setSelectedUser("");
		setUserOptions([]);
		setChartPage(0);
		filteredData.current.engineType = type;
		filteredData.current.engineId = "";
		filteredData.current.selectedUser = "";
		if (type) fetchEngineDetails(type);
		setPage(0);
		fetchLogs(ROWS_PER_PAGE, 0);
	};

	const handleEngineChange = (id: string) => {
		setEngId(id);
		setChartPage(0);
		filteredData.current.engineId = id;
		setPage(0);
		fetchLogs(ROWS_PER_PAGE, 0);
	};

	const handleDateChange = (from: string, to: string, preset?: string) => {
		setDateFrom(from);
		setDateTo(to);
		setChartPage(0);
		const duration =
			DASHBOARD_DURATIONS.find((d) => d.value === preset) ??
			DASHBOARD_DURATIONS[0];
		setDurationValue(duration.value);
		filteredData.current.customDateRange = {
			from: from ? new Date(from) : new Date(),
			to: to ? new Date(to) : new Date(),
		};
		filteredData.current.SelectedDuration = duration;
		setPage(0);
		fetchLogs(ROWS_PER_PAGE, 0);
	};

	const handleUserChange = (uid: string) => {
		setSelectedUser(uid);
		setChartPage(0);
		filteredData.current.selectedUser = uid;
		setPage(0);
		fetchLogs(ROWS_PER_PAGE, 0);
	};

	const engineNames = useMemo(
		() => (engineType ? (engineDetails[engineType] ?? []) : []),
		[engineType, engineDetails],
	);

	const hasFilters = !!(engineType || engineId);

	const avgLat =
		Array.isArray(logs) && logs.length > 0
			? (logs.reduce((s, l) => s + l.latency, 0) / logs.length).toFixed(1)
			: "0";
	const successCount = logs.filter((l) => l.status).length;
	const failCount = logs.length - successCount;
	const successPct = logs.length
		? Math.round((successCount / logs.length) * 100)
		: 0;

	const totalPages = Math.ceil(totalCount / ROWS_PER_PAGE);

	// Server-side search: no client-side filtering, just use logs as-is
	const searchFiltered = logs;

	const sessions = useMemo(() => {
		const map = new Map<string, AuditLog[]>();
		searchFiltered.forEach((l) => {
			const arr = map.get(l.sessionId) ?? [];
			arr.push(l);
			map.set(l.sessionId, arr);
		});
		return Array.from(map.entries());
	}, [searchFiltered]);

	console.log(logs, "logs");
	return (
		<div className="min-h-screen lg:h-screen flex flex-col bg-background overflow-auto lg:overflow-hidden">
			{/* ── Top Bar ── */}
			<div className="flex-shrink-0 border-b border-border bg-card">
				<div className="max-w-[1600px] mx-auto px-4 flex items-center justify-between h-10">
					<div className="flex items-center gap-2 text-xs">
						<span className="text-foreground font-medium">
							Audit Logs
						</span>
						{loading && (
							<Loader2
								size={11}
								className="text-muted-foreground animate-spin"
							/>
						)}
					</div>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1.5 px-2 py-1 rounded border border-border bg-secondary">
							<Radio size={10} className="text-success" />
							<span className="text-[10px] text-muted-foreground">
								Live
							</span>
						</div>
						<Button
							onClick={toggleDark}
							className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-[10px] cursor-pointer hover:text-primary"
							variant="ghost"
						>
							{dark ? (
								<>
									<Sun size={11} />
									Light
								</>
							) : (
								<>
									<Moon size={11} />
									Dark
								</>
							)}
						</Button>
					</div>
				</div>
				<div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-40" />
			</div>

			{/* ── Main Content ── */}
			<div className="flex-1 min-h-0 max-w-[1600px] mx-auto w-full px-4 py-2 flex flex-col gap-2">
				<FiltersRow
					totalCount={totalCount}
					successPct={successPct}
					failCount={failCount}
					avgLat={avgLat}
					engineType={engineType}
					engineId={engineId}
					engineNames={engineNames}
					hasFilters={hasFilters}
					dateFrom={dateFrom}
					dateTo={dateTo}
					userOptions={userOptions}
					selectedUser={selectedUser}
					onEngineTypeChange={handleEngineTypeChange}
					onEngineChange={handleEngineChange}
					onDateChange={handleDateChange}
					onUserChange={handleUserChange}
				/>

				{/* Row 2: Chart (65%) + Event History (35%) */}
				<div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-2">
					{/* Right: Event History + pagination — first on small screens */}
					<div className="order-1 lg:order-2">
						<EventHistory
							loading={loading}
							logs={logs}
							searchFiltered={searchFiltered}
							sessions={sessions}
							totalCount={totalCount}
							totalPages={totalPages}
							selected={selected}
							hoveredIdx={hoveredIdx}
							searchTokens={searchTokens}
							searchFreeText={searchFreeText}
							page={page}
							onSelectLog={setSelected}
							onHoverLog={setHoveredIdx}
							onTokensChange={setSearchTokens}
							onFreeTextChange={setSearchFreeText}
							onSearch={(tokens, freeText) => {
								setSearchTokens(tokens);
								setSearchFreeText(freeText);
								searchRef.current = { tokens, freeText };
								setPage(0);
								fetchLogs(ROWS_PER_PAGE, 0);
							}}
							onPageChange={setPage}
						/>
					</div>
					{/* Left: Chart + Detail panel — second on small screens */}
					<div className="order-2 lg:order-1">
						<ChartPanel
							logs={logs}
							loading={loading}
							dark={dark}
							selected={selected}
							chartTab={chartTab}
							chartPage={chartPage}
							onSelectLog={setSelected}
							onSetChartTab={setChartTab}
							onSetChartPage={setChartPage}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AuditLogPage;
