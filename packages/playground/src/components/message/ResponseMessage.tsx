import {
	ChevronLeftOutlined,
	ChevronRightOutlined,
	CopyAllOutlined,
	RefreshOutlined,
	SouthEastOutlined,
	ThumbDownOffAltOutlined,
	ThumbUpAltOutlined,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import {
	Chip,
	IconButton,
	Markdown,
	Stack,
	Stepper,
	styled,
	Typography,
	useNotification,
} from "@semoss/ui";
import {
	InputMessageStore,
	type ResponseMessageStore,
	type RoomStore,
} from "@/stores";
import { ResponseMessageTool } from "./ResponseMessageTool";

const StyledResponseMessage = styled(Stack)(({ theme }) => ({
	width: "100%",
	padding: "8px 16px",
	background: theme.palette.background.paper,
	borderRadius: theme.shape.borderRadius,
	boxShadow: theme.shadows[1],
}));

const StyledHover = styled("div")(() => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "flex-end",
	flex: 1,
	opacity: 0,
	width: "100%",
	"&:hover": {
		opacity: 1,
	},
}));

interface ResponseMessageProps {
	/** Room to render */
	room: RoomStore;

	/** Message to render */
	message: ResponseMessageStore;
}

export const ResponseMessage: React.FC<ResponseMessageProps> = observer(
	({ room, message }) => {
		const notification = useNotification();

		// get the parent input message
		let inputMessage: InputMessageStore | null = null;
		if (message.parent instanceof InputMessageStore) {
			inputMessage = message.parent;
		}

		/**
		 * Copy the text
		 * @param text - text to copy
		 */
		const copyMessage = (text: string) => {
			try {
				navigator.clipboard.writeText(text);

				notification.add({
					color: "success",
					message: "Successfully copied to clipboard",
				});
			} catch (e) {
				notification.add({
					color: "error",
					message: e.message,
				});
			}
		};

		/**
		 * Copy the text
		 * @param text - text to copy
		 */
		const recordFeedback = async (rating: boolean) => {
			try {
				await room.recordFeedback(message, rating);

				notification.add({
					color: "success",
					message: "Successfully saved feedback",
				});
			} catch (e) {
				notification.add({
					color: "error",
					message: e.message,
				});
			}
		};

		/**
		 * Copy the text
		 * @param text - text to copy
		 */
		const rewriteMessage = async () => {
			try {
				if (!inputMessage) {
					return;
				}

				await room.rewriteMessage(message);

				notification.add({
					color: "success",
					message: "Successfully rewrote message",
				});
			} catch (e) {
				notification.add({
					color: "error",
					message: e.message,
				});
			}
		};

		return (
			<StyledResponseMessage direction={"column"} spacing={2}>
				<Stack direction="row" alignItems={"center"} spacing={1}>
					<Typography variant="caption">Response</Typography>
					<SouthEastOutlined
						sx={{ color: "#757575", fontSize: "1rem" }}
					/>
					<StyledHover>
						<Stack
							direction={"row"}
							alignItems={"center"}
							spacing={1}
						>
							{inputMessage?.siblings.length > 1 && (
								<>
									<IconButton
										size="small"
										disabled={!inputMessage.previousSibling}
										onClick={() => {
											if (!inputMessage.previousSibling) {
												return;
											}

											inputMessage.previousSibling.activateMessage();
										}}
									>
										<ChevronLeftOutlined fontSize="inherit" />
									</IconButton>
									<Typography variant="caption">
										{inputMessage.position + 1}/
										{inputMessage.siblings.length}
									</Typography>
									<IconButton
										size="small"
										disabled={!inputMessage.nextSibling}
										onClick={() => {
											if (!inputMessage.nextSibling) {
												return;
											}

											inputMessage.nextSibling.activateMessage();
										}}
									>
										<ChevronRightOutlined fontSize="inherit" />
									</IconButton>
								</>
							)}

							{inputMessage && (
								<IconButton
									size="small"
									onClick={() => {
										rewriteMessage();
									}}
								>
									<RefreshOutlined fontSize="inherit" />
								</IconButton>
							)}

							<IconButton
								size="small"
								onClick={() => {
									recordFeedback(true);
								}}
							>
								<ThumbUpAltOutlined fontSize="inherit" />
							</IconButton>

							<IconButton
								size="small"
								onClick={() => {
									recordFeedback(false);
								}}
							>
								<ThumbDownOffAltOutlined fontSize="inherit" />
							</IconButton>

							<IconButton
								size="small"
								disabled={!message.text}
								onClick={() => {
									if (!message.text) {
										return;
									}

									copyMessage(message.text);
								}}
							>
								<CopyAllOutlined fontSize="inherit" />
							</IconButton>
						</Stack>
					</StyledHover>
				</Stack>
				{message.text ? <Markdown>{message.text}</Markdown> : null}
				{message.tools.length > 0 && (
					<Stepper orientation="vertical">
						{message.tools.map((t) => (
							<Stepper.Step
								key={t.id}
								active={true}
								completed={!!t.response}
							>
								<Stepper.StepLabel
									StepIconProps={{
										icon: "",
									}}
									sx={{ alignItems: "flex-start" }}
								>
									<ResponseMessageTool
										key={`tool-${t.id}`}
										room={room}
										message={message}
										tool={t}
									/>
								</Stepper.StepLabel>
							</Stepper.Step>
						))}
					</Stepper>
				)}
				{message.sources.length > 0 ? (
					<Stack direction={"row"} spacing={1} flexWrap={"wrap"}>
						{message.sources.map((s, sIdx) => {
							return (
								// biome-ignore lint/suspicious/noArrayIndexKey: Array of sources is returned
								<Chip key={sIdx} label={s} color={"default"} />
							);
						})}
					</Stack>
				) : null}
			</StyledResponseMessage>
		);
	},
);
