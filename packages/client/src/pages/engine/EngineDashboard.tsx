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
// Mock API data as provided
const mockApiData: EventData[] = [
	{
		startTime: "11:10:10 PM",
		endTime: "11:22:10 PM",
		prompt: "What's the capital of Spain?",
		response: "The capital of Spain is Madrid.",
		tokens: 13,
		latency: 110,
		date: "07/05/2025",
	},
	{
		startTime: "11:13:10 PM",
		endTime: "11:28:10 PM",
		prompt: "Search for climate reports",
		response: "Found 5 relevant climate report documents.",
		tokens: 20,
		latency: 120,
		date: "01/05/2025",
	},
	{
		startTime: "11:19:10 PM",
		endTime: "11:27:23 PM",
		prompt: "Get user with ID 123",
		response: "User 123: John Doe, Email: john@example.com",
		tokens: 40,
		latency: 170,
		date: "03/05/2025",
	},
	{
		startTime: "11:21:10 PM",
		endTime: "11:30:10 PM",
		prompt: "Who was Albert Einstein?",
		response: "Albert Einstein was a physicist who developed...",
		tokens: 33,
		latency: 10,
		date: "09/05/2025",
	},
	{
		startTime: "11:21:10 PM",
		endTime: "11:30:10 PM",
		prompt: "Who was Albert Einstein?",
		response: "Albert Einstein was a physicist who developed...",
		tokens: 50,
		latency: 30,
		date: "10/05/2025",
	},
	{
		startTime: "11:21:10 PM",
		endTime: "11:30:10 PM",
		prompt: "Who was Albert Einstein?",
		response: "Albert Einstein was a physicist who developed...",
		tokens: 9,
		latency: 20,
		date: "07/05/2025",
	},
	{
		startTime: "01:21:10 PM",
		endTime: "01:25:10 PM",
		prompt: "What is the capital of India?",
		response: "New Delhi is the capital of India.",
		tokens: 9,
		latency: 20,
		date: "07/05/2025",
	},
];

const EngineDashboard = () => {
	const { monolithStore } = useRootStore();
	const [logs, setLogs] = useState<EventData[]>([]);

	const fetchLogs = async () => {
		// Fetch logs from the monolith store
		const response = await monolithStore.runQuery(
			`AuditLog(auditEndpoint=["timelinedatas"], paramValues=[{"userId": "paulrobert","projectId":"4acbe913-df40-4ac0-b28a-daa5ad91b172","date":"2025-07-22T23:53:17.104", "roomId":"e8856a5e-03f3-4069-a934-67b7e32611fb"}]);`,
		);
		console.log("Response from API:", response);
		// Return the logs from the response
		// setLogs(response.pixelReturn[0].output);
		setLogs(mockApiData);
	};
	useEffect(() => {
		// api call to fetch the data for the dashboard can be placed here
		// Call the fetchLogs function to get the logs
		fetchLogs().catch((error) => {
			console.error("Error fetching logs:", error);
		});
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

	const decodeCatalogName = (hash: string) => {
		if (!hash) return "";
		const decoded = decodeURIComponent(hash);
		const parts = decoded.split("/");
		return parts[2].charAt(0).toUpperCase() + parts[2].slice(1) || "";
	};

	return (
		<Stack gap={2}>
			<DashboardHeader>
				<Typography variant="h6">
					{decodeCatalogName(window.location.hash)} Insight Dashboard
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
