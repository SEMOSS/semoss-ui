import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	type AuditLog,
	buildSearchPayload,
	ChartPanel,
	EventHistory,
	FiltersRow,
	getUserProjectPermission,
	type SearchToken,
} from "@semoss/shared";
import { getUserEnginePermission } from "@/api/engines";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useRootStore } from "@/hooks";

const ROWS_PER_PAGE = 10;

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

/**
 * A function to format a timestamp into a date and time string.
 * @param {string | number | null | undefined} timeStamp - The timestamp to be formatted.
 * @returns {{date: string, time: string}} - An object containing the date and time strings.
 * */
export const TimeDateFormatter = (
	timeStamp: string | number | null | undefined,
) => {
	if (!timeStamp) {
		return { date: "", time: "" };
	}

	try {
		const tempDate = new Date(timeStamp);

		// Check if date is invalid
		if (Number.isNaN(tempDate.getTime())) {
			return { date: "", time: "" };
		}

		const formattedDate = tempDate.toLocaleTimeString("en-US", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: true,
		});

		try {
			const [datePart, timePart] = formattedDate.split(", ");
			const date = datePart || "";
			const time = timePart ? timePart.split(" ")[0] : "";
			return { date, time };
		} catch (_formatError) {
			// Handle string parsing errors
			return { date: "", time: "" };
		}
	} catch (_dateError) {
		// Handle date creation errors
		return { date: "", time: "" };
	}
};
//event data object structure will have entire row details of auditlog table row
export interface EventData {
	startTime: string;
	endTime: string;
	logTimestamp: string;
	request: string;
	response: string;
	tokens: string | null;
	latency: number;
	status: string | null;
	engineName: string;
	engineType: string;
	userId: string;
	sessionId: string;
	spanId: string;
}

/**
 * A component for displaying the audit logs dashboard for a given catalog.
 *
 * @param {string} catalogName - The name of the catalog.
 * @returns {JSX.Element} - A JSX element containing the audit logs dashboard.
 */
export const AuditLogsDashboard = ({
	catalogName,
}: {
	catalogName: string;
}) => {
	const { monolithStore } = useRootStore();

	const [dark] = useState(false);
	const [chartTab, setChartTab] = useState<"bar" | "timeline">("timeline");
	const [chartPage, setChartPage] = useState(0);
	const [searchTokens, setSearchTokens] = useState<SearchToken[]>([]);
	const [searchFreeText, setSearchFreeText] = useState("");
	const [selected, setSelected] = useState<AuditLog | null>(null);
	const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

	const [logs, setLogs] = useState<AuditLog[]>([]);
	const [page, setPage] = useState(0);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState<boolean>(true);
	const [selectedUser, setSelectedUser] = useState("");
	const [userOptions, setUserOptions] = useState<
		{ value: string; label: string }[]
	>([]);
	const [isOwner, setIsOwner] = useState(false);

	const todayStr = new Date().toISOString().split("T")[0];
	const [dateFrom, setDateFrom] = useState(todayStr);
	const [dateTo, setDateTo] = useState(todayStr);
	const [durationValue, setDurationValue] = useState<DurationValue>("today");

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

	const fetchLogs = useCallback(
		async (limit: number, offset: number) => {
			setLoading(true);
			try {
				const date = new Date();
				const yyyy = date.getFullYear();
				const mm = String(date.getMonth() + 1).padStart(2, "0");
				const dd = String(date.getDate()).padStart(2, "0");
				const hh = String(date.getHours()).padStart(2, "0");
				const min = String(date.getMinutes()).padStart(2, "0");
				const ss = String(date.getSeconds()).padStart(2, "0");

				const dateTime = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
				const catalogId =
					window.location.hash.split("/")[
						catalogName === "Apps" ? 2 : 3
					];
				const SelectedDuration = filteredData.current.SelectedDuration;

				const startDate = filteredData.current?.customDateRange?.from
					? new Date(
							new Date(
								filteredData.current.customDateRange.from,
							).setUTCHours(0, 0, 0, 0),
						)
					: null;
				const endDate = filteredData.current?.customDateRange?.to
					? new Date(
							new Date(
								filteredData.current.customDateRange.to,
							).setUTCHours(23, 59, 59, 999),
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

				const response = await monolithStore.runQuery(
					`AuditLogReport(paramValues=[{"filterUserId": "${filteredData.current.selectedUser}", "${catalogName === "Apps" ? "projectId" : "engineId"}": "${catalogId}","dateTime":"${dateTime}","limit":"${limit}","offset":"${offset}","dateRangeType":"${SelectedDuration.dateRangeType || "DAY"}","dateRangeValue":${SelectedDuration.dateRangeValue}${customPart}${searchPart}}]);`,
				);
				const { operationType } = response.pixelReturn[0];
				if (operationType.indexOf("ERROR") > -1)
					throw new Error(
						`API Error: ${response.pixelReturn[0].output}`,
					);

				const responseData = response.pixelReturn[0].output;

				let logsArray: AuditLog[] = [];
				let count = 0;

				if (Array.isArray(responseData)) {
					logsArray = responseData as AuditLog[];
					count = responseData.length;
				} else if (
					responseData &&
					typeof responseData === "object" &&
					"logs" in responseData &&
					Array.isArray(responseData.logs)
				) {
					logsArray = responseData.logs as AuditLog[];
					count =
						("totalCount" in responseData
							? (
									responseData as {
										totalCount: number;
									}
								).totalCount
							: null) ?? responseData.logs.length;
				}

				setLogs(logsArray);
				setTotalCount(count);
				setSelected(logsArray[0] ?? null);
			} catch (error) {
				setLogs([]);
				setSelected(null);
				console.error("Error fetching logs:", error);
			} finally {
				setLoading(false);
			}
		},
		[catalogName, monolithStore],
	);

	useEffect(() => {
		if (catalogName) {
			fetchLogs(ROWS_PER_PAGE, page * ROWS_PER_PAGE);
		}
		const contentElement = document.querySelector(
			'[data-home-container="true"]',
		) as HTMLElement | null;
		if (contentElement) {
			contentElement.style.padding = "32px";
			contentElement.style.maxWidth = "none";
		}

		return () => {
			if (contentElement) {
				contentElement.style.padding = "";
				contentElement.style.maxWidth = "";
			}
		};
	}, [catalogName, page, fetchLogs]);

	const fetchUserList = useCallback(
		async (id: string, isApp: boolean) => {
			if (!id) {
				setUserOptions([]);
				setIsOwner(false);
				return;
			}
			try {
				let permission: string;
				if (isApp) {
					permission = await getUserProjectPermission(id);
				} else {
					const enginePerm = await getUserEnginePermission(id);
					permission = enginePerm.permission;
				}

				if (permission !== "OWNER") {
					setIsOwner(false);
					setUserOptions([]);
					return;
				}

				setIsOwner(true);

				const resp = await monolithStore.runQuery(
					`GetAuditLogReportUsers(engine=["${id}"]);`,
				);
				const data = resp.pixelReturn[0].output;
				if (Array.isArray(data)) {
					setUserOptions(
						data.map((u: { id: string }) => ({
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
		[monolithStore],
	);

	// Fetch user list on mount when catalogId is available
	useEffect(() => {
		const id =
			window.location.hash.split("/")[catalogName === "Apps" ? 2 : 3];
		if (id) {
			fetchUserList(id, catalogName === "Apps");
		}
	}, [catalogName, fetchUserList]);

	const handleUserChange = (uid: string) => {
		setSelectedUser(uid);
		setChartPage(0);
		filteredData.current.selectedUser = uid;
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

	const handleRefresh = () => {
		setDateFrom(todayStr);
		setDateTo(todayStr);
		setDurationValue("today");
		setChartPage(0);
		setSearchTokens([]);
		setSearchFreeText("");
		setSelectedUser("");
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

	// The catalogId is used as the engine/project name for FiltersRow display
	const catalogId =
		window.location.hash.split("/")[catalogName === "Apps" ? 2 : 3];
	const engineNames = catalogId
		? [{ value: catalogId, label: catalogName }]
		: [];

	return (
		<>
			{catalogName === "Apps" && (
				<NavbarLeft>
					<NavbarHeader />
				</NavbarLeft>
			)}
			<div className="flex w-full flex-col overflow-auto bg-background p-4">
				{/* Main Content */}
				<div className="flex min-h-0 w-full flex-1 flex-col gap-2">
					<FiltersRow
						totalCount={totalCount}
						successPct={successPct}
						failCount={failCount}
						avgLat={avgLat}
						engineType={catalogName === "Apps" ? "APP" : ""}
						engineId={catalogId || ""}
						engineNames={engineNames}
						hasFilters={!!catalogId}
						dateFrom={dateFrom}
						dateTo={dateTo}
						dateRangePreset={durationValue}
						userOptions={userOptions}
						selectedUser={selectedUser}
						showUserFilter={isOwner}
						showEngineFilter={false}
						onEngineTypeChange={() => {}}
						onEngineChange={() => {}}
						onDateChange={handleDateChange}
						onUserChange={handleUserChange}
						onRefresh={handleRefresh}
					/>

					{/* Row 2: Chart (65%) + Event History (35%) */}
					<div className="grid flex-1 grid-cols-1 gap-2 lg:grid-cols-[65fr_35fr]">
						{/* Left: Chart + Detail panel */}
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
						{/* Right: Event History + pagination */}
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
							/>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};
