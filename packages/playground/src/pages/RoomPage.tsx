import { QueryBuilder, Tune } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { Resizable } from "re-resizable";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
	RoomArtifact,
	RoomConfiguration,
	RoomInput,
	RoomMessage,
} from "@/components";
import { useChat } from "@/hooks";
import { ResponseMessageStore } from "@/stores/message/response-message.store";

const StyledPage = styled(Stack)(() => ({
	width: "100%",
	height: "100%",
}));

const StyledPageHeader = styled(Stack)(() => ({
	width: "100%",
	padding: "4px 8px",
}));

const StyledContent = styled(Stack)(() => ({
	height: "100%",
	width: "100%",
	overflow: "hidden",
}));

const StyledScroll = styled("div")(() => ({
	display: "flex",
	// flexDirection: "column-reverse",
	flex: 1,
	width: "100%",
	overflowX: "hidden",
	overflowY: "auto",
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

export const RoomPage = observer(() => {
	const { chat } = useChat();

	const notification = useNotification();
	const navigate = useNavigate();

	// set the get the room based on the params
	const { roomId } = useParams();

	// get the room
	const room = chat.getRoom(roomId);

	// load the room
	useEffect(() => {
		if (!room || room.isInitialized) {
			return;
		}

		try {
			room.initialize();
		} catch (e) {
			notification.add({
				color: "error",
				message: e.message,
			});

			navigate("/");
		}
	}, [room, notification.add]);

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

				const message = room.getMessage(tool.message);
				if (
					!message ||
					message instanceof ResponseMessageStore !== true
				) {
					return;
				}

				room.saveTool(message, tool.id, tool.name, tool.response);
			} catch {
				// noop
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [room]);

	if (!room || !room.isInitialized) {
		return <LoadingScreen.Trigger />;
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
						maxWidth: "50%",
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
				sx={{ backgroundColor: "secondary.divider" }}
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
					<StyledScroll>
						<Container
							maxWidth="md"
							sx={{ padding: "0 !important" }}
						>
							{room.history.map((m) => (
								<Stack
									key={m.id}
									direction="column"
									sx={{
										paddingTop: "8px",
										paddingBottom: "8px",
									}}
								>
									<RoomMessage room={room} message={m} />
								</Stack>
							))}
						</Container>
					</StyledScroll>
					<Stack
						direction={"row"}
						justifyContent={"center"}
						width={"100%"}
					>
						<Container maxWidth="md">
							<Stack direction={"column"} spacing={1}>
								<RoomInput
									isLoading={room.isLoading}
									isDisabled={false}
									minRows={3}
									maxRows={8}
									actions={
										<Tooltip
											title={"Open Configuration Menu"}
											placement="top"
										>
											<IconButton
												size={"medium"}
												type="button"
												aria-label="Open Configuration Menu"
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
									}
									onPrompt={async (prompt, files) => {
										await room.askModel(prompt, files);

										return true;
									}}
								/>
							</Stack>
						</Container>
					</Stack>
				</StyledContent>
				{room.sidebar.isOpen && (
					<Resizable
						minWidth={340}
						defaultSize={{
							width:
								room.sidebar.type === "ARTIFACTS" ? 600 : 340,
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
