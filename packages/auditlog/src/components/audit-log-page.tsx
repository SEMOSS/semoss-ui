import { Download, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { download, runPixel } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import {
	AuditLogFilter,
	type AuditLogFilterValue,
	AuditLogsDataTable,
	AuditLogsSummary,
	AuditLogsTimeline,
	buildAuditLogReportPixel,
	buildExportAuditLogReportPixel,
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

/**
 * This component displays the audit logs.
 *
 * @param {string} catalogName - The name of the catalog.
 */

export const AuditLogPage = ({ catalogName }) => {
	const { insightId } = useInsight(); // fetching insight id for access
	const [logs, setLogs] = useState<EventData[]>([]);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(50);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState<boolean>(false);
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

	/**
	 * Fetches audit logs from the API using the current filter state.
	 *
	 * @param {number} limit - The limit of the logs to fetch.
	 * @param {number} offset - The offset of the logs to fetch.
	 */
	const fetchLogs = async (limit: number, offset: number) => {
		const filterValue = filteredData.current;
		if (!hasScope(filterValue.scope) || !insightId) {
			setLogs([]);
			setTotalCount(0);
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const params = filterValueToReportParams(filterValue);
			const response = await runPixel(
				buildAuditLogReportPixel(params, limit, offset),
				insightId,
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
		if (!hasScope(filterValue.scope) || !insightId) {
			toast.info("Select an engine before exporting logs.");
			return;
		}
		try {
			const params = filterValueToReportParams(filterValue);
			const exportLimit = totalCount > 0 ? totalCount : rowsPerPage;
			const response = await runPixel(
				buildExportAuditLogReportPixel(params, exportLimit, 0, pdf),
				insightId,
			);
			const { operationType, output } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1)
				throw new Error(`API Error: ${output}`);
			await download(insightId, output as unknown as string);
		} catch (error) {
			toast.error(`Error exporting logs: ${error}`);
			console.error("Error exporting logs:", error);
		}
	};

	/**
	 * Handles pagination change by updating page and rows per page state and fetching logs with the new offset.
	 * @param {number} newPage - The new page number.
	 * @param {number} newRowsPerPage - The new number of rows per page.
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

	//Override the parent css container used by Page.
	useEffect(() => {
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
	}, []);

	/**
	 * Updates the filtered data state (emitted by the filter) and fetches from
	 * the first page.
	 * @param {AuditLogFilterValue} filterValue - The new filter value.
	 */
	const updateLogs = (filterValue: AuditLogFilterValue) => {
		filteredData.current = filterValue;
		setPage(0);
		fetchLogs(rowsPerPage, 0);
	};

	return (
		<div className="flex flex-col gap-4 px-8 py-8">
			<div className="flex w-full flex-wrap items-center gap-2 py-4">
				<h6 className="font-medium text-xl leading-[1.6] tracking-normal">
					{catalogName} Insight Dashboard
				</h6>
				<div className="ml-auto flex flex-row items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">
								<Download className="mr-2 h-4 w-4" />
								Export
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem
								onClick={() => handleExport(false)}
							>
								Export as CSV
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => handleExport(true)}
							>
								Export as PDF
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button
						variant="default"
						onClick={() => {
							if (hasScope(filteredData.current.scope))
								fetchLogs(rowsPerPage, page * rowsPerPage);
							else {
								toast.info(
									"Please select Engine Type and Engine to fetch logs",
								);
							}
						}}
					>
						<RotateCw className="mr-2 h-4 w-4" />
						Refresh
					</Button>
				</div>
			</div>
			<div className="flex w-full flex-wrap items-center gap-2">
				<AuditLogFilter updateLogs={updateLogs} insightId={insightId} />
			</div>
			{loading ? (
				<div className="flex flex-col gap-4">
					<Skeleton className="h-[400px] w-full rounded-md" />{" "}
					<Skeleton className="h-[400px] w-full rounded-md" />
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
			)}
		</div>
	);
};
