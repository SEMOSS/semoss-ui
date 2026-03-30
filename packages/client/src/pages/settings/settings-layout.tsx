import { Copy, MoreVertical, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
	matchPath,
	Outlet,
	Link as RouterLink,
	useLocation,
	useNavigate,
	useParams,
} from "react-router-dom";
import {
	Badge,
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	P,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { deleteTeam, getGroupDetails } from "@/api";
import { PrivacyPreferenceCenterModal } from "@/components/cookies/PrivacyPreferenceCenterModal";
import { AddTeamModal, TeamDeleteDialog } from "@/components/teams";
import { SettingsContext } from "@/contexts";
import { useRootStore } from "@/hooks";
import { NavbarHeader, NavbarLeft } from "../../components/shared";
import { SETTINGS_ROUTES } from "./settings.constants";

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
				<div className="flex flex-col gap-2">
					<div className="flex flex-col gap-2">
						{matchedRoute.path && (
							<div className="flex justify-between">
								<Breadcrumb>
									<BreadcrumbList>
										<BreadcrumbItem>
											<BreadcrumbLink asChild>
												<RouterLink to={`..`}>
													Settings
												</RouterLink>
											</BreadcrumbLink>
										</BreadcrumbItem>
										{matchedRoute.history.map(
											(link, idx) => {
												const linkRoute =
													SETTINGS_ROUTES.find(
														(r) =>
															r.path === link ||
															r.path ===
																link.replace(
																	"/<id>",
																	"/:id",
																),
													);

												const isLastItem =
													matchedRoute.history
														.length -
														1 ===
													idx;
												const label = link.includes(
													"<id>",
												)
													? id
													: isLastItem
														? matchedRoute.title
														: linkRoute?.title ||
															link;

												const to = link.replace(
													"<id>",
													id ?? "",
												);

												return (
													<Fragment key={idx + link}>
														<BreadcrumbSeparator />
														<BreadcrumbItem>
															{isLastItem ? (
																<BreadcrumbPage>
																	{label}
																</BreadcrumbPage>
															) : (
																<BreadcrumbLink
																	asChild
																>
																	<RouterLink
																		to={to}
																		state={
																			state &&
																			typeof state ===
																				"object"
																				? {
																						...state,
																					}
																				: undefined
																		}
																	>
																		{label}
																	</RouterLink>
																</BreadcrumbLink>
															)}
														</BreadcrumbItem>
													</Fragment>
												);
											},
										)}
									</BreadcrumbList>
								</Breadcrumb>
							</div>
						)}
						<div className="z-[1]">
							<div className="flex flex-row items-center justify-between">
								{isTeamPermissionsDetail && id ? (
									<div className="flex flex-row items-center gap-2">
										<h1 className="font-semibold text-2xl leading-normal">
											{id}
										</h1>
										{type ? (
											<Badge
												variant="outline"
												className="uppercase"
											>
												{String(type).toUpperCase()}
											</Badge>
										) : null}
									</div>
								) : (
									<h1 className="font-semibold text-2xl leading-normal">
										{matchedRoute.history.length < 2
											? matchedRoute.title
											: state &&
													typeof state === "object" &&
													"name" in state
												? (state as any).name
												: matchedRoute.title}
									</h1>
								)}

								<div className="flex items-center gap-2">
									{showPrivacyCenter && (
										<Button
											variant="ghost"
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
										<Button
											variant="outline"
											size="sm"
											className={`h-8 rounded-full px-3 ${
												adminMode
													? "border-green-700/30 bg-green-700/10 text-green-800 hover:bg-green-700/20"
													: "border-border bg-muted text-foreground hover:bg-muted/80"
											}`}
											onClick={() =>
												setAdminMode(!adminMode)
											}
										>
											<ShieldCheck className="size-4" />
											{adminMode
												? "Admin On"
												: "Admin Off"}
										</Button>
									)}
								</div>
							</div>
						</div>
						{id ? (
							<div className="flex items-center gap-1">
								<span className="text-muted-foreground text-sm">
									{id}
								</span>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => {
												copy(id);
											}}
											data-testid={
												"settingsLayout-copy-btn"
											}
										>
											<Copy className="size-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Copy ID</TooltipContent>
								</Tooltip>
							</div>
						) : null}
						{isTeamPermissionsDetail ? (
							<>
								<div className="flex w-full items-start justify-between gap-3">
									<P>{descriptionText}</P>
									{teamId && teamType ? (
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon-sm"
													aria-label="Team actions"
												>
													<MoreVertical className="size-4" />
												</Button>
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
								<P className="text-muted-foreground text-sm">
									{teamDescriptionText}
								</P>
							</>
						) : (
							<P>{descriptionText}</P>
						)}
					</div>
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
				</div>
			</SettingsContext.Provider>
		</>
	);
});
