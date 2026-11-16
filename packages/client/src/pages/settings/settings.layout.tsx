import { ShieldCheck } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
	matchPath,
	Outlet,
	Link as RouterLink,
	useLocation,
	useParams,
} from "react-router";
import { useSession } from "@semoss/sdk/react";
import { EntityHeader } from "@semoss/shared";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	P,
} from "@semoss/ui/next";
import { PrivacyPreferenceCenterModal } from "@/components/cookies/privacy-preference-center-modal";
import { SettingsContext } from "@/contexts/settings-context";
import { TeamHeader } from "@/features/team-details/team-header";
import { CUSTOM_TEAM_TYPE } from "@/features/team-type/team-type";
import { usePlatformTheme } from "@/hooks/use-platform-theme";
import {
	ADMIN_MODE_STORAGE_KEY,
	getStoredAdminMode,
} from "@/hooks/useAdminMode";
import { NavbarHeader } from "../../components/shared/navbar-header";
import { NavbarLeft } from "../../components/shared/navbar-left";
import { SETTINGS_ROUTES } from "./settings.constants";

/**
 * The Settings pages' frame: the breadcrumbs, the page or team header with the
 * Privacy Center and admin mode toggle, and the page's description. Supplies
 * admin mode to the pages through the `SettingsContext`.
 */
export const SettingsLayout = () => {
	const {
		cookiePolicyOrderReact,
		cookiePoliciesReact,
		cookiePolicyModalBodyReact,
	} = usePlatformTheme();
	const isAdmin = useSession((state) => state.user?.isAdmin === true);
	const { id, type } = useParams();
	const { pathname } = useLocation();
	const [privacyCenterOpen, setPrivacyCenterOpen] = useState(false);

	// track the active breadcrumbs
	const [adminMode, setAdminMode] = useState(getStoredAdminMode);

	// if the user is not an admin turn it off
	useEffect(() => {
		if (!isAdmin) {
			setAdminMode(false);
			if (typeof window !== "undefined") {
				window.localStorage.removeItem(ADMIN_MODE_STORAGE_KEY);
			}
		}
	}, [isAdmin]);

	const matchedRoute = useMemo(() => {
		for (const r of SETTINGS_ROUTES) {
			if (matchPath(`/settings/${r.path}`, pathname)) {
				return r;
			}
		}

		return null;
	}, [pathname]);
	const isSettingsIndexRoute = matchedRoute?.path === "";
	const hasPrivacyCenterThemeContent =
		(cookiePolicyOrderReact.length > 0 &&
			Object.keys(cookiePoliciesReact).length > 0) ||
		cookiePolicyModalBodyReact.trim().length > 0;
	const showPrivacyCenter =
		isSettingsIndexRoute && hasPrivacyCenterThemeContent;

	// a team's page has its own header: the team's name, type, description and actions
	// a team's Bulk Access Management keeps the team's header, as the team's page does
	const isAdminTeamDetail =
		matchedRoute?.path === "team-permissions/:type/:id" ||
		matchedRoute?.path ===
			"team-permissions/:type/:id/bulk-access-management";
	const isTeamDetail =
		isAdminTeamDetail ||
		matchedRoute?.path === "managed-teams/:id" ||
		matchedRoute?.path === "managed-teams/:id/bulk-access-management";

	// the router decodes the params
	const teamId = id || undefined;
	// managed teams are always custom teams, so their path has no type
	const teamType = type || CUSTOM_TEAM_TYPE;

	// force admin mode on admin-only routes for admins (prevents redirect on refresh)
	useEffect(() => {
		if (isAdmin && matchedRoute?.admin && !adminMode) {
			setAdminMode(true);
		}
	}, [isAdmin, matchedRoute?.admin, adminMode]);

	useEffect(() => {
		if (!showPrivacyCenter && privacyCenterOpen) {
			setPrivacyCenterOpen(false);
		}
	}, [showPrivacyCenter, privacyCenterOpen]);

	// persist admin mode for admins
	useEffect(() => {
		if (!isAdmin) {
			return;
		}
		if (typeof window !== "undefined") {
			window.localStorage.setItem(
				ADMIN_MODE_STORAGE_KEY,
				String(adminMode),
			);
		}
	}, [adminMode, isAdmin]);

	if (!matchedRoute) {
		return null;
	}

	const routeHistory = matchedRoute.history ?? [];

	const descriptionText =
		!adminMode || matchedRoute.path !== ""
			? matchedRoute.description
			: matchedRoute.adminDescription;

	return (
		<>
			<NavbarLeft>
				<NavbarHeader logo={matchedRoute.path ? null : undefined} />
			</NavbarLeft>
			<SettingsContext.Provider
				value={{
					adminMode: adminMode,
				}}
			>
				<div className="flex flex-col gap-2 pb-8">
					<div className="flex flex-col gap-2">
						{matchedRoute.path && (
							<NavbarLeft>
								<Breadcrumb>
									<BreadcrumbList>
										<BreadcrumbItem>
											<BreadcrumbLink asChild>
												<RouterLink to="/settings">
													Settings
												</RouterLink>
											</BreadcrumbLink>
										</BreadcrumbItem>
										{routeHistory.map((link, idx) => {
											const linkRoute =
												SETTINGS_ROUTES.find(
													(r) =>
														r.path === link ||
														r.path ===
															link
																.replace(
																	"/<type>",
																	"/:type",
																)
																.replace(
																	"/<id>",
																	"/:id",
																),
												);

											const isLastItem =
												routeHistory.length - 1 === idx;
											// a page under a detail page, such as a team's
											// Bulk Access Management, is named by its own title
											const label = link.endsWith("<id>")
												? id
												: isLastItem
													? matchedRoute.title
													: linkRoute?.title || link;

											const to = link
												.replace(
													"<type>",
													encodeURIComponent(
														type ?? "",
													),
												)
												.replace(
													"<id>",
													encodeURIComponent(
														id ?? "",
													),
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
																>
																	{label}
																</RouterLink>
															</BreadcrumbLink>
														)}
													</BreadcrumbItem>
												</Fragment>
											);
										})}
									</BreadcrumbList>
								</Breadcrumb>
							</NavbarLeft>
						)}
						<div className="z-1">
							{(() => {
								const fallbackTitle = matchedRoute.title;
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
										{isAdmin && (
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

								if (isTeamDetail && teamId) {
									// the admin's view reads the team through the admin
									// endpoints, so others get no header before the page
									// sends them to their own teams
									if (isAdminTeamDetail && !isAdmin) {
										return null;
									}
									return (
										<TeamHeader
											key={`${teamType}:${teamId}`}
											id={teamId}
											type={teamType}
											admin={isAdminTeamDetail}
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
						{isTeamDetail ? null : (
							<P className="mt-2">{descriptionText}</P>
						)}
					</div>
					<Outlet />

					<PrivacyPreferenceCenterModal
						isOpen={showPrivacyCenter && privacyCenterOpen}
						onClose={() => setPrivacyCenterOpen(false)}
					/>
				</div>
			</SettingsContext.Provider>
		</>
	);
};
