import {
	Add,
	MenuOpenRounded,
	MenuRounded,
	MoreVertOutlined,
	PublicOutlined,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import {
	Avatar,
	Button,
	Drawer,
	IconButton,
	List,
	Menu,
	Stack,
	styled,
	Typography,
} from "@semoss/ui";
import LOGO from "@/assets/img/logo.svg";
import LOGO_FULL from "@/assets/img/logo_full.svg";
import { useCacheState, useChat } from "@/hooks";
import { SidebarItem } from "./SidebarItem";

const APP_NAME = import.meta.env.VITE_APP_NAME
	? import.meta.env.VITE_APP_NAME
	: "";
const LOGO_PATH = import.meta.env.VITE_LOGO_PATH
	? import.meta.env.VITE_LOGO_PATH
	: "";
const LOGO_FULL_PATH = import.meta.env.VITE_LOGO_FULL_PATH
	? import.meta.env.VITE_LOGO_FULL_PATH
	: "";

const DRAWER_OPEN_WIDTH = 320;

const StyledAvatar = styled(Avatar)(({ theme }) => ({
	fontSize: "14px",
	fontWeight: 400,
	letterSpacing: ".1px",
	lineHeight: "48px",
	height: theme.spacing(4),
	width: theme.spacing(4),
	background: theme.palette.primary.main,
}));

const StyledButton = styled(Button)(({ theme }) => ({
	height: theme.spacing(6),
	color: theme.palette.text.primary,
	background: theme.palette.background.paper,
	borderWidth: "1px",
	borderStyle: "solid",
	borderColor: theme.palette.secondary.border,
	borderRadius: theme.shape.borderRadiusLg,
})) as unknown as typeof Button;

const StyledActions = styled(Stack)(({ theme }) => ({
	height: "100%",
	position: "relative",
	background: "transparent",
	paddingTop: theme.spacing(3),
	paddingRight: theme.spacing(2),
	paddingBottom: theme.spacing(3),
	paddingLeft: theme.spacing(3),
	zIndex: 0,
}));

const StyledSidebar = styled(Drawer)(() => ({
	flexShrink: 0,
	whiteSpace: "nowrap",
	boxSizing: "border-box",
	"& .MuiDrawer-paper": {
		width: DRAWER_OPEN_WIDTH,
		borderRadius: "0px",
		boxShadow: "none",
		border: "none",
	},
	variants: [
		{
			props: ({ variant }) => variant === "permanent",
			style: {
				width: DRAWER_OPEN_WIDTH,
				"& .MuiDrawer-paper": {
					backgroundColor: "transparent",
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
	gap: theme.spacing(1),
	"&:hover": {
		background: theme.palette.action.hover,
	},
}));

const StyledSidebarHeader = styled(Stack)(({ theme }) => ({
	paddingTop: theme.spacing(3),
	paddingRight: theme.spacing(2),
	paddingLeft: theme.spacing(2),
}));

const StyledMenuOpenRounded = styled(MenuOpenRounded)(({ theme }) => ({
	color: theme.palette.text.primary,
}));

const StyledSidebarContent = styled(Stack)(({ theme }) => ({
	height: "100%",
	width: "100%",
	flex: 1,
	paddingTop: theme.spacing(2),
	paddingRight: theme.spacing(2),
	paddingBottom: theme.spacing(3),
	paddingLeft: theme.spacing(2),
}));

const StyledList = styled(List)(() => ({
	flex: "1",
	height: "100%",
	overflowY: "auto",
	overflowX: "hidden",
	padding: 0,
}));

const StyledListItem = styled(List.Item)(({ theme }) => ({
	gap: theme.spacing(1),
	padding: theme.spacing(1),
}));

const _StyledListItemButton = styled(List.ItemButton)(({ theme }) => ({
	flexGrow: "0",
	gap: theme.spacing(1),
	padding: theme.spacing(1),
})) as unknown as typeof List.ItemButton;

const _StyledListItemIcon = styled(List.Icon)(() => ({
	width: "28px",
	minWidth: "auto",
}));

const StyledLink = styled(Link)(({ theme }) => ({
	color: "inherit",
	textDecoration: "none",
	cursor: "pointer",
}));

const _StyledPublicOutlined = styled(PublicOutlined)(({ theme }) => ({
	color: theme.palette.text.primary,
}));

const StyledMoreVertOutlined = styled(MoreVertOutlined)(({ theme }) => ({
	color: theme.palette.text.primary,
}));

export const Sidebar = observer(() => {
	const { chat } = useChat();
	const { system, actions } = useInsight();

	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [isPinned, setIsPinned] = useCacheState<boolean>(
		false,
		"sidebar--isPinned",
	);
	const [settingsMenuAnchorEle, setSettingsMenuAnchorEle] =
		React.useState<null | HTMLElement>(null);
	const isSettingsMenuOpen = Boolean(settingsMenuAnchorEle);

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
	 * Logout of the application
	 */
	const logout = async () => {
		try {
			await actions.logout();

			setSettingsMenuAnchorEle(null);
		} catch (_e) {}
	};

	return (
		<>
			{!isPinned && (
				<StyledActions
					direction={"column"}
					alignItems={"center"}
					onMouseOver={() => setIsOpen(true)}
					spacing={2}
				>
					{LOGO_PATH ? (
						<img src={LOGO_PATH} aria-label={APP_NAME} />
					) : (
						<img src={LOGO} aria-label={APP_NAME} />
					)}
					<Stack flex={1}>&nbsp;</Stack>
					<StyledAvatar>{initials}</StyledAvatar>
					<IconButton onClick={() => setIsOpen(true)} size="medium">
						<MenuRounded fontSize="inherit" />
					</IconButton>
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
					justifyContent={"flex-start"}
					spacing={1}
				>
					<StyledNavHeaderLink to={"/"} aria-label={"Go Home"}>
						{LOGO_FULL_PATH ? (
							<img src={LOGO_FULL_PATH} aria-label={APP_NAME} />
						) : (
							<img src={LOGO_FULL} aria-label={APP_NAME} />
						)}
					</StyledNavHeaderLink>
					<IconButton
						size="small"
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
						<StyledMenuOpenRounded fontSize="medium" />
					</IconButton>
				</StyledSidebarHeader>
				<StyledSidebarContent
					direction={"column"}
					spacing={2}
					overflow={"hidden"}
				>
					<StyledLink
						to={"/new"}
						aria-label={"New room"}
						replace={true}
					>
						<StyledButton
							variant={"text"}
							color={"primary"}
							fullWidth={true}
							startIcon={<Add />}
						>
							New Chat
						</StyledButton>
					</StyledLink>
					<StyledList dense={true} aria-label="open chat rooms">
						<Stack direction={"column"} spacing={2}>
							<StyledListItem>
								<List.ItemText>Today</List.ItemText>
							</StyledListItem>
							{chat.todayRooms.map((roomId) => {
								return (
									<SidebarItem key={roomId} roomId={roomId} />
								);
							})}
							<StyledListItem>
								<List.ItemText>Previous</List.ItemText>
							</StyledListItem>
							{chat.previousRooms.map((roomId) => {
								return (
									<SidebarItem key={roomId} roomId={roomId} />
								);
							})}
						</Stack>
					</StyledList>
					{/* <StyledLink to={'/agents'} aria-label={'Discover Agents'}>
                        <StyledListItemButton dense={true}>
                            <StyledListItemIcon>
                                <StyledPublicOutlined fontSize="medium" />
                            </StyledListItemIcon>
                            <Typography variant="subtitle2">
                                Discover
                            </Typography>
                        </StyledListItemButton>
                    </StyledLink> */}
					<Stack
						direction={"row"}
						alignItems={"center"}
						padding={1}
						spacing={2}
					>
						<Stack
							direction={"row"}
							alignItems={"center"}
							flex={1}
							spacing={1}
						>
							<StyledAvatar>{initials}</StyledAvatar>
							<Typography
								variant="subtitle2"
								sx={{
									flex: 1,
									textOverflow: "ellipsis",
								}}
							>
								{userName}
							</Typography>
						</Stack>
						<IconButton
							id="settings-control"
							aria-controls={
								isSettingsMenuOpen ? "settings-menu" : undefined
							}
							aria-label="settings"
							aria-expanded={
								isSettingsMenuOpen ? "true" : undefined
							}
							aria-haspopup="true"
							onClick={(e) => {
								setSettingsMenuAnchorEle(e.currentTarget);
							}}
						>
							<StyledMoreVertOutlined />
						</IconButton>
						<Menu
							id="settings-menu"
							// MenuListProps={{
							//     'aria-labelledby': 'long-button',
							// }}
							anchorEl={settingsMenuAnchorEle}
							open={isSettingsMenuOpen}
							onClose={() => {
								setSettingsMenuAnchorEle(null);
							}}
						>
							<Menu.Item
								onClick={() => {
									logout();
								}}
							>
								Log Out
							</Menu.Item>
						</Menu>
					</Stack>
				</StyledSidebarContent>
			</StyledSidebar>
		</>
	);
});
