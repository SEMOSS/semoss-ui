import { KeyboardArrowDown, QueryBuilder, Tune } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { Resizable } from "re-resizable";
import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
	Chip,
	Container,
	Divider,
	IconButton,
	LoadingScreen,
	Stack,
	styled,
	Tooltip,
	Typography,
	useNotification,
} from "@semoss/ui";
import {
	InputMessage,
	PlanMessage,
	ResponseMessage,
	RoomArtifact,
	RoomConfiguration,
	RoomInput,
	WorkspaceChip,
} from "@/components";
import { useAutoScroll, useChat } from "@/hooks";

const StyledPage = styled(Stack)(() => ({
	width: "100%",
	height: "100%",
	padding: "16px 16px 0 16px",
}));

const StyledPageHeader = styled(Stack)(() => ({
	width: "100%",
	padding: "4px 8px",
}));

const StyledContent = styled(Stack)(() => ({
	height: "100%",
	width: "100%",
	overflow: "hidden",
	paddingBottom: "16px",
}));

const StyledScrollContainer = styled("div")(() => ({
	position: "relative",
	flex: 1,
	width: "100%",
	overflow: "hidden",
}));

const StyledScroll = styled("div")(() => ({
	height: "100%",
	width: "100%",
	overflowX: "hidden",
	overflowY: "auto",
	position: "relative",
}));

const StyledScrollButton = styled(IconButton)(({ theme }) => ({
	position: "absolute",
	bottom: "16px",
	right: "16px",
	backgroundColor: theme.palette.primary.main,
	color: theme.palette.primary.contrastText,
	boxShadow: theme.shadows[4],
	zIndex: 1000,
	"&:hover": {
		backgroundColor: theme.palette.primary.dark,
		boxShadow: theme.shadows[6],
	},
}));

const getDateTitle = (d: string) => {
	// Convert input to Date object if it's a string
	const compareDate = new Date(d);
	const now = new Date();

	// Calculate difference in milliseconds
	const diffTime = compareDate.getTime() - now.getTime();
	const absDiffTime = Math.abs(diffTime);

	// Convert to different time units
	const minutes = Math.floor(absDiffTime / (1000 * 60));
	const hours = Math.floor(absDiffTime / (1000 * 60 * 60));
	const days = Math.floor(absDiffTime / (1000 * 60 * 60 * 24));
	const weeks = Math.floor(days / 7);
	const months = Math.floor(days / 30);
	const years = Math.floor(days / 365);

	let message = "";

	// Determine the most appropriate time unit and format
	if (absDiffTime < 1000) {
		message = "Just now";
	} else if (minutes < 1) {
		const seconds = Math.floor(absDiffTime / 1000);
		message =
			diffTime < 0
				? `${seconds} second${seconds !== 1 ? "s" : ""} ago`
				: `In ${seconds} second${seconds !== 1 ? "s" : ""}`;
	} else if (minutes < 60) {
		message =
			diffTime < 0
				? `${minutes} minute${minutes !== 1 ? "s" : ""} ago`
				: `In ${minutes} minute${minutes !== 1 ? "s" : ""}`;
	} else if (hours < 24) {
		message =
			diffTime < 0
				? `${hours} hour${hours !== 1 ? "s" : ""} ago`
				: `In ${hours} hour${hours !== 1 ? "s" : ""}`;
	} else if (days < 7) {
		message =
			diffTime < 0
				? `${days} day${days !== 1 ? "s" : ""} ago`
				: `In ${days} day${days !== 1 ? "s" : ""}`;
	} else if (weeks < 4) {
		message =
			diffTime < 0
				? `${weeks} week${weeks !== 1 ? "s" : ""} ago`
				: `In ${weeks} week${weeks !== 1 ? "s" : ""}`;
	} else if (months < 12) {
		message =
			diffTime < 0
				? `${months} month${months !== 1 ? "s" : ""} ago`
				: `In ${months} month${months !== 1 ? "s" : ""}`;
	} else {
		message =
			diffTime < 0
				? `${years} year${years !== 1 ? "s" : ""} ago`
				: `In ${years} year${years !== 1 ? "s" : ""}`;
	}

	return message;
};

/**
 * The page for a room
 *
 * @component
 */
export const RoomPage = observer(() => {
	/**
	 * Library Hooks
	 */
	const { chat } = useChat();

	const notification = useNotification();
	const navigate = useNavigate();

	// set the get the room based on the params
	const { roomId } = useParams();

	// get the room
	const room = chat.getRoom(roomId);

	// get the agent if there is one
	const agentId = room?.options?.agent?.agent_id ?? null;
	const agent = chat.agents[agentId] ?? null;

	// Auto-scroll hook - tracks room history length to trigger scroll on new messages
	const { scrollRef, scrollToBottom, isUserScrolled } = useAutoScroll(
		room?.history?.length || 0,
	);

	/**
	 * Effects
	 */

	// load the room
	useEffect(() => {
		if (!room || room.isInitialized) {
			return;
		}

		const initializeRoom = async () => {
			try {
				await room.initialize();
			} catch (e) {
				notification.add({
					color: "error",
					message: e.message,
				});

				navigate("/");
			}
		};

		initializeRoom();
	}, [room, notification.add, navigate]);

	// create a listener to process messages from the room
	useEffect(() => {
		// ignore if there is no room
		if (!room) {
			return;
		}

		const handleMessage = async (
			event: MessageEvent<{
				type: "SMSS_EXEC_TOOL";
				tool: {
					type: "MCP";
					message: string;
					id: string;
					name: string;
					response: string;
				};
			}>,
		) => {
			try {
				if (!event.data || event.data.type !== "SMSS_EXEC_TOOL") {
					return;
				}

				const tool = event.data.tool;

				room.processTool(
					tool.message,
					tool.id,
					tool.name,
					tool.response,
				);
			} catch {
				// noop
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [room]);

	if (!room && chat.isInitialized) {
		// if the chat is initialized and there is no room, the room id is invalid - go back to home
		return <Navigate to="/" replace={true} />;
	}

	if (!room || !room.isInitialized) {
		// room is valid, but not initialized yet
		return <LoadingScreen.Trigger />;
	}

	let isDisabled = false;
	// If the plan is executing, only the execution step is enabled
	if (room.mode === "executing") {
		isDisabled = room.plan?.step?.details.stepType !== "human_intervention";
	}

	return (
		<StyledPage direction={"column"} spacing={1}>
			<StyledPageHeader
				direction={"row"}
				alignItems={"center"}
				spacing={2}
			>
				<Typography
					title={room?.metadata?.name}
					variant={"body2"}
					noWrap={true}
					sx={{
						maxWidth: "40%",
					}}
				>
					{room?.metadata?.name}
				</Typography>
				<Chip
					color="default"
					size="small"
					icon={<QueryBuilder fontSize="small" />}
					label={`Created ${getDateTitle(room?.metadata?.dateCreated)}`}
					sx={{
						background:
							"linear-gradient(270deg, rgba(183, 218, 242, 0.60) -31.76%, #DCD7F9 89.53%)",
					}}
				/>
				<Stack flex={1} />
			</StyledPageHeader>
			<Divider
				orientation="horizontal"
				sx={{ borderColor: "secondary.divider" }}
			/>
			<Stack
				flex={1}
				direction={"row"}
				alignItems={"center"}
				spacing={2}
				width={"100%"}
				overflow={"hidden"}
			>
				<StyledContent
					direction={"column"}
					spacing={0}
					flex={1}
					alignItems={"center"}
				>
					<StyledScrollContainer>
						<StyledScroll ref={scrollRef}>
							<Container maxWidth="xl" disableGutters={true}>
								{room.history.map((m, mIdx) => {
									if (!m.visible) {
										return null;
									}

									return (
										<Stack
											key={m.id}
											direction="column"
											sx={{
												paddingTop: "8px",
												paddingBottom: "8px",
											}}
										>
											{m.type === "INPUT" && (
												<InputMessage message={m} />
											)}
											{m.type === "RESPONSE" && (
												<ResponseMessage message={m} />
											)}
											{m.type === "PLAN" && (
												<PlanMessage
													message={m}
													isLast={
														mIdx ===
														room.history.length - 1
													}
												/>
											)}
										</Stack>
									);
								})}
							</Container>
						</StyledScroll>
						{isUserScrolled && (
							<Tooltip title="Scroll to bottom" placement="top">
								<StyledScrollButton
									size="small"
									color="primary"
									onClick={() => scrollToBottom()}
									aria-label="Scroll to bottom"
								>
									<KeyboardArrowDown fontSize="medium" />
								</StyledScrollButton>
							</Tooltip>
						)}
					</StyledScrollContainer>
					<Stack
						direction={"row"}
						justifyContent={"center"}
						width={"100%"}
					>
						<Container maxWidth="xl" disableGutters={true}>
							<RoomInput
								isLoading={room.isLoading}
								isDisabled={isDisabled}
								minRows={3}
								maxRows={8}
								actions={
									agentId ? (
										<WorkspaceChip agent={agent} />
									) : (
										<Tooltip
											title={"Configuration"}
											placement="top"
										>
											<IconButton
												size={"medium"}
												type="button"
												aria-label="Configuration"
												disabled={room.isLoading}
												color={
													room.sidebar.isOpen &&
													room.sidebar.type ===
														"CONFIGURATION"
														? "primary"
														: "default"
												}
												onClick={() => {
													// toggle open / closed based on the state
													if (
														room.sidebar.isOpen &&
														room.sidebar.type ===
															"CONFIGURATION"
													) {
														room.closeSidebar();
													} else {
														room.openSidebar(
															"CONFIGURATION",
														);
													}
												}}
											>
												<Tune color="inherit" />
											</IconButton>
										</Tooltip>
									)
								}
								onPrompt={async (prompt, files) => {
									await room.askMessage(prompt, files);

									return true;
								}}
							/>
						</Container>
					</Stack>
				</StyledContent>
				{room.sidebar.isOpen && (
					<Resizable
						minWidth={340}
						defaultSize={{
							width:
								room.sidebar.type === "ARTIFACTS"
									? `70%`
									: "340px",
							height: "100%",
						}}
						handleStyles={{
							top: { pointerEvents: "none" },
							right: { pointerEvents: "none" },
							bottom: { pointerEvents: "none" },
							topRight: { pointerEvents: "none" },
							bottomRight: { pointerEvents: "none" },
							bottomLeft: { pointerEvents: "none" },
							topLeft: { pointerEvents: "none" },
						}}
						style={{
							paddingBottom: "16px",
						}}
					>
						{room.sidebar.type === "CONFIGURATION" && (
							<RoomConfiguration
								options={room.options}
								setOptions={(o) => {
									room.setOptions(o);
								}}
								onClose={() => {
									room.closeSidebar();
								}}
								room={room}
							/>
						)}
						{room.sidebar.type === "ARTIFACTS" && (
							<RoomArtifact room={room} />
						)}
					</Resizable>
				)}
			</Stack>
		</StyledPage>
	);
});
