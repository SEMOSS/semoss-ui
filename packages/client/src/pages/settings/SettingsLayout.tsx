import {
	AdminPanelSettingsOutlined,
	ContentCopyOutlined,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import {
	Link,
	matchPath,
	Outlet,
	useLocation,
	useParams,
} from "react-router-dom";
import {
	Breadcrumbs,
	Button,
	Chip,
	IconButton,
	Stack,
	styled,
	Tooltip,
	Typography,
} from "@semoss/ui";
import { PrivacyPreferenceCenterModal } from "@/components/cookies/PrivacyPreferenceCenterModal";
import { SettingsContext } from "@/contexts";
import { useRootStore } from "@/hooks";
import { NavbarHeader, NavbarLeft } from "../../components/shared";
import { SETTINGS_ROUTES } from "./settings.constants";

const StyledHeader = styled("div")(({ theme }) => ({
	display: "flex",
	justifyContent: "space-between",
}));

const StyledAdminHeader = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "row",
	justifyContent: "space-between",
	alignItems: "center",
}));

const StyledAdminActionButtons = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: theme.spacing(1),
}));

const StyledId = styled(Typography)(({ theme }) => ({
	color: theme.palette.secondary.dark,
}));

const StyledChip = styled(Chip, {
	shouldForwardProp: (prop) => prop !== "adminMode",
})<{ adminMode: boolean }>(({ theme, adminMode }) => ({
	backgroundColor: `${
		adminMode ? "rgba(46, 125, 50, .15)" : theme.palette.success
	}`,
	"&&:hover": {
		backgroundColor: `${
			adminMode ? "rgba(46, 125, 50, .25)" : theme.palette.grey[300]
		}`,
	},
}));

const IdContainer = styled("span")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
}));

const StyledAdminContainer = styled("div")(({ theme }) => ({
	top: theme.spacing(1),
	right: theme.spacing(1),
	zIndex: 1,
}));

const StyledLink = styled(Link)(({ theme }) => ({
	textDecoration: "none",
	color: "inherit",
}));

export const SettingsLayout = observer(() => {
	const { configStore } = useRootStore();
	const { id } = useParams();
	const { pathname, state } = useLocation();
	const [privacyCenterOpen, setPrivacyCenterOpen] = useState(false);

	const ADMIN_MODE_STORAGE_KEY = "semoss.adminMode";
	const getStoredAdminMode = () => {
		if (typeof window === "undefined") {
			return false;
		}
		return window.localStorage.getItem(ADMIN_MODE_STORAGE_KEY) === "true";
	};

	// track the active breadcrumbs
	const [adminMode, setAdminMode] = useState(getStoredAdminMode);

	// if the user is not an admin turn it off
	useEffect(() => {
		if (!configStore.store.user.admin) {
			setAdminMode(false);
			if (typeof window !== "undefined") {
				window.localStorage.removeItem(ADMIN_MODE_STORAGE_KEY);
			}
		}
	}, [configStore.store.user.admin]);

	const matchedRoute = useMemo(() => {
		for (const r of SETTINGS_ROUTES) {
			if (matchPath(`/settings/${r.path}`, pathname)) {
				return r;
			}
		}

		return null;
	}, [pathname]);

	if (!matchedRoute) {
		return null;
	}

	// force admin mode on admin-only routes for admins (prevents redirect on refresh)
	useEffect(() => {
		if (configStore.store.user.admin && matchedRoute?.admin && !adminMode) {
			setAdminMode(true);
		}
	}, [configStore.store.user.admin, matchedRoute?.admin, adminMode]);

	// persist admin mode for admins
	useEffect(() => {
		if (!configStore.store.user.admin) {
			return;
		}
		if (typeof window !== "undefined") {
			window.localStorage.setItem(
				ADMIN_MODE_STORAGE_KEY,
				String(adminMode),
			);
		}
	}, [adminMode, configStore.store.user.admin]);

	/**
	 * Copy text and add it to the clipboard
	 * @param text - text to copy
	 */
	const copy = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<SettingsContext.Provider
				value={{
					adminMode: adminMode,
				}}
			>
				<Stack direction="column" gap={2}>
					<Stack>
						{matchedRoute.path && (
							<StyledHeader>
								<Breadcrumbs separator="/">
									<Breadcrumbs.Item
										//@ts-expect-error: TODO FIX Type
										as={Link}
										to={`..`}
										underline="none"
										color="inherit"
										variant="body1"
									>
										Settings
									</Breadcrumbs.Item>
									{matchedRoute.history.map((link, idx) => {
										return (
											<Breadcrumbs.Item
												//@ts-expect-error: TODO FIX Type
												as={Link}
												key={idx + link}
												to={link.replace("<id>", id)}
												underline="none"
												color={
													matchedRoute.history
														.length -
														1 ===
													idx
														? "text.disabled"
														: "inherit"
												}
												variant="body1"
												state={{ ...state }}
											>
												{link.includes("<id>")
													? id
													: matchedRoute.title}
											</Breadcrumbs.Item>
										);
									})}
								</Breadcrumbs>
							</StyledHeader>
						)}
						<StyledAdminContainer>
							<StyledAdminHeader>
								<Typography variant="h4">
									{matchedRoute.history.length < 2
										? matchedRoute.title
										: state
											? state.name
											: matchedRoute.title}
								</Typography>

								<StyledAdminActionButtons>
									<Button
										variant="text"
										onClick={() =>
											setPrivacyCenterOpen(true)
										}
										data-testid={
											"settingsLayout-privacy-btn"
										}
									>
										Privacy Center
									</Button>

									{configStore.store.user.admin && (
										<StyledChip
											adminMode={adminMode}
											size="medium"
											clickable
											icon={
												<AdminPanelSettingsOutlined
													color={
														adminMode
															? "success"
															: "disabled"
													}
												/>
											}
											label={
												adminMode
													? "Admin On"
													: "Admin Off"
											}
											onClick={() =>
												setAdminMode(!adminMode)
											}
										/>
									)}
								</StyledAdminActionButtons>
							</StyledAdminHeader>
						</StyledAdminContainer>
						{id ? (
							<IdContainer>
								<StyledId variant={"subtitle2"}>{id}</StyledId>
								<IconButton
									size="small"
									onClick={() => {
										copy(id);
									}}
									data-testid={"settingsLayout-copy-btn"}
								>
									<Tooltip title={`Copy ID`}>
										<ContentCopyOutlined fontSize="inherit" />
									</Tooltip>
								</IconButton>
							</IdContainer>
						) : null}
						<Typography variant="body1">
							{!adminMode || matchedRoute.path !== ""
								? matchedRoute.description
								: matchedRoute.adminDescription}
						</Typography>
					</Stack>
					<Outlet />

					<PrivacyPreferenceCenterModal
						isOpen={privacyCenterOpen}
						onClose={() => setPrivacyCenterOpen(false)}
					/>
				</Stack>
			</SettingsContext.Provider>
		</>
	);
});
