import { Search } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import {
	Grid,
	InputAdornment,
	Stack,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";
import { AgentCard } from "@/components/agent/AgentCard";

const StyledTextField = styled(TextField)(({ theme }) => ({
	backgroundColor: theme.palette.background.paper,
	borderRadius: theme.shape.borderRadius,
}));

// TODO: Pull from backend
const ALL_AGENTS = [
	{
		NAME: "Weather Forecaster1",
		PUBLISH_DATE: "Mar. 01, 2025",
	},
	{
		NAME: "Create Meeting Minutes2",
		PUBLISH_DATE: "Mar. 01, 2025",
	},
	{
		NAME: "Plan Your Next Vacation3",
		PUBLISH_DATE: "Mar. 01, 2025",
	},
	{
		NAME: "Financial Analyst4",
		PUBLISH_DATE: "Mar. 01, 2025",
	},
	{
		NAME: "Weather Forecaster5",
		PUBLISH_DATE: "Mar. 01, 2025",
	},
	{
		NAME: "Create Meeting Minutes6",
		PUBLISH_DATE: "Mar. 01, 2025",
	},
	{
		NAME: "Plan Your Next Vacation7",
		PUBLISH_DATE: "Mar. 01, 2025",
	},
	{
		NAME: "Financial Analyst8",
		PUBLISH_DATE: "Mar. 01, 2025",
	},
];

/**
 * Renders the Discover Page, allowing users to discover and create agents
 *
 * @component
 */
export const AgentPage = observer(() => {
	/**
	 * Library hooks
	 */
	// const navigate = useNavigate();

	/**
	 * State
	 */
	const [search, setSearch] = useState("");

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
				<div>todo: build your own agent section</div>
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
								return agent.NAME.toLowerCase().includes(
									searchText,
								);
							} else {
								return true;
							}
						}).map((agentInfo) => (
							<Grid
								item
								xs={12}
								sm={6}
								md={3}
								key={agentInfo.NAME}
							>
								<Stack width="100%" spacing={1} height="100%">
									<AgentCard
										name={agentInfo.NAME}
										description="description"
									/>
									<Stack paddingLeft={1}>
										<Typography
											variant="caption"
											color="text.secondary"
										>{`Published ${agentInfo.PUBLISH_DATE}`}</Typography>
									</Stack>
								</Stack>
							</Grid>
						))}
					</Grid>
				</div>
			</Stack>
		</Stack>
	);
});
