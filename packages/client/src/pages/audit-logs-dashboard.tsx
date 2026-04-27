import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
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
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@semoss/ui/next";
import { getUserEnginePermission } from "@/api/engines";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useRootStore } from "@/hooks";

const ROWS_PER_PAGE = 10;

const ENGINE_TYPES = [
	"APP",
	"MODEL",
	"DATABASE",
	"VECTOR",
	"FUNCTION",
	"STORAGE",
	"GUARDRAIL",
];

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
 * @param {string | number | null } timeStamp - The timestamp to be formatted.
 * @returns {{date: string, time: string}} - An object containing the date and time strings.
 * */
export const TimeDateFormatter = (timeStamp: string | number | null) => {
	if (!timeStamp) {
		return { date: "", time: "" };
	}

	try {
		const tempDate = new Date(timeStamp);

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
			return { date: "", time: "" };
		}
	} catch (_dateError) {
		return { date: "", time: "" };
	}
};

export const AuditLogsDashboard = ({
	catalogName,
}: {
	catalogName: string;
}) => {
	const { monolithStore } = useRootStore();
	const location = useLocation();
	const params = useParams<{ appId?: string; engineId?: string }>();
	const catalogId = catalogName === "Apps" ? params.appId : params.engineId;
	const routeDisplayName =
		(location.state as { displayName?: string } | null)?.displayName ?? "";
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

	const searchRef = useRef<{
		tokens: SearchToken[];
		freeText: string;
	}>({
		tokens: [],
		freeText: "",
	});

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
					if (searchPayload.roomId) {
						searchPart += `,"roomId":"${searchPayload.roomId}"`;
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
		[catalogId, catalogName, monolithStore],
	);

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

	const fetchCategoryOptions = useCallback(
		async (
			category: SearchCategory,
			offset: number,
			limit: number,
			searchText?: string,
		): Promise<string[]> => {
			try {
				const { selectedUser: sUser } = filteredData.current;
				const tokens = searchRef.current.tokens;

				const params: Record<string, string> = {
					filterUserId: sUser,
					engineId: catalogId || "",
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
				const response = await monolithStore.runQuery(pixel);
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
		[catalogId, monolithStore],
	);

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

	useEffect(() => {
		searchRef.current = { tokens: searchTokens, freeText: searchFreeText };
	}, [searchTokens, searchFreeText]);

	useEffect(() => {
		if (catalogName) {
			fetchLogs(ROWS_PER_PAGE, page * ROWS_PER_PAGE);
		}
		const contentElement = document.querySelector(
			'[data-home-container="true"]',
		) as HTMLElement | null;
		if (contentElement) {
			contentElement.style.padding = "25px";
			contentElement.style.paddingTop = "10px";
			contentElement.style.maxWidth = "none";
		}

		return () => {
			if (contentElement) {
				contentElement.style.padding = "";
				contentElement.style.maxWidth = "";
			}
		};
	}, [catalogName, page, fetchLogs]);

	useEffect(() => {
		if (catalogId) {
			fetchUserList(catalogId, catalogName === "Apps");
		}
	}, [catalogId, catalogName, fetchUserList]);

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

	const catalogDisplayName = routeDisplayName || catalogId || "";

	const engineNames = catalogId
		? [{ value: catalogId, label: catalogDisplayName || catalogName }]
		: [];

	const backPath =
		catalogName === "Apps"
			? "/app"
			: `/engine/${catalogName.toLowerCase()}`;

	return (
		<>
			{catalogName === "Apps" && (
				<NavbarLeft>
					<NavbarHeader />
				</NavbarLeft>
			)}
			<div>
				<Breadcrumb className="ml-2">
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to={backPath}>
									{catalogName === "Apps"
										? "App"
										: catalogName}
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>
								{catalogDisplayName || catalogId}
							</BreadcrumbPage>
						</BreadcrumbItem>
						{engineNames.length > 0 && (
							<>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbPage>Audit Logs</BreadcrumbPage>
								</BreadcrumbItem>
							</>
						)}
					</BreadcrumbList>
				</Breadcrumb>

				<div className="m-2 flex min-h-0 w-full flex-1 flex-col gap-2">
					<FilterRow
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

					<div className="grid flex-1 grid-cols-1 gap-2 lg:grid-cols-[65fr_35fr]">
						<div className="order-1 lg:order-1">
							<ChartPanel
								logs={logs}
								loading={loading}
								selected={selected}
								chartTab={chartTab}
								chartPage={chartPage}
								onSelectLog={setSelected}
								onSetChartTab={setChartTab}
								onSetChartPage={setChartPage}
							/>
						</div>
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
					</div>
				</div>
			</div>
		</>
	);
};
