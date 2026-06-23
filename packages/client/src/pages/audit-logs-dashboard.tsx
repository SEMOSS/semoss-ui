// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { Download, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { download } from "@semoss/sdk";
import {
	AppCatalogAvatar,
	AuditLogFilter,
	type AuditLogFilterValue,
	type AuditLogScope,
	AuditLogsDataTable,
	AuditLogsSummary,
	AuditLogsTimeline,
	buildAuditLogReportPixel,
	buildExportAuditLogReportPixel,
	EngineSubtypeIcon,
	EntityHeader,
	type EventData,
	filterValueToReportParams,
	hasScope,
} from "@semoss/shared";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Skeleton,
	toast,
} from "@semoss/ui/next";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useRootStore } from "@/hooks";

interface AuditLogsDashboardProps {
	catalogName: string;
	/**
	 * When rendered inside the app/engine detail tabs (not as a standalone page),
	 * skip the page navbar, the full-page padding side effect, and the entity
	 * header — the surrounding layout already provides those.
	 */
	embedded?: boolean;
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
	embedded = false,
}: AuditLogsDashboardProps) => {
	const { configStore, monolithStore } = useRootStore();
	const { appId, engineId } = useParams();
	const [logs, setLogs] = useState<EventData[]>([]);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(50);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState<boolean>(false);
	const [contextEntityDetails, setContextEntityDetails] =
		useState<ContextEntity | null>(null);
	const filteredData = useRef<AuditLogFilterValue>({
		scope: null,
		dateRangeType: "DAY",
		dateRangeValue: 1,
		customDateRange: { from: null, to: null },
		methodNames: [],
		engineTypes: [],
		filterUserId: "",
		roomId: "",
		searchTerm: "",
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
	//Scope passed to the filter for contextual dashboards (route-derived). For the
	//global "Apps" dashboard this is null and the filter renders its own pickers.
	const routeScope = useMemo<AuditLogScope | null>(() => {
		if (appId) return { projectId: appId };
		if (engineId) return { engineId };
		return null;
	}, [appId, engineId]);

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
	 * Fetches the audit logs from the API using the current filter state.
	 */
	const fetchLogs = async (limit: number, offset: number) => {
		const filterValue = filteredData.current;
		if (!hasScope(filterValue.scope)) {
			setLogs([]);
			setTotalCount(0);
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const params = filterValueToReportParams(filterValue);
			const response = await monolithStore.runQuery(
				buildAuditLogReportPixel(params, limit, offset),
			);
			const { operationType, output } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1)
				throw new Error(`API Error: ${output}`);

			const responseData = output as unknown as {
				logs?: EventData[];
				totalCount?: number;
			};
			setLogs(
				responseData?.logs ?? (output as unknown as EventData[]) ?? [],
			);
			setTotalCount(
				responseData?.totalCount ??
					(output as unknown as EventData[])?.length ??
					0,
			);
		} catch (error) {
			setLogs([]);
			setTotalCount(0);
			toast.error(`Error fetching logs: ${error}`);
			console.error("Error fetching logs:", error);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Exports the current filtered report as CSV or PDF.
	 */
	const handleExport = async (pdf: boolean) => {
		const filterValue = filteredData.current;
		if (!hasScope(filterValue.scope)) {
			toast.info("Select a scope before exporting logs.");
			return;
		}
		try {
			const params = filterValueToReportParams(filterValue);
			const exportLimit = totalCount > 0 ? totalCount : rowsPerPage;
			const response = await monolithStore.runQuery(
				buildExportAuditLogReportPixel(params, exportLimit, 0, pdf),
			);
			const { operationType, output } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1)
				throw new Error(`API Error: ${output}`);
			await download(
				configStore.store.insightID,
				output as unknown as string,
			);
		} catch (error) {
			toast.error(`Error exporting logs: ${error}`);
			console.error("Error exporting logs:", error);
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

	//Override the parent Page container styles for the dashboard layout. Skipped
	//when embedded in a tab, where the surrounding layout owns the container.
	useEffect(() => {
		if (embedded) return;
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
	 * Updates the filtered data state (emitted by the filter) and refetches from
	 * the first page.
	 */
	const updateLogs = (filterValue: AuditLogFilterValue) => {
		filteredData.current = filterValue;
		setPage(0);
		fetchLogs(rowsPerPage, 0);
	};

	//Compact header actions (Export + Refresh). The filter set lives in its own
	//full-width row below so it can wrap instead of overlapping the header.
	const headerActions = (
		<div className="flex flex-row items-center gap-2">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="icon-sm" title="Export">
						<Download className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem onClick={() => handleExport(false)}>
						Export as CSV
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => handleExport(true)}>
						Export as PDF
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<Button
				variant="outline"
				size="icon-sm"
				title="Refresh"
				onClick={() => fetchLogs(rowsPerPage, page * rowsPerPage)}
			>
				<RefreshCw className="size-4" />
			</Button>
		</div>
	);

	const filterBar = (
		<div className="flex w-full flex-wrap items-center gap-2">
			<AuditLogFilter
				updateLogs={updateLogs}
				insightId={configStore.store.insightID}
				parent={isContextualDashboard ? "client" : null}
				scope={routeScope}
				actions={headerActions}
			/>
		</div>
	);

	const body = loading ? (
		<div className="flex flex-col gap-4">
			<Skeleton className="h-[400px] w-full" />
			<Skeleton className="h-[400px] w-full" />
		</div>
	) : (
		<>
			<AuditLogsSummary logs={logs} totalCount={totalCount} />
			<AuditLogsTimeline logs={logs} />
			<AuditLogsDataTable
				logs={logs}
				totalCount={totalCount}
				page={page}
				rowsPerPage={rowsPerPage}
				onPaginationChange={handlePaginationChange}
			/>
		</>
	);

	//Embedded in a settings tab: filters (with search + export/refresh inline) + body.
	if (embedded) {
		return (
			<div className="flex flex-col gap-4">
				{filterBar}
				{body}
			</div>
		);
	}

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
						/>
						{filterBar}
					</div>
				) : (
					<div className="flex w-full flex-col gap-4 py-2">
						<h6 className="font-semibold text-xl">
							{catalogName} Insight Dashboard
						</h6>
						{filterBar}
					</div>
				)}
				{body}
			</div>
		</>
	);
};
