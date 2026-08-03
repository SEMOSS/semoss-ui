import React, {
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Link, matchPath, Outlet, useLocation } from "react-router-dom";
import { useStore } from "zustand";
import { useInsight } from "@semoss/sdk/react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
	cn,
	Separator,
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
	useCacheState,
	useTheme,
} from "@semoss/ui/next";
import { GlobalFooter, GlobalNav } from "@/components";
import { GlobalDialog } from "@/components/common/global-dialog";
import { LandingTour } from "@/components/common/landing-tour";
import { ChatContext, NavbarContext, TourContext } from "@/contexts";
import { useRootState } from "@/hooks";
import { useThemeTitle } from "@/hooks/use-theme-title";
import { createChatStore } from "@/stores";
import { setFavicon } from "@/utility/utils";

export const MainLayout = () => {
	const { actions } = useInsight();
	const theme = useRootState((s) => s.theme);
	const breadcrumbs = useRootState((s) => s.breadcrumbs);
	const [navbarActions, setNavbarActions] = useState<ReactNode | null>(null);
	const { pathname } = useLocation();
	const [isTourOpen, setIsTourOpen] = useState(false);
	const [pendingTour, setPendingTour] = useState(false);

	const { theme: colorMode } = useTheme();

	const isDark =
		colorMode === "dark" ||
		(colorMode === "system" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches);

	const [isSidebarOpen, setIsSidebarOpen] = useCacheState(
		theme.sidebar.expandedByDefault,
		`sidebar--isOpen`,
	);

	const chatStore = useMemo(() => {
		const store = createChatStore(theme, actions);
		store.getState().initialize();
		return store;
	}, [theme, actions]);

	const embeddedPageMap = useStore(chatStore, (s) => s.embeddedPageMap);

	const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
	const iframeReadyRef = useRef<Record<string, boolean>>({});
	const pendingNavRef = useRef<Record<string, string>>({});

	const embedPathToIframeBase = useMemo(() => {
		const map: Record<string, string> = {};
		for (const [embedPath, item] of Object.entries(embeddedPageMap)) {
			try {
				const hash = new URL(item.url).hash;
				map[embedPath] = hash.startsWith("#") ? hash.slice(1) : hash;
			} catch {
				map[embedPath] = `/${embedPath}`;
			}
		}
		return map;
	}, [embeddedPageMap]);

	useThemeTitle(theme);

	useEffect(() => {
		const icon = theme?.images?.tabIcon;
		if (icon) setFavicon(icon);
	}, [theme?.images?.tabIcon]);

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

	useEffect(() => {
		if (theme.tour?.show === false) return;
		const hasSeen = document.cookie
			.split("; ")
			.find((c) => c.startsWith("hasSeenTour="));
		if (!hasSeen) {
			// biome-ignore lint/suspicious/noDocumentCookie: TODO: why not use localStorage?
			document.cookie = "hasSeenTour=true; path=/; max-age=31536000";
			if (theme.dialog) {
				setPendingTour(true);
			} else {
				setIsTourOpen(true);
			}
		}
	}, [theme.tour?.show, theme.dialog]);

	return (
		<ChatContext.Provider value={chatStore}>
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
						<SidebarInset className="m-0! min-w-0 rounded-none! shadow-none">
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
								className="flex h-screen w-full flex-col overflow-hidden bg-background"
								style={{
									...(!isDark && {
										background:
											"linear-gradient(180deg, #FCFCFC 58.78%, #F6F7FF 81.97%, #F1F8FF 94.04%), var(--base-secondary-background, #FFF)",
									}),
									...theme.overrides["main-layout"],
								}}
							>
								<div className="flex h-12.5 w-full shrink-0 flex-row items-center px-4">
									<div className="flex min-w-0 flex-row items-center justify-center gap-1.5">
										<SidebarTrigger />
										<Separator
											orientation="vertical"
											style={{ height: "17px" }}
										/>
										<Breadcrumb className="min-w-0">
											<BreadcrumbList className="min-w-0 flex-nowrap">
												{breadcrumbs.map(
													(crumb, index) => {
														const isLast =
															index ===
															breadcrumbs.length -
																1;
														return (
															<React.Fragment
																key={`${index}-${crumb.path}`}
															>
																<BreadcrumbItem
																	className={
																		isLast
																			? "min-w-0"
																			: undefined
																	}
																>
																	{crumb.path ? (
																		<BreadcrumbLink
																			className={cn(
																				"min-w-0 truncate",
																				isLast &&
																					"text-foreground",
																			)}
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
																			className={cn(
																				"min-w-0 truncate",
																				isLast
																					? "text-foreground"
																					: "text-muted-foreground",
																			)}
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
									{Object.values(embeddedPageMap).map(
										(item) => {
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
														opacity: isActive
															? 1
															: 0,
														pointerEvents: isActive
															? "auto"
															: "none",
													}}
												/>
											);
										},
									)}
								</div>
								<GlobalFooter />
							</div>
						</SidebarInset>
					</SidebarProvider>
				</TourContext.Provider>
			</NavbarContext.Provider>
		</ChatContext.Provider>
	);
};
