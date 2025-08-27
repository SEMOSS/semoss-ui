import {
	ChevronLeftOutlined,
	ChevronRightOutlined,
	CopyAllOutlined,
	ThumbDownOffAltOutlined,
	ThumbUpAltOutlined,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import {
	Button,
	Chip,
	Divider,
	IconButton,
	Markdown,
	Stack,
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

const StyledAgentResponse = styled(Stack)(({ theme }) => ({
	paddingLeft: theme.spacing(2),
	paddingRight: theme.spacing(2),
}));

const StyledHover = styled("div")(() => ({
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
			<StyledAgentResponse direction={"column"} spacing={1}>
				{message.text ? <Markdown>{message.text}</Markdown> : null}

				{message.tools.map((t) => (
					<ResponseMessageTool
						key={t.id}
						room={room}
						message={message}
						tool={t}
					/>
				))}

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

				<StyledHover>
					<div>
						<Divider />
						<Stack
							direction={"row"}
							alignItems={"center"}
							justifyContent={"space-between"}
						>
							<Stack direction={"row"} alignItems={"center"}>
								{inputMessage && (
									<Button
										variant="text"
										size="small"
										color="inherit"
										onClick={() => rewriteMessage()}
									>
										Rewrite
									</Button>
								)}
								{inputMessage?.siblings.length > 1 && (
									<>
										<IconButton
											size="small"
											disabled={
												!inputMessage.previousSibling
											}
											onClick={() => {
												if (
													!inputMessage.previousSibling
												) {
													return;
												}

												inputMessage.previousSibling.activateMessage();
											}}
										>
											<ChevronLeftOutlined fontSize="small" />
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
											<ChevronRightOutlined fontSize="small" />
										</IconButton>
									</>
								)}
							</Stack>
							<Stack
								direction={"row"}
								alignItems={"center"}
								spacing={1}
							>
								<IconButton
									size="small"
									onClick={() => {
										recordFeedback(false);
									}}
								>
									<ThumbDownOffAltOutlined fontSize="small" />
								</IconButton>
								<IconButton
									size="small"
									onClick={() => {
										recordFeedback(true);
									}}
								>
									<ThumbUpAltOutlined fontSize="small" />
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
									<CopyAllOutlined fontSize="small" />
								</IconButton>
							</Stack>
						</Stack>
					</div>
				</StyledHover>
			</StyledAgentResponse>
		);
	},
);
