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
			const loggedInFromConfig = new Set<string>();
			const logins = configStore.store.config.logins || {};

			// Add each provider that exists in logins (excluding NATIVE)
			Object.keys(logins).forEach((provider) => {
				if (
					logins[provider] !== undefined &&
					provider.toUpperCase() !== "NATIVE"
				) {
					loggedInFromConfig.add(provider.toLowerCase());
				}
			});

			// Also check localStorage for any additional state
			try {
				const stored = localStorage.getItem("loggedInProviders");
				if (stored) {
					const storedProviders = JSON.parse(stored);
					storedProviders.forEach((provider: string) => {
						loggedInFromConfig.add(provider);
					});
				}
			} catch (error) {
				console.error("Error reading from localStorage:", error);
			}

			// Save the combined state back to localStorage
			if (loggedInFromConfig.size > 0) {
				localStorage.setItem(
					"loggedInProviders",
					JSON.stringify(Array.from(loggedInFromConfig)),
				);
			}
			return loggedInFromConfig;
		},
	);

	// Wrapper function that saves to localStorage immediately
	const updateLoggedInProviders = (
		updater: (prev: Set<string>) => Set<string>,
	) => {
		setLoggedInProviders((prev) => {
			const newSet = updater(prev);
			const providersArray = Array.from(newSet);
			localStorage.setItem(
				"loggedInProviders",
				JSON.stringify(providersArray),
			);
			return newSet;
		});
	};

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
		try {
			const success = await configStore.oauth(provider);
			if (success) {
				// Use wrapper function that saves to localStorage
				updateLoggedInProviders((prev) => {
					if (prev.has(provider)) {
						return prev;
					}

					const newSet = new Set(prev);
					newSet.add(provider);
					return newSet;
				});

				notification.add({
					color: "success",
					message: `Successfully logged in to ${provider}`,
				});
			}
		} catch (error) {
			notification.add({
				color: "error",
				message: error.message || `Failed to login to ${provider}`,
			});
		}
	};

	const handleProviderLogout = async (provider: string) => {
		try {
			await configStore.logoutProvider(provider);
			// Remove provider from logged-in providers using wrapper
			updateLoggedInProviders((prev) => {
				const newSet = new Set(prev);
				newSet.delete(provider);
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
				<button
					type="button"
					onClick={handleClick}
					style={{
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						width: "100%",
						border: "none",
						background: "none",
						padding: 0,
					}}
				>
					{children}
				</button>
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
										onClick={() => {
											if (isLoggedIn) {
												// Check if this is the first/primary login provider
												const firstLoginKey =
													Object.keys(
														configStore.store.config
															.logins,
													)[0];
												if (
													firstLoginKey ===
													provider.toUpperCase()
												) {
													updateLoggedInProviders(
														(prev) => {
															const newSet =
																new Set(prev);
															newSet.delete(
																provider,
															);
															return newSet;
														},
													);
													handleLogout();
												} else {
													handleProviderLogout(
														provider,
													);
												}
											} else {
												oauth(provider);
											}
										}}
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
