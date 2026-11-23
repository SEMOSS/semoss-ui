import { Download, RefreshCw, ScrollTextIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
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
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { useRoom } from "../../room/scope/room.context";
import { useRoomSelector } from "../../room/store/use-room-selector";

/**
 * The audit logs dashboard scoped to the current room, shown in the room's
 * right-hand side panel. Reuses the shared audit components and the shared pixel
 * builders, run through the room's insight. The scope is locked to the room's id
 * (no engine/project pickers), so it can't be changed from this view.
 */
const RoomActivityLogPanel = () => {
	const { t } = useTranslation("room");
	const room = useRoom();
	const { roomId, insightId } = useRoomSelector(room, (current) => ({
		roomId: current.roomId,
		insightId: current.insightId,
	}));
	const scope: AuditLogScope = { roomId };

	const [logs, setLogs] = useState<EventData[]>([]);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(50);
	const [totalCount, setTotalCount] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	// the filter the last fetch used; a ref, since only a fetch reads it
	const filterValueRef = useRef<AuditLogFilterValue>({
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

	/**
	 * Loads one page of the room's logs under the current filter, through the
	 * room's insight; a failure empties the table and shows a toast.
	 *
	 * @param limit - How many rows to load.
	 * @param offset - How many rows to skip.
	 */
	const fetchLogs = async (limit: number, offset: number) => {
		const filterValue = filterValueRef.current;
		if (!hasScope(filterValue.scope) || !insightId) {
			setLogs([]);
			setTotalCount(0);
			setIsLoading(false);
			return;
		}
		setIsLoading(true);
		try {
			// room scope only: no date filter values are sent
			const params = filterValueToReportParams(filterValue, {
				includeDate: false,
			});
			const response = await room.runRoomPixel<
				[{ logs?: EventData[]; totalCount?: number }]
			>(buildAuditLogReportPixel(params, limit, offset), {
				showLoading: false,
			});
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
			toast.error(
				t("auditlog:page.errorFetching", { error: String(error) }),
			);
			console.error("Error fetching room logs:", error);
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Downloads every log under the current filter as a CSV or a PDF.
	 *
	 * @param pdf - Whether to export a PDF rather than a CSV.
	 */
	const handleExport = async (pdf: boolean) => {
		const filterValue = filterValueRef.current;
		if (!hasScope(filterValue.scope) || !insightId) return;
		try {
			const params = filterValueToReportParams(filterValue, {
				includeDate: false,
			});
			// every matching row, or one page before the first count is known
			const exportLimit = totalCount > 0 ? totalCount : rowsPerPage;
			const response = await room.runRoomPixel<[string]>(
				buildExportAuditLogReportPixel(params, exportLimit, 0, pdf),
				{ showLoading: false },
			);
			const { operationType, output } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1)
				throw new Error(`API Error: ${output}`);
			await download(insightId, output as unknown as string);
		} catch (error) {
			toast.error(
				t("auditlog:page.errorExporting", { error: String(error) }),
			);
			console.error("Error exporting room logs:", error);
		}
	};

	/** Loads the page the table moved to. */
	const handlePaginationChange = (
		newPage: number,
		newRowsPerPage: number,
	) => {
		setPage(newPage);
		setRowsPerPage(newRowsPerPage);
		fetchLogs(newRowsPerPage, newPage * newRowsPerPage);
	};

	/** Applies a new filter and loads its first page. */
	const handleFilterChange = (filterValue: AuditLogFilterValue) => {
		// keep the scope locked to this room whatever the filter emits
		filterValueRef.current = { ...filterValue, scope };
		setPage(0);
		fetchLogs(rowsPerPage, 0);
	};

	// export and refresh, drawn at the end of the filter row
	const actions = (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						size="icon-sm"
						aria-label={t("studio.export")}
					>
						<Download className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem onClick={() => handleExport(false)}>
						{t("studio.exportCsv")}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => handleExport(true)}>
						{t("studio.exportPdf")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<Button
				variant="outline"
				size="icon-sm"
				aria-label={t("studio.refresh")}
				onClick={() => fetchLogs(rowsPerPage, page * rowsPerPage)}
			>
				<RefreshCw className="size-4" />
			</Button>
		</>
	);

	return (
		<div className="flex h-full min-w-0 flex-col gap-4 overflow-auto bg-background p-4">
			<div className="flex w-full flex-wrap items-center gap-2">
				<AuditLogFilter
					updateLogs={handleFilterChange}
					insightId={insightId}
					parent="client"
					scope={scope}
					hideRoomFilter
					hideDateFilter
					actions={actions}
					runFilterPixel={(pixel) =>
						room.runRoomPixel(pixel, {
							showLoading: false,
							setErrorOnFail: false,
						})
					}
				/>
			</div>
			{isLoading ? (
				<div className="flex flex-col gap-4">
					<Skeleton className="h-72 w-full" />
					<Skeleton className="h-72 w-full" />
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

/** The room's activity log. One per Workbench. */
export const ROOM_ACTIVITY_LOG_PANEL: WorkbenchPanelConfig = {
	name: "Activity",
	icon: ({ className }) => <ScrollTextIcon className={className} />,
	canRename: false,
	mount: "keepAlive",
	content: RoomActivityLogPanel,
};
