import { Notifications, Search as SearchIcon } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk";
import {
	Container,
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
	gap: 0,
	padding: theme.spacing(0, 4),
}));

const StyledLeft = styled(Stack)({
	minWidth: 0,
});

const StyledContainer = styled(Container)({
	maxWidth: "720px",
});

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

	useEffect(() => {
		async function poll() {
			try {
				const pixel = `PollNotifications()`;
				const res = await runPixel(pixel);
				const num = res.pixelReturn[0].output;
				setHasUnread(num as number);
			} catch (e) {
				console.error("Pixel call failed:", e);
			}
		}

		poll(); // initial call
		const pollInterval = setInterval(poll, 60000); // every 1 min

		return () => {
			clearInterval(pollInterval);
		};
	}, []);

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
				id={"navbar--left"}
				direction="row"
				alignItems={"center"}
				justifyContent={"flex-start"}
				spacing={1}
				flex={"1 1 0"}
			></StyledLeft>
			<StyledContainer maxWidth={false}>
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
			<Stack
				id={"navbar--right"}
				direction="row"
				alignItems={"center"}
				justifyContent={"flex-end"}
				spacing={1}
				flex={"1 1 0"}
			>
				{configStore?.config?.notificationEnabled && (
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
			</Stack>
		</StyledNavbar>
	);
});
