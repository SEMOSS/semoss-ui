import { Notifications, Search as SearchIcon } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk";
import {
	IconButton,
	InputAdornment,
	Stack,
	styled,
	TextField,
} from "@semoss/ui";
import { Badge } from "@semoss/ui/next";
import { usePage, useRootStore } from "@/hooks";
import { NotificationDrawer } from "../notifications/notification-drawer";
import { PlatformSearch } from "./platform-search";

const SIDEBAR_WIDTH = "18rem";

const StyledNavbar = styled("div")(({ theme }) => ({
	position: "absolute",
	top: "0",
	height: theme.spacing(7),
	width: "100%",
	borderBottom: "1px solid #EAEAEE",
	background: theme.palette.background.default,
	color: theme.palette.text.primary,
	display: "flex",
	flexDirection: "row",
	alignItems: "center",
	justifyContent: "space-between",
	gap: theme.spacing(2),
	padding: theme.spacing(0, 4),
	[theme.breakpoints.down("md")]: {
		gap: theme.spacing(1.5),
		padding: theme.spacing(0, 2),
	},
	[theme.breakpoints.down("sm")]: {
		gap: theme.spacing(1),
		padding: theme.spacing(0, 1),
	},
}));

const StyledLeft = styled(Stack, {
	shouldForwardProp: (prop) => prop !== "$sidebarOverlayOpen",
})<{ $sidebarOverlayOpen: boolean }>(({ theme, $sidebarOverlayOpen }) => ({
	minWidth: theme.spacing(6),
	overflow: "hidden",
	marginLeft: $sidebarOverlayOpen ? SIDEBAR_WIDTH : 0,
	transition: "margin-left 180ms ease",
}));

const StyledRight = styled(Stack)(({ theme }) => ({
	minWidth: theme.spacing(6),
}));

const StyledContainer = styled("div")(({ theme }) => ({
	flex: "0 1 auto",
	flexBasis: "clamp(220px, 44vw, 640px)",
	minWidth: 0,
	width: "100%",
	maxWidth: "640px",
	[theme.breakpoints.down("md")]: {
		flexBasis: "clamp(180px, 42vw, 520px)",
		maxWidth: "520px",
	},
	[theme.breakpoints.down("sm")]: {
		flexBasis: "clamp(120px, 50vw, 320px)",
		maxWidth: "320px",
	},
}));

const StyledTextField = styled(TextField)(() => ({
	width: "100%",
	display: "flex",
	flexDirection: "column",
	alignItems: "stretch",
	alignSelf: "center",
	"& .MuiOutlinedInput-root": {
		padding: "0px 12px",
		borderRadius: "8px",
	},
	"& .MuiOutlinedInput-root > input": {
		paddingLeft: "0px",
		paddingRight: "0px",
	},
}));

export const Navbar: React.FC = observer(() => {
	const { page } = usePage();
	const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
	const [hasUnread, setHasUnread] = useState<number>(0);
	const { configStore } = useRootStore();
	const sidebarOverlayOpen = page.sidebar.open && !page.sidebar.pinned;
	const notificationsEnabled = configStore?.config?.notificationEnabled;

	useEffect(() => {
		if (!notificationsEnabled) {
			setHasUnread(0);
			return;
		}

		let isActive = true;

		async function poll() {
			try {
				const pixel = `PollNotifications()`;
				const res = await runPixel(pixel);
				const num = res.pixelReturn[0].output;
				if (isActive) {
					setHasUnread(num as number);
				}
			} catch (e) {
				console.error("Pixel call failed:", e);
			}
		}

		poll(); // initial call
		const pollInterval = setInterval(() => {
			poll();
		}, 60000); // every 1 min

		return () => {
			isActive = false;
			clearInterval(pollInterval);
		};
	}, [notificationsEnabled]);

	const handleBellClick = () => {
		setDrawerOpen(true);
		setHasUnread(0);
	};

	const NotificationIcon = styled(Notifications)(({ theme }) => ({
		color: theme.palette.secondary.dark,
	}));

	return (
		<StyledNavbar ref={(n) => page.setNavbarElement(n)}>
			<StyledLeft
				$sidebarOverlayOpen={sidebarOverlayOpen}
				id={"navbar--left"}
				direction="row"
				alignItems={"center"}
				justifyContent={"flex-start"}
				spacing={1}
				flex={"1 1 0"}
			></StyledLeft>
			<StyledContainer>
				{page.navbar?.search ? (
					<PlatformSearch
						renderInput={(params) => (
							<StyledTextField
								{...params}
								variant="outlined"
								size="small"
								placeholder="Search"
								label=""
								InputProps={{
									...params.InputProps,
									startAdornment: (
										<InputAdornment position="start">
											<SearchIcon />
										</InputAdornment>
									),
								}}
							/>
						)}
					/>
				) : (
					<>&nbsp;</>
				)}
			</StyledContainer>
			<StyledRight
				id={"navbar--right"}
				direction="row"
				alignItems={"center"}
				justifyContent={"flex-end"}
				spacing={1}
				flex={"1 1 0"}
			>
				{notificationsEnabled && (
					<>
						<IconButton onClick={handleBellClick} color="secondary">
							<NotificationIcon />
							{typeof hasUnread === "number" && hasUnread > 0 && (
								<Badge
									variant="destructive"
									className="-right-[0.5px] -top-[0.5px] absolute flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px]"
								>
									{hasUnread > 9 ? "9+" : hasUnread}
								</Badge>
							)}
						</IconButton>
						<NotificationDrawer
							open={drawerOpen}
							onClose={() => setDrawerOpen(false)}
							data-testid="notification-drawer"
						/>
					</>
				)}
			</StyledRight>
		</StyledNavbar>
	);
});
