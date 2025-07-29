import {
	AccessTimeOutlined,
	DownloadRounded,
	TuneRounded,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { Resizable } from "re-resizable";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
	CircularProgress,
	Container,
	IconButton,
	Select,
	Stack,
	styled,
	Tooltip,
	Typography,
	useNotification,
} from "@semoss/ui";
import {
	OptionsPicker,
	RoomApp,
	RoomControls,
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
	flexDirection: "column-reverse",
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
	}, [room, notification.add, navigate]);

	if (!room || !room.isInitialized) {
		return (
			<StyledPage
				direction={"column"}
				alignItems={"center"}
				justifyContent={"center"}
			>
				<CircularProgress color={"primary"} />;
			</StyledPage>
		);
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
					<Tooltip title="Toggle Chat History">
						<IconButton
							size="small"
							color={
								room.sidebar.isOpen &&
								room.sidebar.options.type === "CONTROLS"
									? "primary"
									: "default"
							}
							onClick={() => {
								// toggle open / closed based on the state
								if (
									room.sidebar.isOpen &&
									room.sidebar.options.type === "CONTROLS"
								) {
									room.closeSidebar();
								} else {
									room.openSidebar({
										type: "CONTROLS",
									});
								}
							}}
						>
							<TuneRounded fontSize="small" />
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
								{room.history.map((m, mIdx) => {
									return (
										<RoomMessage
											room={room}
											message={m}
											key={mIdx}
										/>
									);
								})}
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
								room.sidebar.options.type === "APP" ? 600 : 360,
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
						{room.sidebar.options.type === "CONTROLS" && (
							<RoomControls room={room} />
						)}
						{room.sidebar.options.type === "APP" && (
							<RoomApp room={room} />
						)}
					</Resizable>
				)}
			</Stack>
		</StyledPage>
	);
});
