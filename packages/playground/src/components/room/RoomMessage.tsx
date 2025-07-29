import {
	AppsRounded,
	CopyAllOutlined,
	ThumbDownOffAltOutlined,
	ThumbUpAltOutlined,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useInsight } from "@semoss/sdk/react";
import {
	Avatar,
	Chip,
	Divider,
	IconButton,
	Markdown,
	Stack,
	styled,
	Typography,
	useNotification,
} from "@semoss/ui";
import { ChatMessage, ChatRoom } from "@/stores";

const StyledUserMessage = styled(Stack)(({ theme }) => ({
	padding: theme.spacing(2),
	borderRadius: theme.shape.borderRadius,
	background: theme.palette.background.default,
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
	fontSize: "14px",
	fontWeight: 400,
	letterSpacing: ".1px",
	lineHeight: "48px",
	height: theme.spacing(4),
	width: theme.spacing(4),
	background: theme.palette.primary.main,
}));

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

interface RoomMessageProps {
	/** Room to render */
	room: ChatRoom;

	/** Message to render */
	message: ChatMessage;
}

export const RoomMessage: React.FC<RoomMessageProps> = observer((props) => {
	// set the get the room based on the params
	const { room, message } = props;
	const { system } = useInsight();

	const notification = useNotification();

	const loginType = Object.keys(system.config.logins)[0];
	const userName: string =
		typeof system.config.logins[loginType] === "string"
			? (system.config.logins[loginType] as unknown as string)
			: "";

	const initials: string = userName
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

	if (message.type === "USER") {
		return (
			<StyledUserMessage
				direction={"row"}
				alignItems={"flex-start"}
				spacing={1}
			>
				<StyledAvatar>{initials}</StyledAvatar>
				<Typography variant="body1" sx={{ marginTop: 0.5 }}>
					{message.content.type === "TEXT"
						? message.content.text
						: ""}
				</Typography>
			</StyledUserMessage>
		);
	}

	return (
		<StyledAgentResponse direction={"column"} spacing={1}>
			{message.content.type === "TEXT" ? (
				<Markdown>{message.content.text}</Markdown>
			) : null}

			{message.content.type === "APP" ? (
				<StyledSidebarOpen
					isSelected={
						room.sidebar.isOpen &&
						room.sidebar.options.type === "APP" &&
						room.sidebar.options.messageId === message.messageId
					}
					direction={"row"}
					alignItems={"center"}
					spacing={2}
					onClick={() => {
						if (message.content.type !== "APP") {
							return;
						}

						// toggle open / closed based on the state
						if (
							room.sidebar.isOpen &&
							room.sidebar.options.type === "APP" &&
							room.sidebar.options.messageId === message.messageId
						) {
							room.closeSidebar();
						} else {
							room.openSidebar({
								type: "APP",
								messageId: message.messageId,
								toolName: message.content.name,
								toolId: message.content.id,
								toolParameters: message.content.map,
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
							{message.content.name}
						</Typography>
						<Typography variant="caption">Click to Open</Typography>
					</Stack>
				</StyledSidebarOpen>
			) : null}
			{message.sources.length > 0 ? (
				<Stack direction={"row"} spacing={1} flexWrap={"wrap"}>
					{message.sources.map((s, sIdx) => {
						return <Chip key={sIdx} label={s} color={"default"} />;
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
						&nbsp;
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
								disabled={message.content.type !== "TEXT"}
								onClick={() => {
									if (message.content.type !== "TEXT") {
										return;
									}

									copyMessage(message.content.text);
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
});
