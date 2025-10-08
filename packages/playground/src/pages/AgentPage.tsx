import { Search } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import {
	Box,
	Button,
	Grid,
	InputAdornment,
	Stack,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";
import { AgentCard, AgentModal } from "@/components/agent";
import type { Agent } from "@/types";

const StyledTextField = styled(TextField)(({ theme }) => ({
	backgroundColor: theme.palette.background.paper,
	borderRadius: theme.shape.borderRadius,
}));

// Thomas TODO: Pull from backend
const ALL_AGENTS: Agent[] = [
	{
		project_id: "1",
		project_name: "Weather Forecaster",
		project_date_created: "2025-03-01",
	},
	{
		project_name: "Create Meeting Minutes",
		project_id: "2",
		project_date_created: "2025-03-01",
	},
	{
		project_id: "3",
		project_name: "Plan Your Next Vacation",
		project_date_created: "2025-03-01",
	},
	{
		project_id: "4",
		project_name: "Financial Analyst",
		project_date_created: "2025-03-01",
	},
	{
		project_id: "5",
		project_name: "Weather Forecaster",
		project_date_created: "2025-03-01",
	},
	{
		project_id: "6",
		project_name: "Create Meeting Minutes",
		project_date_created: "2025-03-01",
	},
	{
		project_id: "7",
		project_name: "Plan Your Next Vacation",
		project_date_created: "2025-03-01",
	},
	{
		project_id: "8",
		project_name: "Financial Analyst",
		project_date_created: "2025-03-01",
	},
];

/**
 * Renders the Discover Page, allowing users to discover and create agents
 *
 * @component
 */
export const AgentPage = observer(() => {
	/**
	 * State
	 */
	const [search, setSearch] = useState("");
	const [isAgentModalOpen, setIsAgentModalOpen] = useState<boolean>(false);
	const [agentInfo, setAgentInfo] = useState<Agent | null>(null);

	/**
	 * Functions
	 */
	const createRoom = (agentId: string) => {
		// Thomas TODO: Implement create room logic
		console.log("Create room with agent ID:", agentId);
	};

	return (
		<Stack
			height="100%"
			width="100%"
			padding={2}
			paddingRight={3}
			overflow="auto"
		>
			<Stack paddingRight={2} spacing={3}>
				<Stack width="100%" alignItems="center" spacing={2}>
					<Typography variant="h4" fontWeight="bold">
						Discover Agents
					</Typography>
					<Typography
						variant="body1"
						color="text.secondary"
						align="center"
					>
						Explore and build custom AI agents designed to meet your
						unique needs and integrate seamlessly into your
						processes.
					</Typography>
				</Stack>
				<Box
					sx={{
						padding: "16px",
						borderRadius: "var(--Shape-borderRadiusMd, 8px)",
						background:
							"linear-gradient(270deg, #E9F5FD 19.69%, #DBD6F9 106.54%)",
						boxShadow: "0 1px 8px 0 rgba(0, 0, 0, 0.08)",
					}}
				>
					<Stack
						direction="row"
						justifyContent="space-between"
						alignItems="center"
					>
						<Box>
							<Stack>
								<Typography variant="h6">
									Build Your Own Agent
								</Typography>
								<Typography variant="body1" color="secondary">
									Create a personalized AI agent tailored to
									your goals with just a few steps.
								</Typography>
							</Stack>
						</Box>
						<Button
							onClick={() => {
								setAgentInfo(null);
								setIsAgentModalOpen(true);
							}}
							variant="contained"
						>
							Start Building
						</Button>
					</Stack>
				</Box>
				<Stack
					direction="row"
					width="100%"
					spacing={1}
					alignItems={"center"}
				>
					<StyledTextField
						variant="outlined"
						size="small"
						fullWidth
						placeholder="Search"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<Search />
									</InputAdornment>
								),
							},
						}}
					/>
					<StyledTextField placeholder="todo: sort" size="small" />
				</Stack>
			</Stack>
			<Stack overflow="auto" paddingRight={2} paddingTop={3}>
				<div>
					<Grid container columnSpacing={2} rowSpacing={4}>
						{ALL_AGENTS.filter((agent) => {
							const searchText = search
								? search.toLowerCase()
								: null;
							if (searchText) {
								return agent.project_name
									.toLowerCase()
									.includes(searchText);
							} else {
								return true;
							}
						}).map((agentInfo) => (
							<Grid
								item
								xs={12}
								sm={6}
								md={3}
								key={agentInfo.project_id}
							>
								<Stack width="100%" spacing={1} height="100%">
									<AgentCard
										name={agentInfo.project_name}
										description="description"
										onSecondaryClick={() => {
											setAgentInfo(agentInfo);
											setIsAgentModalOpen(true);
										}}
										onPrimaryClick={() => {
											createRoom(agentInfo.project_id);
										}}
									/>
									<Stack paddingLeft={1}>
										<Typography
											variant="caption"
											color="text.secondary"
										>{`Published ${agentInfo.project_date_created}`}</Typography>
									</Stack>
								</Stack>
							</Grid>
						))}
					</Grid>
				</div>
			</Stack>
			<AgentModal
				open={isAgentModalOpen}
				onClose={(newAgentId) => {
					setIsAgentModalOpen(false);
					if (newAgentId) {
						createRoom(newAgentId);
					}
				}}
				agentInfo={agentInfo}
			/>
		</Stack>
	);
});
