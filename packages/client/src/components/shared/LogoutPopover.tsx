import { AccountCircle, Logout, Star } from "@mui/icons-material";
import type React from "react";
import { useState } from "react";
import {
	Avatar,
	Button,
	Divider,
	IconButton,
	List,
	LoadingScreen,
	Popover,
	Stack,
	Typography,
	useNotification,
} from "@semoss/ui";
import { useRootStore } from "@/hooks";

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
	const [loggedInProviders, setLoggedInProviders] = useState<Set<string>>(
		() => {
			try {
				const stored = localStorage.getItem("loggedInProviders");
				const providers = stored
					? new Set<string>(JSON.parse(stored))
					: new Set<string>();
				console.log(
					"Initial loggedInProviders from localStorage:",
					Array.from(providers),
				);
				return providers;
			} catch {
				return new Set<string>();
			}
		},
	);

	// Wrapper function that saves to localStorage immediately
	const updateLoggedInProviders = (
		updater: (prev: Set<string>) => Set<string>,
	) => {
		setLoggedInProviders((prev) => {
			const newSet = updater(prev);
			const providersArray = Array.from(newSet);
			console.log("Saving to localStorage:", providersArray);
			localStorage.setItem(
				"loggedInProviders",
				JSON.stringify(providersArray),
			);
			return newSet;
		});
	};

	console.log(
		"Rendering LogoutPopover component",
		"loggedInProviders:",
		Array.from(loggedInProviders),
	);
	const notification = useNotification();

	const allowedLogins = Object.keys(
		configStore.store.config.connectionsAllowed,
	).filter(
		(key) => configStore.store.config.connectionsAllowed[key] === true,
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

	const oauth = async (provider: string) => {
		console.log("OAuth login started for provider:", provider);
		try {
			const success = await configStore.oauth(provider);
			console.log(
				"OAuth login completed for provider:",
				provider,
				"success:",
				success,
			);

			if (success) {
				// Use wrapper function that saves to localStorage
				updateLoggedInProviders((prev) => {
					const currentProviders = Array.from(prev);
					console.log(
						"Current loggedInProviders before update:",
						currentProviders,
					);

					if (prev.has(provider)) {
						console.log(
							`Provider ${provider} already in set, skipping`,
						);
						return prev;
					}

					const newSet = new Set(prev);
					newSet.add(provider);
					const newProviders = Array.from(newSet);
					console.log("Updated loggedInProviders:", newProviders);

					return newSet;
				});

				notification.add({
					color: "success",
					message: `Successfully logged in to ${provider}`,
				});
			}
		} catch (error) {
			console.error("OAuth login failed for provider:", provider, error);
			notification.add({
				color: "error",
				message: error.message || `Failed to login to ${provider}`,
			});
		}
	};

	const handleProviderLogout = async (provider: string) => {
		try {
			console.log("Logging out from provider:", provider);
			await configStore.logoutProvider(provider);
			console.log("Successfully logged out from provider:", provider);

			// Remove provider from logged-in providers using wrapper
			updateLoggedInProviders((prev) => {
				const newSet = new Set(prev);
				newSet.delete(provider);
				console.log(
					"Removed provider from loggedInProviders:",
					provider,
				);
				return newSet;
			});

			notification.add({
				color: "success",
				message: `Successfully logged out from ${provider}`,
			});
		} catch (error) {
			console.error("Failed to logout from provider:", provider, error);
			notification.add({
				color: "error",
				message: `Failed to logout from ${provider}`,
			});
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
				onClose={() => {}} // Disabled onClose for inspection
				sx={{ "& .MuiPaper-root": { width: 341, py: 2 } }}
			>
				<List sx={{ p: 0 }}>
					<List.Item sx={{ px: 3, py: 1.5 }}>
						<Stack
							direction="row"
							alignItems={"center"}
							spacing={2}
						>
							{configStore.store.user.name ? (
								<Avatar sx={{ width: 48, height: 48 }}>
									{configStore.store.user.name[0]}
								</Avatar>
							) : null}

							<Typography
								variant={"body1"}
								sx={{ fontWeight: 500 }}
							>
								{configStore.store.user.name}
							</Typography>
						</Stack>
					</List.Item>

					<Divider sx={{ my: 1.5 }} />

					{allowedLogins.map((provider) => {
						const isLoggedIn = loggedInProviders.has(provider);
						console.log(
							`Provider: ${provider}, isLoggedIn:`,
							isLoggedIn,
							"loggedInProviders:",
							Array.from(loggedInProviders),
						);
						return (
							<List.Item key={provider} sx={{ px: 3, py: 1 }}>
								<Stack
									direction="row"
									alignItems={"center"}
									spacing={2}
									width={"100%"}
								>
									<Avatar
										sx={{
											bgcolor: "#E0E0E0",
											width: 40,
											height: 40,
										}}
									>
										<Star sx={{ color: "#757575" }} />
									</Avatar>
									<Typography
										variant={"body1"}
										sx={{
											flex: 1,
											textTransform: "capitalize",
										}}
									>
										{provider}
									</Typography>
									<Button
										variant={"text"}
										size={"small"}
										sx={{
											textTransform: "none",
											fontWeight: 500,
										}}
										onClick={() =>
											isLoggedIn
												? handleProviderLogout(provider)
												: oauth(provider)
										}
										disabled={false}
									>
										{isLoggedIn ? "Logout" : "Login"}
									</Button>
								</Stack>
							</List.Item>
						);
					})}

					<Divider sx={{ my: 1.5 }} />

					<List.Item sx={{ px: 3, py: 1 }}>
						<Stack
							direction="row"
							justifyContent="space-between"
							alignItems="center"
							width={"100%"}
						>
							<Stack>
								<Typography
									variant={"caption"}
									color="textSecondary"
								>
									{configStore.store.config.version.version}
								</Typography>
								<Typography
									variant={"caption"}
									color="textSecondary"
								>
									{configStore.store.config.version.datetime}
								</Typography>
							</Stack>
							<Button
								variant={"contained"}
								onClick={handleLogout}
								endIcon={<Logout />}
								sx={{ textTransform: "none", fontWeight: 500 }}
							>
								Logout All
							</Button>
						</Stack>
					</List.Item>
				</List>
			</Popover>
		</>
	);
};
