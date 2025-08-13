import {
	AccessTimeOutlined,
	DownloadRounded,
	MoreVertRounded,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { Resizable } from "re-resizable";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
	Container,
	IconButton,
	LoadingScreen,
	Select,
	Stack,
	styled,
	Tooltip,
	Typography,
	useNotification,
} from "@semoss/ui";
import {
	OptionsMenu,
	OptionsPicker,
	RoomArtifact,
	RoomInput,
	RoomMessage,
} from "@/components";
import { useChat } from "@/hooks";

const ENABLE_MODEL_SELECT = import.meta.env.VITE_ENABLE_MODEL_SELECT === "true";

const StyledPage = styled(Stack)(() => ({
	width: "100%",
	height: "100%",
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

const StyledSelect = styled(Select)(({ theme }) => ({
	fontSize: "14px",
	maxWidth: "220px",
	"& .MuiOutlinedInput-notchedOutline, &:hover .MuiOutlinedInput-notchedOutline, &.Mui-focused .MuiOutlinedInput-notchedOutline":
		{
			border: "none",
			borderRadius: theme.shape.borderRadiusSm,
		},
	"& .MuiSelect-icon": {
		color: theme.palette.text.primary,
		top: "calc(50% - 10px)",
		height: "20px",
		width: "20px",
	},
	"& .MuiSelect-select": {
		padding: theme.spacing(1),
	},
})) as unknown as typeof Select;

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
	}, [room]);

	// create a listener to process messages from the room
	useEffect(() => {
		// ignore if not initialized
		if (!room || room.isInitialized) {
			return;
		}

		const handleMessage = async (
			event: MessageEvent<{ data: Record<string, unknown> }>,
		) => {
			try {
				console.log("PROCESS EVENT", event);
			} catch {
				// noop
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, []);

	if (!room || !room.isInitialized) {
		return <LoadingScreen.Trigger />;
	}

	return (
		<StyledPage direction={"column"} spacing={3}>
			<Stack
				direction={"row"}
				padding={1}
				alignItems={"center"}
				spacing={1}
				width={"100%"}
			>
				<Stack direction={"row"} alignItems={"center"} spacing={1}>
					<AccessTimeOutlined fontSize="medium" />
					<Typography variant={"body2"}>
						{room?.metadata?.dateCreated}
					</Typography>
				</Stack>
				<Typography
					variant={"body2"}
					noWrap={true}
					sx={{
						flex: 1,
						textAlign: "center",
						textOverflow: "hidden",
					}}
				>
					{room?.metadata?.name}
				</Typography>
				<Stack direction={"row"} alignItems={"center"} spacing={1}>
					<Tooltip title="Download Chat History">
						<IconButton
							size="small"
							color={"default"}
							onClick={(e) => {
								// stop the event propagation
								e.stopPropagation();

								room?.downloadHistory();
							}}
						>
							<DownloadRounded fontSize="small" />
						</IconButton>
					</Tooltip>
					<Tooltip title="Toggle Chat Controls">
						<IconButton
							size="small"
							color={
								room.sidebar.isOpen &&
								room.sidebar.type === "OPTIONS"
									? "primary"
									: "default"
							}
							onClick={() => {
								// toggle open / closed based on the state
								if (
									room.sidebar.isOpen &&
									room.sidebar.type === "OPTIONS"
								) {
									room.closeSidebar();
								} else {
									room.openSidebar("OPTIONS");
								}
							}}
						>
							<MoreVertRounded fontSize="small" />
						</IconButton>
					</Tooltip>
				</Stack>
			</Stack>
			<Stack
				flex={1}
				direction={"row"}
				width={"100%"}
				spacing={3}
				overflow={"hidden"}
			>
				<StyledContent
					direction={"column"}
					spacing={0}
					flex={1}
					alignItems={"center"}
				>
					<StyledScroll>
						<Container maxWidth="md">
							<Stack direction={"column"} spacing={3}>
								{room.history.map((m) => (
									<RoomMessage
										key={m.id}
										room={room}
										message={m}
									/>
								))}
							</Stack>
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
									minRows={1}
									maxRows={6}
									actions={
										<>
											{ENABLE_MODEL_SELECT ? (
												<StyledSelect
													size="small"
													placeholder="Select a Model"
													value={room.modelId}
													onChange={(e) => {
														console.log(e);
													}}
												>
													{chat.models.options.map(
														(m) => (
															<Select.Item
																key={m.app_id}
																value={m.app_id}
															>
																<Tooltip
																	title={`Open new room with ${m.app_name}`}
																	placement="top"
																>
																	<span>
																		{
																			m.app_name
																		}
																	</span>
																</Tooltip>
															</Select.Item>
														),
													)}
												</StyledSelect>
											) : null}
											<Stack flex={1} />
											<OptionsPicker
												options={room.options}
												setOptions={(o) =>
													room.setOptions({
														...room.options,
														...o,
													})
												}
												anchorOrigin={{
													vertical: "top",
													horizontal: "center",
												}}
												transformOrigin={{
													vertical: "bottom",
													horizontal: "center",
												}}
											/>
										</>
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
						defaultSize={{
							width:
								room.sidebar.type === "ARTIFACTS" ? 600 : 360,
							height: "100%",
						}}
						minWidth={280}
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
							// paddingTop: '8px',
							paddingRight: "8px",
							paddingBottom: "8px",
						}}
					>
						{room.sidebar.type === "OPTIONS" && (
							<OptionsMenu
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
