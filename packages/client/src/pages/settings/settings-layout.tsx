import {
	AdminPanelSettingsOutlined,
	ContentCopyOutlined,
} from "@mui/icons-material";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import {
	Link,
	matchPath,
	Outlet,
	useLocation,
	useNavigate,
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	toast,
} from "@semoss/ui/next";
import { deleteTeam, getGroupDetails } from "@/api";
import { PrivacyPreferenceCenterModal } from "@/components/cookies/PrivacyPreferenceCenterModal";
import { AddTeamModal, TeamDeleteDialog } from "@/components/teams";
import { SettingsContext } from "@/contexts";
import { useRootStore } from "@/hooks";
import { NavbarHeader, NavbarLeft } from "../../components/shared";
import { SETTINGS_ROUTES } from "./settings.constants";

const StyledHeader = styled("div")(() => ({
	display: "flex",
	justifyContent: "space-between",
}));

const StyledAdminHeader = styled("div")(() => ({
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

const IdContainer = styled("span")(() => ({
	display: "flex",
	alignItems: "center",
}));

const StyledAdminContainer = styled("div")(({ theme }) => ({
	top: theme.spacing(1),
	right: theme.spacing(1),
	zIndex: 1,
}));

// StyledLink removed (unused)

export const SettingsLayout = observer(() => {
	const { configStore } = useRootStore();
	const { id, type } = useParams();
	const { pathname, state } = useLocation();
	const navigate = useNavigate();
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
	const isSettingsIndexRoute = matchedRoute?.path === "";
	const hasPrivacyCenterThemeContent = useMemo(() => {
		const theme = configStore.theme as Record<string, unknown>;
		const order = Array.isArray(theme.cookiePolicyOrderReact)
			? theme.cookiePolicyOrderReact
			: [];
		const policies =
			theme.cookiePoliciesReact &&
			typeof theme.cookiePoliciesReact === "object"
				? (theme.cookiePoliciesReact as Record<string, string>)
				: {};
		const body =
			typeof theme.cookiePolicyModalBodyReact === "string"
				? theme.cookiePolicyModalBodyReact.trim()
				: "";

		return (
			(order.length > 0 && Object.keys(policies).length > 0) ||
			body.length > 0
		);
	}, [configStore.theme]);
	const showPrivacyCenter =
		isSettingsIndexRoute && hasPrivacyCenterThemeContent;

	const isTeamPermissionsDetail =
		matchedRoute?.path === "team-permissions/:type/:id";
	const teamId = id ? decodeURIComponent(id) : undefined;
	const teamType = type ? decodeURIComponent(type) : undefined;
	const [teamDescription, setTeamDescription] = useState<
		string | undefined
	>();
	const [editTeam, setEditTeam] = useState(false);
	const [deleteModal, setDeleteModal] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// force admin mode on admin-only routes for admins (prevents redirect on refresh)
	useEffect(() => {
		if (configStore.store.user.admin && matchedRoute?.admin && !adminMode) {
			setAdminMode(true);
		}
	}, [configStore.store.user.admin, matchedRoute?.admin, adminMode]);

	useEffect(() => {
		if (!showPrivacyCenter && privacyCenterOpen) {
			setPrivacyCenterOpen(false);
		}
	}, [showPrivacyCenter, privacyCenterOpen]);

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

	useEffect(() => {
		let isMounted = true;

		const loadTeamDetails = async () => {
			if (!isTeamPermissionsDetail || !teamId || !teamType) {
				setTeamDescription(undefined);
				return;
			}

			try {
				const response = await getGroupDetails(
					adminMode,
					teamId,
					teamType,
				);
				if (!isMounted) {
					return;
				}
				const details =
					response && typeof response === "object" ? response : null;
				setTeamDescription(
					(details as { description?: string })?.description,
				);
			} catch (error) {
				console.error(error);
			}
		};

		loadTeamDetails();

		return () => {
			isMounted = false;
		};
	}, [adminMode, isTeamPermissionsDetail, teamId, teamType]);

	const handleDelete = async () => {
		if (!teamId || !teamType) {
			return;
		}

		setIsDeleting(true);
		try {
			await deleteTeam(teamId, teamType);
			toast.success("Successfully deleted team");
			navigate("/settings/team-permissions");
		} catch (error) {
			console.error(error);
			toast.error("Failed to delete team");
		} finally {
			setIsDeleting(false);
			setDeleteModal(false);
		}
	};

	/**
	 * Copy text and add it to the clipboard
	 * @param text - text to copy
	 */
	const copy = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	if (!matchedRoute) {
		return null;
	}

	const descriptionText =
		!adminMode || matchedRoute.path !== ""
			? matchedRoute.description
			: matchedRoute.adminDescription;
	const teamDescriptionText = teamDescription
		? teamDescription.replace(/['"]+/g, "")
		: "No description available";

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
								{isTeamPermissionsDetail && id ? (
									<Stack
										direction="row"
										spacing={1}
										alignItems="center"
									>
										<Typography variant="h4">
											{id}
										</Typography>
										{type ? (
											<Chip
												size="small"
												label={String(
													type,
												).toUpperCase()}
												variant="outlined"
											/>
										) : null}
									</Stack>
								) : (
									<Typography variant="h4">
										{matchedRoute.history.length < 2
											? matchedRoute.title
											: state
												? state.name
												: matchedRoute.title}
									</Typography>
								)}

								<StyledAdminActionButtons>
									{showPrivacyCenter && (
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
									)}

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
						{isTeamPermissionsDetail ? (
							<>
								<div className="flex w-full items-start justify-between gap-3">
									<Typography variant="body1">
										{descriptionText}
									</Typography>
									{teamId && teamType ? (
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<IconButton
													size="small"
													aria-label="Team actions"
												>
													<MoreVertical className="size-4" />
												</IconButton>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() =>
														setEditTeam(true)
													}
												>
													<span className="flex items-center gap-2">
														<Pencil className="size-4" />
														Edit team
													</span>
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() =>
														setDeleteModal(true)
													}
												>
													<span className="flex items-center gap-2 text-destructive">
														<Trash2 className="size-4" />
														Delete team
													</span>
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									) : null}
								</div>
								<Typography
									variant="body2"
									color="textSecondary"
								>
									{teamDescriptionText}
								</Typography>
							</>
						) : (
							<Typography variant="body1">
								{descriptionText}
							</Typography>
						)}
					</Stack>
					<Outlet />

					<PrivacyPreferenceCenterModal
						isOpen={showPrivacyCenter && privacyCenterOpen}
						onClose={() => setPrivacyCenterOpen(false)}
					/>
					<AddTeamModal
						open={editTeam}
						isEdit={true}
						type={teamType}
						id={teamId}
						description={teamDescription}
						onClose={(team) => {
							if (team?.id && team?.type) {
								setTeamDescription(team.description);
								navigate(
									`/settings/team-permissions/${encodeURIComponent(
										team.type,
									)}/${encodeURIComponent(team.id)}`,
								);
							}
							setEditTeam(false);
						}}
					/>
					<TeamDeleteDialog
						open={deleteModal}
						onOpenChange={setDeleteModal}
						teamId={teamId}
						onConfirm={handleDelete}
						isLoading={isDeleting}
					/>
				</Stack>
			</SettingsContext.Provider>
		</>
	);
});
