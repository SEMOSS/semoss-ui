import { RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import {
	AuditLogFilter,
	AuditLogsDataTable,
	AuditLogsTimeline,
	type EventData,
} from "@semoss/shared";
import { Button, Skeleton, toast } from "@semoss/ui/next";
import { useUserRootStore } from "@/hooks/useUserRootStore";

/**
 * This component displays the audit logs.
 *
 * @param {string} catalogName - The name of the catalog.
 */

export const AuditLogPage = ({ catalogName }) => {
	const { insightId } = useInsight(); // fetching insight id for access
	const [logs, setLogs] = useState<EventData[]>([]);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState<boolean>(true);
	const rootStore = useUserRootStore(insightId);
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
	 * Fetches audit logs from the API.
	 *
	 * @param {number} limit - The limit of the logs to fetch.
	 * @param {number} offset - The offset of the logs to fetch.
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
			const catalogId = filteredData.current.engineId ?? null;
			catalogName = filteredData.current.engineType;
			console.log(catalogName, "catalogName");
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
			const SelectedDuration = filteredData.current.SelectedDuration;
			const response = await runPixel(
				`AuditLogReport(paramValues=[{"userId": "${rootStore?.user?.id}","projectId" : "${catalogName === "APP" ? catalogId : ""}","engineId": "${catalogName === "APP" ? "" : catalogId}","dateTime":"${dateTime}","limit":"${limit}","offset":"${offset}","dateRangeType": "${SelectedDuration.dateRangeType || "DAY"}","dateRangeValue": ${SelectedDuration.dateRangeValue} ${SelectedDuration.dateRangeType === "CUSTOM" ? `,"startDate": "${startDate?.toISOString()}", "endDate": "${endDate?.toISOString()}"` : ""}}]);`,
				insightId,
			);
			const responseData = response.pixelReturn[0].output as {
				logs: EventData[];
				totalCount: number;
			};
			if (responseData?.logs) {
				const responseLogs =
					responseData?.logs as unknown as EventData[];
				setLogs((responseLogs as unknown as EventData[]) || []);
				setTotalCount(responseData?.totalCount || 0);
			}
			if (!responseData?.logs) {
				const responseLogs = responseData as unknown as EventData[];
				setLogs((responseLogs as unknown as EventData[]) || []);
				setTotalCount(responseLogs?.length || 0);
			}
		} catch (error) {
			setLogs([]);
			// notification.add({
			// 	color: "error",
			// 	message: `Error fetching logs: ${error}`,
			// });
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
	// biome-ignore lint/correctness/useExhaustiveDependencies: adding fetchLogs causes infinite rerender and based on rootStore user id, data has to be fetched
	useEffect(() => {
		//By default engine type and id is required to show the logs
		if (
			!catalogName ||
			!rootStore?.user?.id ||
			!filteredData.current?.engineId
		) {
			setLogs([]);
			setLoading(false);
			return;
		}
		if (
			catalogName &&
			rootStore?.user?.id &&
			filteredData.current?.engineId
		) {
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
	}, [catalogName, rowsPerPage, page, rootStore?.user?.id]);

	/**
	 * Updates the filtered data state with the new filter data and fetches logs with the new offset.
	 * @param {object} filterData - The new filter data.
	 */
	const updateLogs = (filterData) => {
		filteredData.current = {
			...filterData,
		};
		fetchLogs(rowsPerPage, page * rowsPerPage);
	};
	return (
		<div className="flex flex-col gap-4 px-8 py-8">
			<div className="flex w-full items-center py-4">
				<h6 className="font-medium text-xl leading-[1.6] tracking-normal">
					{catalogName} Insight Dashboard
				</h6>
				<div className="ml-auto flex flex-row gap-4">
					{/* Disabled for now */}
					{/* <Select
							variant="outlined"
							size="small"
							onChange={() => {}}
							sx={{ minWidth: 120 }}
							value={"Last 30 Days"}
						>
							<Menu.Item value="Last 30 Days">
								Last 30 Days
							</Menu.Item>
							<Menu.Item value="Last 90 Days">
								Last 90 Days
							</Menu.Item>
							<Menu.Item value="Last Year">Last Year</Menu.Item>
						</Select> */}
					<AuditLogFilter
						updateLogs={updateLogs}
						insightId={insightId}
					/>
					<Button
						variant="default"
						onClick={() => {
							if (
								filteredData.current.engineId &&
								filteredData.current.engineType
							)
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
			{loading ? (
				<div className="flex flex-col gap-4">
					<Skeleton className="h-[400px] w-full rounded-md" />{" "}
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
	);
};
