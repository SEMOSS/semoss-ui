import { Refresh } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { AuditLogsDataTable, AuditLogsTimeline } from "@semoss/shared";
import {
	Button,
	Skeleton,
	Stack,
	styled,
	Typography,
	useNotification,
} from "@semoss/ui";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useRootStore } from "@/hooks";

const DashboardHeader = styled("div")(({ theme }) => ({
	width: "100%",
	paddingY: theme.spacing(2),
	display: "flex",
	alignItems: "center",
}));

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

export const AuditLogsDashboard = ({ catalogName }) => {
	const { configStore, monolithStore } = useRootStore();
	const [logs, setLogs] = useState<EventData[]>([]);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState<boolean>(true);
	const notification = useNotification();

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
			const response = await monolithStore.runQuery(
				`AuditLogReport(paramValues=[{"userId": "${configStore.store.user.id}", "${catalogName === "Apps" ? "projectId" : "engineId"}": "${catalogId}","dateTime":"${dateTime}","limit":"${limit}","offset":"${offset}"}]);`,
			);
			const responseData = response.pixelReturn[0].output;
			setLogs((responseData?.logs as EventData[]) || responseData || []);
			setTotalCount(
				responseData?.totalCount || responseData?.length || 0,
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
	}, [catalogName, rowsPerPage, page]);

	return (
		<>
			{catalogName === "Apps" && (
				<NavbarLeft>
					<NavbarHeader />
				</NavbarLeft>
			)}
			<Stack gap={2}>
				<DashboardHeader>
					<Typography variant="h6">
						{catalogName} Insight Dashboard
					</Typography>
					<Stack
						direction="row"
						spacing={2}
						sx={{ marginLeft: "auto" }}
					>
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
		</>
	);
};
