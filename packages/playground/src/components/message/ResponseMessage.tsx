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
	IconButton,
	Markdown,
	Stack,
	Stepper,
	styled,
	Typography,
	useNotification,
} from "@semoss/ui";
import { InputMessageStore, type ResponseMessageStore } from "@/stores";

const StyledResponseMessage = styled(Stack)(({ theme }) => ({
	width: "100%",
	padding: "8px 16px",
	background: theme.palette.background.paper,
	borderRadius: theme.shape.borderRadius,
	boxShadow: theme.shadows[1],
}));

const StyledHover = styled(Stack)(() => ({
	'& [data-hover="true"]': {
		opacity: 0,
	},
	"&:hover [data-hover='true']": {
		opacity: 1,
	},
}));

interface ResponseMessageProps {
	/** Message to render */
	message: ResponseMessageStore;
}

export const ResponseMessage: React.FC<ResponseMessageProps> = observer(
	({ message }) => {
		const notification = useNotification();

		// Filter tools that have a non-empty SMSS_PROJECT_ID in their _meta.map
		const projectTools = message.tools.filter((t) => {
			const id = (t as any)?._meta?.map?.SMSS_PROJECT_ID;
			return typeof id === "string" && id.trim().length > 0;
		});

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
		 * Record the feedback
		 * @param rating - positive or negative
		 */
		const recordFeedback = async (rating: boolean) => {
			try {
				await message.recordFeedback(rating);

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
				await message.rewriteMessage();

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
				<StyledHover direction="row" alignItems={"center"} spacing={1}>
					<Typography variant="caption">Response</Typography>
					<SouthEastOutlined
						sx={{ color: "#757575", fontSize: "1rem" }}
					/>
					<Stack
						flex={1}
						direction={"row"}
						alignItems={"center"}
						justifyContent={"flex-end"}
						spacing={1}
						data-hover={true}
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
				{message.text ? <Markdown>{message.text}</Markdown> : null}
			</StyledResponseMessage>
		);
	},
);
