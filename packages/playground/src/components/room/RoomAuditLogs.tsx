import { useEffect, useRef, useState } from "react";
import {
	AuditLogFilter,
	AuditLogsDataTable,
	AuditLogsTimeline,
} from "@semoss/shared";
import { Button } from "@semoss/ui/next";
import type { RoomStore } from "@/stores/room/room.store";

// Custom dashboard header styling (now a regular div with inline styles)
const DashboardHeader = (props: React.PropsWithChildren) => (
	<div
		style={{
			width: "100%",
			paddingTop: "16px",
			paddingBottom: "16px",
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			gap: "16px",
			flexWrap: "wrap",
		}}
		{...props}
	/>
);

// event data object structure will have entire row details of auditlog table row
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

interface RoomAuditLogsProps {
	room: RoomStore;
}

/**
 * A component for displaying the audit logs dashboard for a given room.
 *
 * @param {RoomStore} room - The room store.
 * @returns {JSX.Element} - A JSX element containing the audit logs dashboard.
 */
export const RoomAuditLogs = ({ room }: RoomAuditLogsProps) => {
	const [logs, setLogs] = useState<EventData[]>([]);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState<boolean>(true);

	// filter data ref for date range filtering
	const filteredData = useRef({
		engineType: "",
		engineId: "",
		dashboardDuration: "",
		customDateRange: { from: null, to: null },
		SelectedDuration: {
			label: "",
			value: "",
			dateRangeType: "",
			dateRangeValue: 1,
		},
	});

	/**
	 * Fetches the audit logs from the API.
	 * @param {number} limit - The limit of the logs to fetch.
	 * @param {number} offset - The offset of the logs to fetch.
	 * @returns {Promise<EventData[]>} - A promise that resolves with the fetched logs.
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

			const SelectedDuration = filteredData.current.SelectedDuration;
			const startDate = new Date(
				filteredData.current?.customDateRange?.from?.setUTCHours(
					0,
					0,
					0,
					0,
				),
			);
			const endDate = new Date(
				filteredData.current?.customDateRange?.to?.setUTCHours(
					23,
					59,
					59,
					999,
				),
			);

			const response = await room.runRoomPixel(
				`AuditLogReport(paramValues=[{"roomId": "${room.roomId}","dateTime":"${dateTime}","limit":"${limit}","offset":"${offset}", "dateRangeType": "${SelectedDuration.dateRangeType || "DAY"}","dateRangeValue": ${SelectedDuration.dateRangeValue} ${SelectedDuration.dateRangeType === "CUSTOM" ? `,"startDate": "${startDate?.toISOString()}", "endDate": "${endDate?.toISOString()}"` : ""}}]);`,
			);
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
			console.error("Error fetching logs:", error);
		} finally {
			setLoading(false);
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

	useEffect(() => {
		if (room.roomId) {
			setLogs([]);
			fetchLogs(rowsPerPage, page * rowsPerPage);
		}
	}, [room.roomId, rowsPerPage, page]);

	/**
	 * Updates the filtered data state with the new filter data and fetches logs with the new filtering options like start, end date,etc.
	 * @param {object} filterData - The new filter data.
	 */
	const updateLogs = (filterData) => {
		filteredData.current = {
			...filterData,
		};
		fetchLogs(rowsPerPage, page * rowsPerPage);
	};

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "16px",
				padding: "16px",
				width: "100%",
				maxWidth: "100%",
				boxSizing: "border-box",
				overflow: "hidden",
			}}
		>
			<DashboardHeader>
				<h6
					style={{
						fontSize: "1.25rem",
						fontWeight: "bold",
						margin: 0,
						minWidth: 0,
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
						flexGrow: 1, // Allow title to take available space
					}}
				>
					Room Audit Logs
				</h6>
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						gap: "8px",
						flexShrink: 0, // Prevent buttons from shrinking
					}}
				>
					<AuditLogFilter
						updateLogs={updateLogs}
						insightId={room.insightId}
						parent={"playground"}
					/>
					<Button
						color="primary"
						onClick={() =>
							fetchLogs(rowsPerPage, page * rowsPerPage)
						}
					>
						Refresh
					</Button>
				</div>
			</DashboardHeader>
			{loading ? (
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "16px",
					}}
				></div>
			) : (
				<div
					style={{
						width: "100%",
						maxWidth: "100%",
						overflow: "hidden",
						display: "flex",
						flexDirection: "column",
						gap: "16px",
					}}
				>
					<AuditLogsTimeline logs={logs} />
					<AuditLogsDataTable
						logs={logs}
						totalCount={totalCount}
						page={page}
						rowsPerPage={rowsPerPage}
						onPaginationChange={handlePaginationChange}
					/>
				</div>
			)}
		</div>
	);
};
