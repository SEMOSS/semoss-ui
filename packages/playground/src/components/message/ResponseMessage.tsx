import {
	AppsRounded,
	ChevronLeftOutlined,
	ChevronRightOutlined,
	CopyAllOutlined,
	ThumbDownOffAltOutlined,
	ThumbUpAltOutlined,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useInsight } from "@semoss/sdk/react";
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
import type { ResponseMessageStore, RoomStore } from "@/stores";

const StyledAgentResponse = styled(Stack)(({ theme }) => ({
	paddingLeft: theme.spacing(2),
	paddingRight: theme.spacing(2),
}));

const StyledSidebarOpen = styled(Stack, {
	shouldForwardProp: (prop) => prop !== "isSelected",
})<{
	isSelected: boolean;
}>(({ theme, isSelected }) => ({
	padding: theme.spacing(1),
	borderRadius: theme.shape.borderRadiusLg,
	borderWidth: "1px",
	borderStyle: "solid",
	borderColor: isSelected
		? theme.palette.primary.main
		: theme.palette.secondary.border,
	cursor: "pointer",
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
		const { system } = useInsight();

		const notification = useNotification();

		const loginType = Object.keys(system.config.logins)[0];
		const userName: string =
			typeof system.config.logins[loginType] === "string"
				? (system.config.logins[loginType] as unknown as string)
				: "";

		const _initials: string = userName
			.match(/(\b\S)?/g)
			.join("")
			.match(/(^\S|\S$)?/g)
			.join("")
			.toUpperCase();

		/**
		 * Copy the text
		 * @param text - text to copy
		 */
		const copyMessage = (text: string) => {
			try {
				navigator.clipboard.writeText(text);

				notification.add({
					color: "success",
					message: "Succesfully copied to clipboard",
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
					message: "Succesfully saved feedback",
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
				await room.rewriteMessage(message);

				notification.add({
					color: "success",
					message: "Succesfully rewrote message",
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
					<StyledSidebarOpen
						key={t.id}
						isSelected={
							room.sidebar.isOpen &&
							room.sidebar.options.type === "APP" &&
							room.sidebar.options.messageId === message.id
						}
						direction={"row"}
						alignItems={"center"}
						spacing={2}
						onClick={() => {
							// toggle open / closed based on the state
							if (
								room.sidebar.isOpen &&
								room.sidebar.options.type === "APP" &&
								room.sidebar.options.messageId === message.id
							) {
								room.closeSidebar();
							} else {
								room.openSidebar({
									type: "APP",
									messageId: message.id,
									toolName: t.name,
									toolId: t.id,
									toolParameters: t.parameters,
								});
							}
						}}
					>
						<AppsRounded fontSize="medium" />
						<Stack direction={"column"} spacing={1} flex={1}>
							<Typography
								variant="subtitle2"
								sx={{
									textOverflow: "ellipsis",
								}}
							>
								{t.name}
							</Typography>
							<Typography variant="caption">
								Click to Open
							</Typography>
						</Stack>
					</StyledSidebarOpen>
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
								<Button
									variant="text"
									size="small"
									color="inherit"
									onClick={() => rewriteMessage()}
								>
									Rewrite
								</Button>
								{message.siblings.length > 1 && (
									<>
										<IconButton
											size="small"
											disabled={!message.previousSibling}
											onClick={() => {
												if (!message.previousSibling) {
													return;
												}

												message.previousSibling.activateMessage();
											}}
										>
											<ChevronLeftOutlined fontSize="small" />
										</IconButton>
										<Typography variant="caption">
											{message.position + 1}/
											{message.siblings.length}
										</Typography>
										<IconButton
											size="small"
											disabled={!message.nextSibling}
											onClick={() => {
												if (!message.nextSibling) {
													return;
												}

												message.nextSibling.activateMessage();
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
