// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	AuditLogFilter,
	AuditLogsDataTable,
	AuditLogsTimeline,
} from "@semoss/shared";
import { Button, Skeleton, toast } from "@semoss/ui/next";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useRootStore } from "@/hooks";

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
export const AuditLogsDashboard = ({ catalogName }) => {
	const { configStore, monolithStore } = useRootStore();
	const [logs, setLogs] = useState<EventData[]>([]);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState<boolean>(true);
	const notification = {
		add: ({ color, message }: { color: string; message: string }) => {
			if (color === "success") toast.success(message);
			else if (color === "error") toast.error(message);
			else toast(message);
		},
	};
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
			const catalogId =
				window.location.hash.split("/")[catalogName === "Apps" ? 2 : 3];
			const SelectedDuration = filteredData.current.SelectedDuration; // getting date range type like day/week/month
			//start and end dates, if custom date range is selected
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
			const response = await monolithStore.runQuery(
				`AuditLogReport(paramValues=[{"userId": "${configStore.store.user.id}", "${catalogName === "Apps" ? "projectId" : "engineId"}": "${catalogId}","dateTime":"${dateTime}","limit":"${limit}","offset":"${offset}", "dateRangeType": "${SelectedDuration.dateRangeType || "DAY"}","dateRangeValue": ${SelectedDuration.dateRangeValue} ${SelectedDuration.dateRangeType === "CUSTOM" ? `,"startDate": "${startDate?.toISOString()}", "endDate": "${endDate?.toISOString()}"` : ""}}]);`,
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
			notification.add({
				color: "error",
				message: `Error fetching logs: ${error}`,
			});
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
	//whenever there is a change in rowsperpage/page number, page then logs will be fetched again
	useEffect(() => {
		if (catalogName) {
			setLogs([]);
			fetchLogs(rowsPerPage, page * rowsPerPage);
		}
		// override the parent css container used by Page
		const contentElement = document.querySelector(
			'[data-home-container="true"]',
		) as HTMLElement | null;
		if (contentElement) {
			contentElement.style.padding = "32px";
			contentElement.style.maxWidth = "none";
		}

		return () => {
			if (contentElement) {
				//restore the original styles
				contentElement.style.padding = "";
				contentElement.style.maxWidth = "";
			}
		};
	}, [catalogName, rowsPerPage, page]);

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
		<>
			{catalogName === "Apps" && (
				<NavbarLeft>
					<NavbarHeader />
				</NavbarLeft>
			)}
			<div className="flex flex-col gap-4">
				<div className="flex w-full items-center py-2">
					<h6 className="font-semibold text-lg">
						{catalogName} Insight Dashboard
					</h6>
					<div className="ml-auto flex flex-row gap-4">
						<AuditLogFilter
							updateLogs={updateLogs}
							insightId={configStore.store.insightID}
							parent={"client"}
						/>
						<Button
							variant="default"
							onClick={() =>
								fetchLogs(rowsPerPage, page * rowsPerPage)
							}
						>
							<RotateCw className="mr-2 h-4 w-4" />
							Refresh
						</Button>
					</div>
				</div>
				{loading ? (
					<div className="flex flex-col gap-4">
						<Skeleton className="h-[400px] w-full rounded-md" />
						<Skeleton className="h-[400px] w-full rounded-md" />
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
