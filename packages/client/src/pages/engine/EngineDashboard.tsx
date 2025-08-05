import { Refresh } from "@mui/icons-material";
import { useEffect, useState } from "react";
import {
	Button,
	MenuItem,
	Select,
	Skeleton,
	Stack,
	styled,
	Typography,
} from "@semoss/ui";
import { useRootStore } from "@/hooks";
import EventDataTable from "./DashComponents/EventDataTable";
import EventHistory from "./DashComponents/EventHistory";

const DashboardHeader = styled("div")(({ theme }) => ({
	width: "100%",
	paddingY: theme.spacing(2),
	display: "flex",
	alignItems: "center",
}));

export interface EventData {
	startTime: string;
	endTime: string;
	prompt: string;
	response: string;
	tokens: number;
	latency: number;
	date: string;
}
const EngineDashboard = ({ catalogName }) => {
	const { configStore, monolithStore } = useRootStore();
	const [logs, setLogs] = useState<EventData[]>([]);
	const fetchLogs = async () => {
		const catalogId = window.location.hash.split("/")[3];

		const pixelString = `AuditLog(auditEndpoint=["timelinedatas"], paramValues=[{"userId": "${
			configStore.store.user.id
		}", "engineId": "${catalogId}","date":"${new Date().toISOString()}"}]);`;
		// Fetch logs from the monolith store
		await monolithStore
			.runQuery(pixelString)
			.then((response) => {
				let output = undefined;
				let type = undefined;

				output = response.pixelReturn[0].output;
				type = response.pixelReturn[0].operationType[0];

				if (type.indexOf("ERROR") > -1) {
					console.error(output);
					return;
				}
				// Return the logs from the response
				setLogs(JSON.parse(output));
			})
			.catch((error) => {
				console.error("Error fetching logs:", error);
			});
	};
	useEffect(() => {
		// api call to fetch the data for the dashboard can be placed here
		// Call the fetchLogs function to get the logs
		fetchLogs();
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
	}, []);

	return (
		<Stack gap={2}>
			<DashboardHeader>
				<Typography variant="h6">
					{catalogName} Insight Dashboard
				</Typography>
				<Stack direction="row" spacing={2} sx={{ marginLeft: "auto" }}>
					<Select
						variant="outlined"
						size="small"
						onChange={() => {}}
						sx={{ minWidth: 120 }}
						value={"Last 30 Days"}
					>
						<MenuItem value="Last 30 Days">Last 30 Days</MenuItem>
						<MenuItem value="Last 90 Days">Last 90 Days</MenuItem>
						<MenuItem value="Last Year">Last Year</MenuItem>
					</Select>
					<Button
						variant="contained"
						color="primary"
						startIcon={<Refresh />}
						onClick={fetchLogs}
					>
						Refresh
					</Button>
				</Stack>
			</DashboardHeader>
			{logs.length === 0 ? (
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
					<EventHistory logs={logs} />
					<EventDataTable logs={logs} />
				</>
			)}
		</Stack>
	);
};

export default EngineDashboard;
