import { Download, RefreshCw } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import { download } from "@semoss/sdk";
import {
	AuditLogFilter,
	type AuditLogFilterValue,
	type AuditLogScope,
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
import type { RoomStore } from "@/stores";

interface RoomAuditLogReportProps {
	room: RoomStore;
}

/**
 * The audit logs dashboard scoped to the current room, shown in the room's
 * right-hand side panel. Reuses the shared audit components and the shared pixel
 * builders, run through the room's insight. The scope is locked to the room's id
 * (no engine/project pickers), so it can't be changed from this view.
 */
export const RoomAuditLogReport = observer(
	({ room }: RoomAuditLogReportProps) => {
		const roomId = room.roomId;
		const insightId = room.insightId;
		const scope: AuditLogScope = { roomId };

		const [logs, setLogs] = useState<EventData[]>([]);
		const [page, setPage] = useState(0);
		const [rowsPerPage, setRowsPerPage] = useState(50);
		const [totalCount, setTotalCount] = useState(0);
		const [loading, setLoading] = useState(false);
		const filteredData = useRef<AuditLogFilterValue>({
			scope,
			dateRangeType: "DAY",
			dateRangeValue: 1,
			customDateRange: { from: null, to: null },
			methodNames: [],
			engineTypes: [],
			filterUserId: "",
			roomId: "",
			searchTerm: "",
		});

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
				//Room scope only — no date filter values are sent.
				const params = filterValueToReportParams(filterValue, {
					includeDate: false,
				});
				const response = await room.runRoomPixel<
					[{ logs?: EventData[]; totalCount?: number }]
				>(buildAuditLogReportPixel(params, limit, offset), false);
				const { operationType, output } = response.pixelReturn[0];
				if (operationType.indexOf("ERROR") > -1)
					throw new Error(`API Error: ${output}`);
				const responseData = output as {
					logs?: EventData[];
					totalCount?: number;
				};
				setLogs(responseData?.logs ?? []);
				setTotalCount(responseData?.totalCount ?? 0);
			} catch (error) {
				setLogs([]);
				setTotalCount(0);
				toast.error(`Error fetching logs: ${error}`);
				console.error("Error fetching room logs:", error);
			} finally {
				setLoading(false);
			}
		};

		const handleExport = async (pdf: boolean) => {
			const filterValue = filteredData.current;
			if (!hasScope(filterValue.scope) || !insightId) return;
			try {
				const params = filterValueToReportParams(filterValue, {
					includeDate: false,
				});
				const exportLimit = totalCount > 0 ? totalCount : rowsPerPage;
				const response = await room.runRoomPixel<[string]>(
					buildExportAuditLogReportPixel(params, exportLimit, 0, pdf),
					false,
				);
				const { operationType, output } = response.pixelReturn[0];
				if (operationType.indexOf("ERROR") > -1)
					throw new Error(`API Error: ${output}`);
				await download(insightId, output as unknown as string);
			} catch (error) {
				toast.error(`Error exporting logs: ${error}`);
				console.error("Error exporting room logs:", error);
			}
		};

		const handlePaginationChange = (
			newPage: number,
			newRowsPerPage: number,
		) => {
			setPage(newPage);
			setRowsPerPage(newRowsPerPage);
			fetchLogs(newRowsPerPage, newPage * newRowsPerPage);
		};

		const updateLogs = (filterValue: AuditLogFilterValue) => {
			//Keep the scope locked to this room regardless of what the filter emits.
			filteredData.current = { ...filterValue, scope };
			setPage(0);
			fetchLogs(rowsPerPage, 0);
		};

		const actions = (
			<>
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
			</>
		);

		return (
			<div className="flex h-full w-full flex-col gap-4 overflow-auto p-4">
				<div className="flex w-full flex-wrap items-center gap-2">
					<AuditLogFilter
						updateLogs={updateLogs}
						insightId={insightId}
						parent="client"
						scope={scope}
						hideRoomFilter
						hideDateFilter
						actions={actions}
					/>
				</div>
				{loading ? (
					<div className="flex flex-col gap-4">
						<Skeleton className="h-[300px] w-full" />
						<Skeleton className="h-[300px] w-full" />
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
	},
);
