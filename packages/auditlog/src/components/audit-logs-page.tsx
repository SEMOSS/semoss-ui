import { Loader2, Moon, Radio, Sun } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { Env, get, useInsight } from "@semoss/sdk/react";
import {
	type AuditLog,
	buildSearchPayload,
	ChartPanel,
	EventHistory,
	FilterRow,
	getUserProjectPermission,
	type SearchCategory,
	type SearchToken,
} from "@semoss/shared";
import { Button } from "@semoss/ui/next";
import { useUserRootStore } from "@/hooks/useUserRootStore";

type EngineOption = { value: string; label: string };
type EngineDetails = Record<string, EngineOption[]>;

const ROWS_PER_PAGE = 10;

const getUserEnginePermission = async (engineId: string): Promise<string> => {
	const response = await get<{ permission: string }>(
		`${Env.MODULE}/api/auth/engine/getUserEnginePermission?engineId=${engineId}`,
	);
	if (!response) {
		throw Error("No Response to get engine permission");
	}
	return response.data.permission;
};

const ENGINE_TYPES = [
	"APP",
	"MODEL",
	"DATABASE",
	"VECTOR",
	"FUNCTION",
	"STORAGE",
	"GUARDRAIL",
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
	const [isOwner, setIsOwner] = useState(false);

	const filteredData = useRef({
		engineType: "",
		engineId: "",
		selectedUser: "",
		customDateRange: { from: new Date(), to: new Date() },
		SelectedDuration:
			DASHBOARD_DURATIONS[0] as (typeof DASHBOARD_DURATIONS)[number],
	});

	const searchRef = useRef<{
		tokens: SearchToken[];
		freeText: string;
	}>({
		tokens: [],
		freeText: "",
	});

	const toggleDark = () => setDark((d) => !d);

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

				const searchPayload = buildSearchPayload(
					searchRef.current.tokens,
					searchRef.current.freeText,
				);

				if (searchPayload?.search?.engineType) {
					searchPayload.search.engineType =
						searchPayload.search.engineType.map((v) =>
							v === "APP" ? "PROJECT" : v,
						);
				}

				let searchPart = "";
				if (searchPayload) {
					if (searchPayload.search) {
						searchPart += `,"search":${JSON.stringify(searchPayload.search)}`;
					}
					if (searchPayload.others) {
						searchPart += `,"others":"${searchPayload.others}"`;
					}
					if (searchPayload.roomId) {
						searchPart += `,"roomId":"${searchPayload.roomId}"`;
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

	const fetchUserList = useCallback(
		async (id: string, eType: string) => {
			if (!insightId || !id) {
				setUserOptions([]);
				setIsOwner(false);
				return;
			}
			try {
				const permission =
					eType === "APP"
						? await getUserProjectPermission(id)
						: await getUserEnginePermission(id);

				if (permission !== "OWNER") {
					setIsOwner(false);
					setUserOptions([]);
					return;
				}

				setIsOwner(true);

				const pixel = `GetAuditLogReportUsers(engine=["${id}"]);`;
				const resp = await runPixel(pixel, insightId);
				const data = resp.pixelReturn[0].output;
				if (Array.isArray(data)) {
					setUserOptions(
						data.map((u: { id: string; type: string }) => ({
							value: u.id,
							label: u.id,
						})),
					);
				} else {
					setUserOptions([]);
				}
			} catch (err) {
				console.error("Error fetching user list:", err);
				setIsOwner(false);
				setUserOptions([]);
			}
		},
		[insightId],
	);

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

	const fetchCategoryOptions = useCallback(
		async (
			category: SearchCategory,
			offset: number,
			limit: number,
			searchText?: string,
		): Promise<string[]> => {
			if (!insightId) return [];
			try {
				const { engineId: eId, selectedUser: sUser } =
					filteredData.current;

				const tokens = searchRef.current.tokens;

				const params: Record<string, string> = {
					filterUserId: sUser,
					engineId: eId,
					limit: String(limit),
					offset: String(offset),
				};

				for (const token of tokens) {
					if (
						token.category === "methodName" &&
						category !== "methodName"
					) {
						params.methodName = token.values.join(",");
					} else if (
						token.category === "requestMessage" &&
						category !== "requestMessage"
					) {
						params.request = token.values.join(",");
					} else if (
						token.category === "engineType" &&
						category !== "engineType"
					) {
						params.engineType = token.values
							.map((v) => (v === "APP" ? "PROJECT" : v))
							.join(",");
					}
				}

				if (searchText) {
					const categoryFieldMap: Record<string, string> = {
						methodName: "methodName",
						requestMessage: "request",
						engineType: "engineType",
						roomId: "roomId",
					};
					const field = categoryFieldMap[category];
					if (field) {
						params[field] = searchText;
					}
				}

				const paramStr = Object.entries(params)
					.map(([k, v]) => `"${k}":"${v}"`)
					.join(",");

				const pixel = `GetAuditLogReportFilterOptionList(paramValues=[{${paramStr}}]);`;
				const response = await runPixel(pixel, insightId);
				const data = response.pixelReturn[0].output;

				if (Array.isArray(data)) {
					const fieldMap: Record<string, string> = {
						methodName: "methodName",
						requestMessage: "request",
						engineType: "engineType",
						roomId: "roomId",
					};
					const field = fieldMap[category];
					const values = data
						.map((item: Record<string, string>) => {
							const raw = field ? item[field] : item;
							if (
								typeof raw === "string" &&
								category === "requestMessage"
							) {
								try {
									const parsed = JSON.parse(raw);
									if (
										parsed &&
										typeof parsed === "object" &&
										"arg0" in parsed
									) {
										return String(parsed.arg0);
									}
								} catch {
									// not JSON, return raw
								}
							}
							return raw;
						})
						.filter(
							(v: unknown): v is string =>
								typeof v === "string" && v.length > 0,
						);
					return [...new Set(values)];
				}
				return [];
			} catch (err) {
				console.error("Error fetching category options:", err);
				return [];
			}
		},
		[insightId],
	);

	const handleEngineChange = (id: string) => {
		setEngId(id);
		setChartPage(0);
		setSelectedUser("");
		filteredData.current.engineId = id;
		filteredData.current.selectedUser = "";
		setPage(0);
		fetchLogs(ROWS_PER_PAGE, 0);
		fetchUserList(id, filteredData.current.engineType);
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

	const handleRefresh = () => {
		setEngType("");
		setEngId("");
		setSelectedUser("");
		setUserOptions([]);
		setIsOwner(false);
		setDateFrom(todayStr);
		setDateTo(todayStr);
		setDurationValue("today");
		setChartPage(0);
		setSearchTokens([]);
		setSearchFreeText("");
		filteredData.current = {
			engineType: "",
			engineId: "",
			selectedUser: "",
			customDateRange: { from: new Date(), to: new Date() },
			SelectedDuration:
				DASHBOARD_DURATIONS[0] as (typeof DASHBOARD_DURATIONS)[number],
		};
		searchRef.current = { tokens: [], freeText: "" };
		setPage(0);
		fetchLogs(ROWS_PER_PAGE, 0);
	};

	useEffect(() => {
		searchRef.current = { tokens: searchTokens, freeText: searchFreeText };
	}, [searchTokens, searchFreeText]);

	useEffect(() => {
		document.documentElement.classList.add("dark");
	}, []);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", dark);
	}, [dark]);

	useEffect(() => {
		fetchLogs(ROWS_PER_PAGE, page * ROWS_PER_PAGE);
	}, [page, fetchLogs]);

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

	return (
		<div className="flex min-h-screen flex-col overflow-auto bg-background lg:h-screen">
			<div className="flex-shrink-0 border-border border-b bg-card">
				<div className="mx-auto flex h-10 max-w-[1600px] items-center justify-between px-4">
					<div className="flex items-center gap-2 text-xs">
						<span className="font-medium text-foreground">
							Audit Logs
						</span>
						{loading && (
							<Loader2
								size={11}
								className="animate-spin text-muted-foreground"
							/>
						)}
					</div>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1.5 rounded border border-border bg-secondary px-2 py-1">
							<Radio size={10} className="text-success" />
							<span className="text-[10px] text-muted-foreground">
								Live
							</span>
						</div>
						<Button
							onClick={toggleDark}
							className="flex cursor-pointer items-center gap-1.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground hover:text-primary"
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

			<div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-2 px-4 py-2">
				<FilterRow
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
					showUserFilter={isOwner}
					dateRangePreset={durationValue}
					onEngineTypeChange={handleEngineTypeChange}
					onEngineChange={handleEngineChange}
					onDateChange={handleDateChange}
					onUserChange={handleUserChange}
					onRefresh={handleRefresh}
				/>

				<div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-[65fr_35fr]">
					<div className="order-2 lg:order-2">
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
							categoryOptions={{
								engineType: ENGINE_TYPES,
							}}
							onFetchCategoryOptions={fetchCategoryOptions}
						/>
					</div>
					<div className="order-1 lg:order-1">
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
