// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
	AppCatalogAvatar,
	AuditLogFilter,
	AuditLogsDataTable,
	AuditLogsTimeline,
	EngineSubtypeIcon,
	EntityHeader,
	type EventData,
} from "@semoss/shared";
import { Button, Skeleton, toast } from "@semoss/ui/next";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useRootStore } from "@/hooks";

interface AuditLogsDashboardProps {
	catalogName: string;
}

interface AuditLogsFilterData {
	engineType: string;
	engineId: string;
	duration: string;
	customDateRange: {
		from: Date | null;
		to: Date | null;
	};
	SelectedDuration: {
		label: string;
		value: string;
		dateRangeType: string;
		dateRangeValue: number;
	};
}

interface AppMetadataResponse {
	project_display_name?: string;
	project_name?: string;
}

interface EngineMetadataResponse {
	engine_display_name?: string;
	engine_name?: string;
	engine_type?: string;
	engine_subtype?: string;
}

type ContextEntity =
	| {
			kind: "app";
			id: string;
			name: string;
	  }
	| {
			kind: "engine";
			id: string;
			name: string;
			engineType: string;
			engineSubtype?: string;
	  };

/**
 * A component for displaying the audit logs dashboard for a given catalog.
 *
 * @param {string} catalogName - The name of the catalog.
 * @returns {JSX.Element} - A JSX element containing the audit logs dashboard.
 */
export const AuditLogsDashboard = ({
	catalogName,
}: AuditLogsDashboardProps) => {
	const { configStore, monolithStore } = useRootStore();
	const { appId, engineId } = useParams();
	const [logs, setLogs] = useState<EventData[]>([]);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(50);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState<boolean>(true);
	const [contextEntityDetails, setContextEntityDetails] =
		useState<ContextEntity | null>(null);
	const hasSkippedInitialFilterFetchRef = useRef(false);
	const filteredData = useRef<AuditLogsFilterData>({
		engineType: "",
		engineId: "",
		duration: "",
		customDateRange: { from: null, to: null },
		SelectedDuration: {
			label: "",
			value: "",
			dateRangeType: "",
			dateRangeValue: 1,
		},
	});
	const routeContextEntity = useMemo<ContextEntity | null>(() => {
		if (appId) {
			return {
				kind: "app",
				id: appId,
				name: "App",
			};
		}

		if (engineId) {
			return {
				kind: "engine",
				id: engineId,
				name: catalogName,
				engineType: catalogName.toUpperCase(),
			};
		}

		return null;
	}, [appId, engineId, catalogName]);
	const contextEntity = contextEntityDetails || routeContextEntity;
	const isContextualDashboard = Boolean(routeContextEntity);

	useEffect(() => {
		let cancelled = false;

		const fetchContextEntity = async () => {
			if (appId) {
				try {
					const appResponse = await monolithStore.runQuery(
						`GetProjectMetadata(project="${appId}", metaKeys=${JSON.stringify([["project_display_name", "project_name"]])})`,
					);
					const { operationType, output } =
						appResponse.pixelReturn[0];
					if (operationType.indexOf("ERROR") > -1) {
						if (!cancelled) setContextEntityDetails(null);
						return;
					}

					const appMetadata = output as AppMetadataResponse;
					if (!cancelled) {
						setContextEntityDetails({
							kind: "app",
							id: appId,
							name:
								appMetadata.project_display_name ||
								appMetadata.project_name ||
								"App",
						});
					}
				} catch (error) {
					if (!cancelled) setContextEntityDetails(null);
					console.error("Error fetching app metadata:", error);
				}
				return;
			}

			if (engineId) {
				try {
					const engineResponse = await monolithStore.runQuery(
						`GetEngineMetadata(engine=["${engineId}"], metaKeys=${JSON.stringify([["engine_display_name", "engine_name", "engine_type", "engine_subtype"]])});`,
					);
					const { operationType, output } =
						engineResponse.pixelReturn[0];
					if (operationType.indexOf("ERROR") > -1) {
						if (!cancelled) setContextEntityDetails(null);
						return;
					}

					const engineMetadata = output as EngineMetadataResponse;
					if (!cancelled) {
						setContextEntityDetails({
							kind: "engine",
							id: engineId,
							name:
								engineMetadata.engine_display_name ||
								engineMetadata.engine_name ||
								catalogName,
							engineType:
								engineMetadata.engine_type ||
								catalogName.toUpperCase(),
							engineSubtype: engineMetadata.engine_subtype,
						});
					}
				} catch (error) {
					if (!cancelled) setContextEntityDetails(null);
					console.error("Error fetching engine metadata:", error);
				}
				return;
			}

			setContextEntityDetails(null);
		};

		fetchContextEntity();

		return () => {
			cancelled = true;
		};
	}, [appId, engineId, monolithStore, catalogName]);

	/**
	 * Fetches the audit logs from the API.
	 */
	const fetchLogs = async (limit: number, offset: number) => {
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
			const routeCatalogId = appId || engineId || "";
			const catalogId = routeCatalogId || filteredData.current.engineId;
			const SelectedDuration = filteredData.current.SelectedDuration;
			const selectedEngineType =
				filteredData.current.engineType.toUpperCase();
			const useProjectId =
				Boolean(appId) ||
				(!engineId &&
					(selectedEngineType === "APP" || catalogName === "Apps"));
			const catalogIdKey = useProjectId ? "projectId" : "engineId";

			if (!catalogId) {
				setLogs([]);
				setTotalCount(0);
				return;
			}

			const customStartDate = filteredData.current.customDateRange.from;
			const customEndDate = filteredData.current.customDateRange.to;
			const hasCustomDateRange =
				SelectedDuration.dateRangeType === "CUSTOM" &&
				customStartDate &&
				customEndDate;
			let customDateRangeParams = "";

			if (hasCustomDateRange) {
				const startDate = new Date(customStartDate);
				const endDate = new Date(customEndDate);

				startDate.setUTCHours(0, 0, 0, 0);
				endDate.setUTCHours(23, 59, 59, 999);

				customDateRangeParams = `,"startDate": "${startDate.toISOString()}", "endDate": "${endDate.toISOString()}"`;
			}

			const response = await monolithStore.runQuery(
				`AuditLogReport(paramValues=[{"userId": "${configStore.store.user.id}", "${catalogIdKey}": "${catalogId}","dateTime":"${dateTime}","limit":"${limit}","offset":"${offset}", "dateRangeType": "${SelectedDuration.dateRangeType || "DAY"}","dateRangeValue": ${SelectedDuration.dateRangeValue}${customDateRangeParams}}]);`,
			);
			const { operationType } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1)
				throw new Error(`API Error: ${response.pixelReturn[0].output}`);

			const responseData = response.pixelReturn[0].output;
			setLogs(
				(
					responseData as unknown as {
						logs: EventData[];
						totalCount: number;
					}
				)?.logs ||
					(responseData as unknown as EventData[]) ||
					[],
			);
			setTotalCount(
				(responseData as unknown as { totalCount: number })
					?.totalCount ||
					(responseData as unknown as EventData[])?.length ||
					0,
			);
		} catch (error) {
			setLogs([]);
			toast.error(`Error fetching logs: ${error}`);
			console.error("Error fetching logs:", error);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Handles pagination change.
	 */
	const handlePaginationChange = (
		newPage: number,
		newRowsPerPage: number,
	) => {
		const offset = newPage * newRowsPerPage;
		setPage(newPage);
		setRowsPerPage(newRowsPerPage);
		fetchLogs(newRowsPerPage, offset);
	};

	useEffect(() => {
		if (catalogName) {
			setLogs([]);
			fetchLogs(rowsPerPage, page * rowsPerPage);
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
	}, [catalogName, appId, engineId]);

	/**
	 * Updates the filtered data state and refetches logs.
	 */
	const updateLogs = (filterData: AuditLogsFilterData) => {
		filteredData.current = {
			...filterData,
		};
		if (isContextualDashboard && !hasSkippedInitialFilterFetchRef.current) {
			hasSkippedInitialFilterFetchRef.current = true;
			return;
		}
		fetchLogs(rowsPerPage, page * rowsPerPage);
	};

	const dashboardControls = (
		<div className="flex flex-row items-center gap-4">
			<AuditLogFilter
				updateLogs={updateLogs}
				insightId={configStore.store.insightID}
				parent={isContextualDashboard ? "client" : null}
			/>
			<Button onClick={() => fetchLogs(rowsPerPage, page * rowsPerPage)}>
				<RefreshCw className="mr-2 size-4" />
				Refresh
			</Button>
		</div>
	);

	return (
		<>
			{catalogName === "Apps" && (
				<NavbarLeft>
					<NavbarHeader />
				</NavbarLeft>
			)}
			<div className="flex flex-col gap-4">
				{contextEntity ? (
					<div className="flex w-full flex-col gap-4 py-2">
						<h6 className="font-semibold text-xl">
							{catalogName} Insight Dashboard
						</h6>
						<EntityHeader
							icon={
								contextEntity.kind === "app" ? (
									<AppCatalogAvatar
										name={contextEntity.name || "App"}
										className="h-full w-full rounded-lg text-xl"
									/>
								) : (
									<EngineSubtypeIcon
										engineType={contextEntity.engineType}
										engineSubtype={
											contextEntity.engineSubtype
										}
										alt={contextEntity.name}
										className="size-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
									/>
								)
							}
							name={contextEntity.name}
							id={contextEntity.id}
							size="compact"
							copyLabel={
								contextEntity.kind === "app"
									? "Copy App ID"
									: "Copy Engine ID"
							}
							actions={dashboardControls}
						/>
					</div>
				) : (
					<div className="flex w-full items-center py-2">
						<h6 className="font-semibold text-xl">
							{catalogName} Insight Dashboard
						</h6>
						<div className="ml-auto">{dashboardControls}</div>
					</div>
				)}
				{loading ? (
					<div className="flex flex-col gap-4">
						<Skeleton className="h-[400px] w-full" />
						<Skeleton className="h-[400px] w-full" />
					</div>
				) : (
					<>
						<AuditLogsTimeline logs={logs} />
						<AuditLogsDataTable
							logs={logs}
							totalCount={totalCount}
							page={page}
							rowsPerPage={rowsPerPage}
							onPaginationChange={handlePaginationChange}
						/>
					</>
				)}
			</div>
		</>
	);
};
