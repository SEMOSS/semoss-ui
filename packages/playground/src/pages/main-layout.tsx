import { observer } from "mobx-react-lite";
import React, { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, matchPath, Outlet, useLocation } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
	Separator,
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
	useCacheState,
} from "@semoss/ui/next";
import { GlobalFooter, GlobalNav } from "@/components";
import { GlobalDialog } from "@/components/common/global-dialog";
import { LandingTour } from "@/components/common/landing-tour";
import { ChatContext, NavbarContext, TourContext } from "@/contexts";
import { useRoot } from "@/hooks";
import { useThemeTitle } from "@/hooks/use-theme-title";
import { ChatStore } from "@/stores";
import { setFavicon } from "@/utility/utils";

export const MainLayout = observer(() => {
	const { actions, system } = useInsight();
	const { root } = useRoot();
	const theme = root.theme;
	const [navbarActions, setNavbarActions] = useState<ReactNode | null>(null);
	const [isTourOpen, setIsTourOpen] = useState(false);
	const [pendingTour, setPendingTour] = useState(false);
	const { pathname } = useLocation();

	const [isSidebarOpen, setIsSidebarOpen] = useCacheState(
		theme.sidebar.expandedByDefault,
		`sidebar--isOpen`,
	);

	// set up the chat store
	const chatStore = useMemo(() => {
		const store = new ChatStore(
			root.theme,
			actions,
			Object.values(system.config.loginDetails ?? {})?.[0],
		);

		// initialize it
		store.initialize();

		return store;
	}, [root.theme, actions, system.config.loginDetails]);

	useThemeTitle(theme);

	useEffect(() => {
		const icon = theme?.images?.tabIcon;
		if (icon) setFavicon(icon);
	}, [theme?.images?.tabIcon]);

	// Auto-show tour for first-time users (resets when cookies are cleared).
	// If the welcome dialog is visible, defer until it is acknowledged.
	useEffect(() => {
		if (root.theme.tour?.show === false) return;
		const hasSeen = document.cookie
			.split("; ")
			.find((c) => c.startsWith("hasSeenTour="));
		if (!hasSeen) {
			document.cookie = "hasSeenTour=true; path=/; max-age=31536000"; // 1 year
			if (root.theme.dialog) {
				setPendingTour(true);
			} else {
				setIsTourOpen(true);
			}
		}
	}, [root.theme.tour?.show, root.theme.dialog]);

	return (
		<ChatContext.Provider
			value={{
				chat: chatStore,
			}}
		>
			<NavbarContext.Provider
				value={{ actions: navbarActions, setActions: setNavbarActions }}
			>
				<TourContext.Provider
					value={{
						isOpen: isTourOpen,
						startTour: () => setIsTourOpen(true),
						stopTour: () => setIsTourOpen(false),
					}}
				>
					<LandingTour />
					<MainLayoutContent
						isSidebarOpen={isSidebarOpen}
						setIsSidebarOpen={setIsSidebarOpen}
						onDialogAcknowledge={() => {
							if (pendingTour) {
								setPendingTour(false);
								setIsTourOpen(true);
							}
						}}
					/>
				</TourContext.Provider>
			</NavbarContext.Provider>
		</ChatContext.Provider>
	);
});

const MainLayoutContent = observer(
	({
		isSidebarOpen,
		setIsSidebarOpen,
		onDialogAcknowledge,
	}: {
		isSidebarOpen: boolean;
		setIsSidebarOpen: (open: boolean) => void;
		onDialogAcknowledge: () => void;
	}) => {
		const { root } = useRoot();
		const { actions } = useNavbar();

		return (
			<SidebarProvider
				open={isSidebarOpen}
				onOpenChange={setIsSidebarOpen}
				style={
					{
						"--sidebar-width": "19rem",
						"--sidebar-width-mobile": "19rem",
					} as React.CSSProperties
				}
			>
				<GlobalNav />
				<SidebarInset className="m-0! shadow-none">
					<GlobalDialog onAcknowledge={onDialogAcknowledge} />
					<div
						data-testid="main-layout"
						className="flex h-screen w-full flex-col overflow-hidden"
						style={{
							background:
								"linear-gradient(180deg, #FCFCFC 58.78%, #F6F7FF 81.97%, #F1F8FF 94.04%), var(--base-secondary-background, #FFF)",
							...root.theme.overrides["main-layout"],
						}}
					>
						<div className="flex h-12.5 w-full shrink-0 flex-row items-center px-4">
							<div className="flex flex-row items-center justify-center gap-1.5">
								<SidebarTrigger />
								<Separator
									orientation="vertical"
									style={{ height: "17px" }}
								/>
								<Breadcrumb>
									<BreadcrumbList>
										{root.breadcrumbs.map(
											(crumb, index) => {
												const isLast =
													index ===
													root.breadcrumbs.length - 1;

												return (
													<React.Fragment
														key={crumb.path}
													>
														<BreadcrumbItem>
															<BreadcrumbLink
																className={
																	isLast
																		? "text-foreground"
																		: ""
																}
																asChild
															>
																<Link
																	to={`${crumb.path}`}
																>
																	{crumb.name}
																</Link>
															</BreadcrumbLink>
														</BreadcrumbItem>
														{!isLast && (
															<BreadcrumbSeparator />
														)}
													</React.Fragment>
												);
											},
										)}
									</BreadcrumbList>
								</Breadcrumb>
							</div>
							<div className="flex-1" />
							<div className="flex items-center gap-2">
								{actions ?? null}
							</div>
						</div>
						<Separator />
						<div className="w-full flex-1 overflow-hidden">
							<Outlet />
						</div>
						<GlobalFooter />
					</div>
				</SidebarInset>
			</SidebarProvider>
		);
	},
);
