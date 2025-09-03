import {
	AddCircleOutlineOutlined,
	ArrowCircleLeftOutlined,
	LogoutRounded,
	MenuOutlined,
	PublicOutlined,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import {
	Avatar,
	Drawer,
	IconButton,
	List,
	Stack,
	styled,
	Typography,
	useNotification,
} from "@semoss/ui";
import LOGO_FULL from "@/assets/img/logo_full.svg";
import { useCacheState, useChat } from "@/hooks";
import { SidebarLink } from "./SidebarLink";
import { SidebarRoom } from "./SidebarRoom";

const APP_NAME = import.meta.env.VITE_APP_NAME
	? import.meta.env.VITE_APP_NAME
	: "";
const LOGO_FULL_PATH = import.meta.env.VITE_LOGO_FULL_PATH
	? import.meta.env.VITE_LOGO_FULL_PATH
	: "";
const ENABLE_DISCOVER = import.meta.env.VITE_ENABLE_DISCOVER === "true";

const DRAWER_OPEN_WIDTH = 320;

const StyledAvatar = styled(Avatar)(({ theme }) => ({
	height: "24px",
	width: "24px",
	background: theme.palette.primary.main,
}));

const StyledActions = styled(Stack)(() => ({
	height: "100%",
	padding: "16px 0 16px 16px",
	position: "relative",
	zIndex: 0,
}));

const StyledActionsItem = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	borderRadius: theme.shape.borderRadius,
	border: `1px solid ${theme.palette.secondary.border}`,
}));

const StyledSidebar = styled(Drawer)(({ theme }) => ({
	flexShrink: 0,
	whiteSpace: "nowrap",
	boxSizing: "border-box",
	"& .MuiDrawer-paper": {
		width: DRAWER_OPEN_WIDTH,
		borderRadius: "0px",
		boxShadow: "none",
		border: "none",
		gap: "8px",
	},
	variants: [
		{
			props: ({ variant }) => variant === "permanent",
			style: {
				width: DRAWER_OPEN_WIDTH,
				"& .MuiDrawer-paper": {
					// backgroundColor: "transparent",
					borderRadius: theme.shape.borderRadius,
					boxShadow: "4px 0 4px 0 rgba(0, 0, 0, 0.05);",
					// border: `1px solid ${theme.palette.secondary.border}`,
				},
			},
		},
	],
}));

const StyledNavHeaderLink = styled(Link)(({ theme }) => ({
	flex: 1,
	display: "flex",
	alignItems: "center",
	color: "inherit",
	textDecoration: "none",
	cursor: "pointer",
	gap: "8px",
	padding: "8px 0",
	"&:hover": {
		background: theme.palette.action.hover,
	},
}));

const StyledNavIcon = styled(IconButton)(() => ({
	padding: "4px",
}));

const StyledSidebarHeader = styled(Stack)(({ theme }) => ({
	padding: "4px 16px",
	borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledArrowCircleLeftOutlined = styled(ArrowCircleLeftOutlined)(
	({ theme }) => ({
		color: theme.palette.secondary.dark,
	}),
);

const StyledSidebarContent = styled(Stack)(({ theme }) => ({
	height: "100%",
	width: "100%",
	flex: 1,
	padding: "8px 4px",
	borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledList = styled(List)(() => ({
	position: "relative",
	flex: "1",
	width: "100%",
	overflowY: "auto",
	overflowX: "hidden",
	padding: 0,
}));

const StyledSidebarFooter = styled(Stack)(() => ({
	padding: "4px 0",
}));

const StyledLogoutItem = styled(List.Item)(({ theme }) => ({
	gap: "16px",
	borderRadius: theme.shape.borderRadiusSm,

	"& * [data-onhover]": {
		visibility: "hidden",
	},

	"&:hover * [data-onhover]": {
		visibility: "visible",
	},
}));

export const Sidebar = observer(() => {
	const { chat } = useChat();
	const { system, actions } = useInsight();

	const notification = useNotification();

	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [isPinned, setIsPinned] = useCacheState<boolean>(
		false,
		"sidebar--isPinned",
	);

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

	return (
		<>
			{!isPinned && (
				<StyledActions
					direction={"column"}
					alignItems={"center"}
					spacing={2}
				>
					<StyledActionsItem>
						<IconButton
							onClick={() => setIsOpen(true)}
							size="small"
						>
							<MenuOutlined fontSize="medium" />
						</IconButton>
					</StyledActionsItem>
				</StyledActions>
			)}

			<StyledSidebar
				variant={isPinned ? "permanent" : "temporary"}
				open={isOpen}
				onClose={() => setIsOpen(false)}
				PaperProps={{
					onMouseLeave: () => {
						// closes if it is not pinned
						if (isPinned) {
							return;
						}

						setIsOpen(false);
					},
				}}
			>
				<StyledSidebarHeader
					direction={"row"}
					alignItems={"center"}
					justifyContent={"space-between"}
					spacing={1}
				>
					<StyledNavHeaderLink to={"/"} aria-label={"Go Home"}>
						{LOGO_FULL_PATH ? (
							<img src={LOGO_FULL_PATH} aria-label={APP_NAME} />
						) : (
							<img src={LOGO_FULL} aria-label={APP_NAME} />
						)}
					</StyledNavHeaderLink>
					<StyledNavIcon
						size="medium"
						onClick={() => {
							if (!isPinned) {
								// if it is open and not pinned, pin it
								setIsPinned(true);
							} else if (isPinned) {
								// if it is open, and pinned, close and unpin
								setIsPinned(false);
								setIsOpen(false);
							} else {
								// noop
							}
						}}
					>
						<StyledArrowCircleLeftOutlined fontSize="medium" />
					</StyledNavIcon>
				</StyledSidebarHeader>
				<StyledSidebarContent
					direction={"column"}
					spacing={3}
					overflow={"hidden"}
				>
					<Stack
						direction="column"
						alignItems={"flex-start"}
						flexShrink={0}
						spacing={0}
						overflow={"hidden"}
					>
						<SidebarLink
							name={"New Chat"}
							icon={<AddCircleOutlineOutlined color="inherit" />}
							path={"/new"}
						/>

						{ENABLE_DISCOVER && (
							<SidebarLink
								name={"Discover"}
								icon={<PublicOutlined color="inherit" />}
								path={"/discover"}
							/>
						)}
					</Stack>
					<Stack
						flex={1}
						direction="column"
						alignItems={"flex-start"}
						flexShrink={0}
						spacing={0}
						overflow={"hidden"}
					>
						<List.Item>
							<List.ItemText
								primary={"Recents"}
								primaryTypographyProps={{
									color: "text.secondary",
								}}
							/>
						</List.Item>
						<StyledList dense={true} aria-label="open chat rooms">
							{chat.order.map((roomId) => {
								return (
									<SidebarRoom key={roomId} roomId={roomId} />
								);
							})}
						</StyledList>
					</Stack>
				</StyledSidebarContent>
				<StyledSidebarFooter>
					<StyledLogoutItem
						secondaryAction={
							<IconButton
								size="small"
								data-onhover
								onClick={async () => {
									try {
										await actions.logout();
									} catch {
										notification.add({
											color: "error",
											message: "Error Logging Out",
										});
									}
								}}
							>
								<LogoutRounded fontSize="small" />
							</IconButton>
						}
					>
						<List.Icon sx={{ minWidth: "auto" }}>
							<StyledAvatar variant="circular">
								<Typography variant="body3">
									{initials}
								</Typography>
							</StyledAvatar>
						</List.Icon>
						<List.ItemText
							primary={userName}
							primaryTypographyProps={{
								color: "body1",
							}}
						/>
					</StyledLogoutItem>
				</StyledSidebarFooter>
			</StyledSidebar>
		</>
	);
});
