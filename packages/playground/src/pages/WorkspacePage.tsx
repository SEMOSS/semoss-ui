import { Search } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { WorkspaceCard, WorkspaceModal } from "@/components";
import { useChat } from "@/hooks";
import type { Workspace } from "@/types";

const StyledTextField = styled(TextField)(({ theme }) => ({
	backgroundColor: theme.palette.background.paper,
	borderRadius: theme.shape.borderRadius,
}));

/**
 * Renders the Discover Page, allowing users to discover and create Workspaces
 *
 * @component
 */
export const WorkspacePage = observer(() => {
	/**
	 * Library Hooks
	 */
	const { chat } = useChat();
	const navigate = useNavigate();

	/**
	 * State
	 */
	const [search, setSearch] = useState("");
	const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] =
		useState<boolean>(false);
	const [workspaceInfo, setWorkspaceInfo] = useState<Workspace | null>(null);

	/**
	 * Functions
	 */
	const createRoom = (workspaceId: string) => {
		navigate(`/workspace/${workspaceId}/new`);
	};

	/**
	 * Constants
	 */
	const workspacesToRender = Object.values(chat.workspaces).filter(
		(workspace) =>
			search
				? workspace.name.toLowerCase().includes(search.toLowerCase())
				: true,
	);

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
						Discover Workspaces
					</Typography>
					<Typography
						variant="body1"
						color="textSecondary"
						align="center"
					>
						Explore and build custom AI Workspaces designed to meet
						your unique needs and integrate seamlessly into your
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
									Build Your Own Workspace
								</Typography>
								<Typography
									variant="body1"
									color="textSecondary"
								>
									Create a personalized AI Workspace tailored
									to your goals with just a few steps.
								</Typography>
							</Stack>
						</Box>
						<Button
							onClick={() => {
								setWorkspaceInfo(null);
								setIsWorkspaceModalOpen(true);
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
						{workspacesToRender.map((workspaceInfo) => (
							<Grid
								item
								xs={12}
								sm={6}
								md={3}
								key={workspaceInfo.workspace_id}
							>
								<Stack width="100%" spacing={1} height="100%">
									<WorkspaceCard
										workspace={workspaceInfo}
										onSecondaryClick={() => {
											setWorkspaceInfo(workspaceInfo);
											setIsWorkspaceModalOpen(true);
										}}
										onPrimaryClick={() => {
											createRoom(
												workspaceInfo.workspace_id,
											);
										}}
									/>
									<Stack paddingLeft={1}>
										<Typography
											variant="caption"
											color="textSecondary"
										>
											{`Published ${new Date(workspaceInfo.date_created).toLocaleDateString()}`}
										</Typography>
									</Stack>
								</Stack>
							</Grid>
						))}
					</Grid>
				</div>
			</Stack>
			<WorkspaceModal
				open={isWorkspaceModalOpen}
				onClose={(newWorkspaceId) => {
					setIsWorkspaceModalOpen(false);
					if (newWorkspaceId) {
						createRoom(newWorkspaceId);
					}
				}}
				workspaceInfo={workspaceInfo}
			/>
		</Stack>
	);
});
