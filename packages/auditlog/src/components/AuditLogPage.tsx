import { Refresh } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import { AuditLogsDataTable, AuditLogsTimeline } from "@semoss/shared";
import { Button, Skeleton, Stack, styled, Typography } from "@semoss/ui";
import { useUserRootStore } from "@/hooks/useUserRootStore";
import type { EventData } from "./common/utility";

const DashboardHeader = styled("div")(({ theme }) => ({
	width: "100%",
	paddingY: theme.spacing(2),
	display: "flex",
	alignItems: "center",
}));

export const AuditLogPage = ({ catalogName }) => {
	const { insightId } = useInsight();
	const [logs, setLogs] = useState<EventData[]>([]);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState<boolean>(true);
	const rootStore = useUserRootStore(insightId);

	// const notification = useNotification();

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
			const response = await runPixel(
				`AuditLogReport(paramValues=[{"userId": "${rootStore?.user?.id}", "${catalogName === "Apps" ? "projectId" : "engineId"}": "${catalogId}","dateTime":"${dateTime}","limit":"${limit}","offset":"${offset}"}]);`,
				insightId,
			);
			const responseData = response.pixelReturn[0].output as {
				logs: EventData[];
				totalCount: number;
			};
			console.log(response, "response");
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
		if (catalogName) {
			setLogs([]);
			fetchLogs(rowsPerPage, page * rowsPerPage);
		}
		//override the parent css which has id = home__content
		const contentElement = document.getElementById("home__container");
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

	return (
		<Stack gap={2}>
			<DashboardHeader>
				<Typography variant="h6">
					{catalogName} Insight Dashboard
				</Typography>
				<Stack direction="row" spacing={2} sx={{ marginLeft: "auto" }}>
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
					<Button
						variant="contained"
						color="primary"
						startIcon={<Refresh />}
						onClick={() =>
							fetchLogs(rowsPerPage, page * rowsPerPage)
						}
					>
						Refresh
					</Button>
				</Stack>
			</DashboardHeader>
			{loading ? (
				<Stack gap={2}>
					<Skeleton
						variant="rectangular"
						height={400}
						width={"100%"}
					/>{" "}
					<Skeleton
						variant="rectangular"
						height={400}
						width={"100%"}
					/>
				</Stack>
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
		</Stack>
	);
};
