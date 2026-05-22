import {
	ExternalLink,
	MoreVertical,
	Pencil,
	ShieldCheck,
	Trash2,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
	matchPath,
	Outlet,
	Link as RouterLink,
	useLocation,
	useParams,
} from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import { AppCatalogAvatar, EngineSubtypeIcon } from "@semoss/shared";
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
	toast,
} from "@semoss/ui/next";
import { deleteTeam, getGroupDetails } from "@/api";
import { PrivacyPreferenceCenterModal } from "@/components/cookies/privacy-preference-center-modal";
import { EntityHeader } from "@/components/shared/entity-header";
import { AddTeamModal, TeamDeleteDialog } from "@/components/teams";
import { SettingsContext } from "@/contexts";
import { useAPI, useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { NavbarHeader, NavbarLeft } from "../../components/shared";
import { SETTINGS_ROUTES } from "./settings.constants";

const ENGINE_CATALOG_SETTINGS_PATHS = new Set([
	"app",
	"database",
	"function",
	"guardrail",
	"model",
	"storage",
	"vector",
]);

export const SettingsLayout = observer(() => {
	const { configStore } = useRootStore();
	const { id, type } = useParams();
	const { pathname, search, state } = useLocation();
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
	const shouldPreserveEngineCatalogSearch = useMemo(() => {
		if (!matchedRoute || !search) {
			return false;
		}

		const routePathRoot = matchedRoute.path.split("/:")[0];
		return ENGINE_CATALOG_SETTINGS_PATHS.has(routePathRoot);
	}, [matchedRoute, search]);

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

	const isAppDetail = matchedRoute?.path === "app/:id";

	const engineDetailType = useMemo<
		| "DATABASE"
		| "MODEL"
		| "STORAGE"
		| "VECTOR"
		| "FUNCTION"
		| "GUARDRAIL"
		| null
	>(() => {
		if (!matchedRoute || !id) return null;
		const root = matchedRoute.path.split("/:")[0];
		switch (root) {
			case "database":
				return "DATABASE";
			case "model":
				return "MODEL";
			case "storage":
				return "STORAGE";
			case "vector":
				return "VECTOR";
			case "function":
				return "FUNCTION";
			case "guardrail":
				return "GUARDRAIL";
			default:
				return null;
		}
	}, [matchedRoute, id]);

	const engineInfoPixel = usePixel<Record<string, unknown>>(
		engineDetailType && id
			? adminMode
				? `AdminEngineInfo(engine='${id}');`
				: `EngineInfo(engine='${id}');`
			: "",
		{ data: {} },
	);
	const engineSubtype =
		(engineInfoPixel.data?.engine_subtype as string | undefined) || "";
	const engineInfoForContext = useMemo(
		() => ({
			status: engineInfoPixel.status,
			data: engineInfoPixel.data,
		}),
		[engineInfoPixel.status, engineInfoPixel.data],
	);

	// User-scoped access check used to gate the "View In Catalog" button so admins
	// who don't actually belong to the engine/app don't get a click-through that
	// dead-ends at a permission-denied page.
	// Only fire the permission lookup on the matching detail route; passing an
	// empty tuple makes useAPI short-circuit (no request, INITIAL status).
	const userEnginePermissionApi = useAPI(
		(engineDetailType && id
			? ["getUserEnginePermission", id]
			: []) as unknown as ["getUserEnginePermission", string],
	);
	const userProjectPermissionApi = useAPI(
		(isAppDetail && id
			? ["getUserProjectPermission", id]
			: []) as unknown as ["getUserProjectPermission", string],
	);
	const hasCatalogAccess = useMemo(() => {
		if (engineDetailType && id) {
			const permission = (
				userEnginePermissionApi.data as
					| { permission?: string }
					| undefined
			)?.permission;
			return userEnginePermissionApi.status === "SUCCESS" && !!permission;
		}
		if (isAppDetail && id) {
			return (
				userProjectPermissionApi.status === "SUCCESS" &&
				!!userProjectPermissionApi.data
			);
		}
		return false;
	}, [
		engineDetailType,
		isAppDetail,
		id,
		userEnginePermissionApi.status,
		userEnginePermissionApi.data,
		userProjectPermissionApi.status,
		userProjectPermissionApi.data,
	]);
	const catalogUrl =
		engineDetailType && id
			? `/engine/${engineDetailType.toLowerCase()}/${id}`
			: isAppDetail && id
				? `/app/${id}`
				: null;

	const stateName =
		state && typeof state === "object" && "name" in state
			? (state as { name?: string }).name
			: undefined;
	// Resolve a friendly display name for the current engine/app detail page;
	// used both as the breadcrumb label and the h1 (with raw id falling back below).
	const detailDisplayName = engineDetailType
		? (engineInfoPixel.data?.engine_display_name as string | undefined) ||
			(engineInfoPixel.data?.engine_name as string | undefined) ||
			stateName
		: isAppDetail
			? stateName
			: undefined;
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
					engineInfo: engineDetailType
						? engineInfoForContext
						: undefined,
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
													? detailDisplayName || id
													: isLastItem
														? matchedRoute.title
														: linkRoute?.title ||
															link;

												const to = link.replace(
													"<id>",
													id ?? "",
												);
												const toRoot = to.split("/")[0];
												const breadcrumbTo =
													shouldPreserveEngineCatalogSearch &&
													ENGINE_CATALOG_SETTINGS_PATHS.has(
														toRoot,
													)
														? {
																pathname: to,
																search,
															}
														: to;

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
																		to={
																			breadcrumbTo
																		}
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
							{(() => {
								const fallbackTitle =
									matchedRoute.history &&
									matchedRoute.history.length < 2
										? matchedRoute.title
										: stateName || matchedRoute.title;
								const headerActions = (
									<>
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
										{catalogUrl && hasCatalogAccess && (
											<Button
												asChild
												variant="outline"
												size="sm"
												className="gap-2"
												data-testid="settingsLayout-view-in-catalog-btn"
											>
												<RouterLink to={catalogUrl}>
													<ExternalLink className="size-4" />
													View In Catalog
												</RouterLink>
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
									</>
								);

								if (isTeamPermissionsDetail && id) {
									return (
										<div className="flex flex-row items-center justify-between">
											<div className="flex flex-row items-center gap-2">
												<h1 className="font-semibold text-2xl leading-normal">
													{id}
												</h1>
												{type ? (
													<Badge
														variant="outline"
														className="uppercase"
													>
														{String(
															type,
														).toUpperCase()}
													</Badge>
												) : null}
											</div>
											<div className="flex items-center gap-2">
												{headerActions}
											</div>
										</div>
									);
								}

								if (engineDetailType && id) {
									return (
										<EntityHeader
											icon={
												<EngineSubtypeIcon
													engineType={
														engineDetailType
													}
													engineSubtype={
														engineSubtype
													}
													alt={
														detailDisplayName || id
													}
													className="size-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
												/>
											}
											name={detailDisplayName || id}
											id={id}
											copyLabel="Copy Engine ID"
											copyTestId="settingsLayout-copy-btn"
											actions={headerActions}
										/>
									);
								}

								if (isAppDetail && id) {
									const appName = detailDisplayName || id;
									return (
										<EntityHeader
											icon={
												<AppCatalogAvatar
													name={appName}
													className="h-full w-full rounded-lg text-xl"
												/>
											}
											name={appName}
											id={id}
											copyLabel="Copy App ID"
											copyTestId="settingsLayout-copy-btn"
											actions={headerActions}
										/>
									);
								}

								return (
									<EntityHeader
										name={fallbackTitle || ""}
										actions={headerActions}
									/>
								);
							})()}
						</div>
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
							<P className="mt-2">{descriptionText}</P>
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
