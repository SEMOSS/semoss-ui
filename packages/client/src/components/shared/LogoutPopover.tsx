import { AccountCircle, Logout } from "@mui/icons-material";
import type React from "react";
import { useState } from "react";
import {
	Avatar,
	Button,
	IconButton,
	List,
	LoadingScreen,
	Popover,
	Stack,
	styled,
	Typography,
} from "@semoss/ui";
import { useRootStore } from "@/hooks";

const StyledTypography = styled(Typography)(({ theme }) => ({
	maxWidth: theme.spacing(15),
}));

interface LogoutPopoverProps {
	/** Content to popover */
	children?: React.ReactNode;
}

export const LogoutPopover: React.FC<LogoutPopoverProps> = (props) => {
	const { children } = props;

	const { configStore } = useRootStore();
	const [loggingOut, setLoggingOut] = useState(false);
	const [popoverAnchorEle, setPopoverAnchorEl] = useState<HTMLElement | null>(
		null,
	);

	// track if the popover is open
	const isPopoverOpen = Boolean(popoverAnchorEle);
	const handleClick = (e: React.MouseEvent<HTMLElement>) => {
		setPopoverAnchorEl(e.currentTarget);
	};

	const handleLogout = async () => {
		try {
			setLoggingOut(true);
			await configStore.logout();
			setPopoverAnchorEl(null);
		} catch (error) {
			console.error(error);
			throw error;
		} finally {
			setLoggingOut(false);
		}
	};

	if (loggingOut)
		return <LoadingScreen.Trigger description={"Logging out"} />;

	return (
		<>
			{children ? (
				<span
					onClick={handleClick}
					style={{
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						width: "100%",
					}}
				>
					{children}
				</span>
			) : (
				<IconButton
					size={"small"}
					color={"default"}
					onClick={(e) => {
						setPopoverAnchorEl(e.currentTarget);
					}}
				>
					<AccountCircle fontSize="inherit" />
				</IconButton>
			)}

			<Popover
				id="logout-popover"
				anchorEl={popoverAnchorEle}
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "right",
				}}
				open={isPopoverOpen}
				onClose={() => setPopoverAnchorEl(null)}
			>
				<List>
					<List.Item>
						<Stack
							direction="row"
							alignItems={"center"}
							spacing={1}
						>
							{configStore.store.user.name ? (
								<Avatar>
									{configStore.store.user.name[0]}
								</Avatar>
							) : null}

							<StyledTypography variant={"body1"} noWrap={true}>
								{configStore.store.user.name}
							</StyledTypography>
						</Stack>
					</List.Item>
					<List.Item>
						<Stack alignItems={"center"} width={"100%"}>
							<Button
								variant={"contained"}
								onClick={handleLogout}
								endIcon={<Logout />}
							>
								Logout
							</Button>
						</Stack>
					</List.Item>
					<List.Item>
						<Stack alignItems={"center"} width={"100%"}>
							<Typography variant={"caption"} noWrap={true}>
								{configStore.store.config.version.version}
							</Typography>

							<Typography variant={"caption"} noWrap={true}>
								{configStore.store.config.version.datetime}
							</Typography>
						</Stack>
					</List.Item>
				</List>
			</Popover>
		</>
	);
};
