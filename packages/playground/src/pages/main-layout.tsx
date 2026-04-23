import { observer } from "mobx-react-lite";
import React, {
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
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
	const { pathname } = useLocation();
	const [isTourOpen, setIsTourOpen] = useState(false);
	const [pendingTour, setPendingTour] = useState(false);

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

	// Refs for embed iframe sync
	const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
	const iframeReadyRef = useRef<Record<string, boolean>>({});
	const pendingNavRef = useRef<Record<string, string>>({});

	// embedPath -> iframeBase (the hash-derived root path inside the iframe)
	const embedPathToIframeBase = useMemo(() => {
		const map: Record<string, string> = {};
		for (const [embedPath, item] of Object.entries(
			chatStore.embeddedPageMap,
		)) {
			try {
				const hash = new URL(item.url).hash; // e.g. "#/agent"
				map[embedPath] = hash.startsWith("#") ? hash.slice(1) : hash; // e.g. "/agent"
			} catch {
				map[embedPath] = "/" + embedPath;
			}
		}
		return map;
	}, [chatStore.embeddedPageMap]);

	useThemeTitle(theme);

	useEffect(() => {
		const icon = theme?.images?.tabIcon;
		if (icon) setFavicon(icon);
	}, [theme?.images?.tabIcon]);

	// When parent pathname changes to an embed route, tell the iframe where to go
	useEffect(() => {
		const match = matchPath({ path: "/embed/*", end: false }, pathname);
		if (!match) return;

		const splatPath = match.params["*"] ?? "";
		const embedBase = splatPath.split("/")[0];
		const subPath = splatPath.slice(embedBase.length);
		const iframeBase = embedPathToIframeBase[embedBase];
		if (!iframeBase) return;

		const iframePath = iframeBase + subPath;

		const iframe = iframeRefs.current[embedBase];
		if (!iframe?.contentWindow) return;

		if (!iframeReadyRef.current[embedBase]) {
			pendingNavRef.current[embedBase] = iframePath;
			return;
		}

		iframe.contentWindow.postMessage(
			{ type: "SMSS_NAVIGATE_TO", payload: { path: iframePath } },
			"*",
		);
	}, [pathname, embedPathToIframeBase]);

	// Listen for SMSS_READY and flush any queued navigation
	useEffect(() => {
		const handle = (e: MessageEvent) => {
			if (e.data?.type !== "SMSS_READY") return;
			const entry = Object.entries(iframeRefs.current).find(
				([, iframe]) => iframe?.contentWindow === e.source,
			);
			if (!entry) return;
			const [embedBase] = entry;
			iframeReadyRef.current[embedBase] = true;
			const pending = pendingNavRef.current[embedBase];
			if (pending) {
				delete pendingNavRef.current[embedBase];
				(e.source as Window).postMessage(
					{ type: "SMSS_NAVIGATE_TO", payload: { path: pending } },
					"*",
				);
			}
		};
		window.addEventListener("message", handle);
		return () => window.removeEventListener("message", handle);
	}, []);

	// Auto-show tour for first-time users (resets when cookies are cleared).
	// If the welcome dialog is visible, defer until it is acknowledged.
	useEffect(() => {
		if (root.theme.tour?.show === false) return;
		const hasSeen = document.cookie
			.split("; ")
			.find((c) => c.startsWith("hasSeenTour="));
		if (!hasSeen) {
			// biome-ignore lint/suspicious/noDocumentCookie: TODO: why not use localStorage?
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
							<GlobalDialog
								onAcknowledge={() => {
									if (pendingTour) {
										setPendingTour(false);
										setIsTourOpen(true);
									}
								}}
							/>
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
															root.breadcrumbs
																.length -
																1;

														return (
															<React.Fragment
																key={`${index}-${crumb.path}`}
															>
																<BreadcrumbItem>
																	{crumb.path ? (
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
																				{
																					crumb.name
																				}
																			</Link>
																		</BreadcrumbLink>
																	) : (
																		<span
																			className={
																				isLast
																					? "text-foreground"
																					: "text-muted-foreground"
																			}
																		>
																			{
																				crumb.name
																			}
																		</span>
																	)}
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
										{navbarActions ?? null}
									</div>
								</div>
								<Separator />
								<div className="relative w-full flex-1 overflow-hidden">
									<Outlet />
									{Object.values(
										chatStore.embeddedPageMap,
									).map((item) => {
										const isActive = matchPath(
											{
												path: `/embed/${item.path}`,
												end: false,
											},
											pathname,
										);
										return (
											<iframe
												key={item.path}
												ref={(el) => {
													iframeRefs.current[
														item.path
													] = el;
												}}
												src={item.url}
												title={item.path}
												className="absolute inset-0 h-full w-full border-none"
												// @ts-expect-error fetchpriority is not yet in React's typings
												fetchpriority="high"
												style={{
													opacity: isActive ? 1 : 0,
													pointerEvents: isActive
														? "auto"
														: "none",
												}}
											/>
										);
									})}
								</div>
								<GlobalFooter />
							</div>
						</SidebarInset>
					</SidebarProvider>
				</TourContext.Provider>
			</NavbarContext.Provider>
		</ChatContext.Provider>
	);
});
