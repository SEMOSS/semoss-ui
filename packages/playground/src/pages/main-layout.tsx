import {
	type CSSProperties,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { matchPath, Outlet, useLocation } from "react-router";
import {
	Chat,
	useChatSelector,
	useCreateChatStore,
	WorkspaceNavigationContext,
} from "@semoss/chat";
import {
	cn,
	SidebarInset,
	SidebarProvider,
	useCacheState,
} from "@semoss/ui/next";
import { setFavicon } from "@semoss/utility/browser";
import { GlobalDialog } from "@/features/app-shell/global-dialog";
import { GlobalFooter } from "@/features/app-shell/global-footer";
import { NEW_CHAT_BUILD_DEFAULTS } from "@/features/chat-config/new-chat-build-defaults";
import { PlaygroundChatConfigProvider } from "@/features/chat-config/playground-chat-config-provider";
import { GlobalNav } from "@/features/navigation/global-nav";
import { NavigationButton } from "@/features/navigation/navigation-button";
import { PageHeaderContext } from "@/features/navigation/page-header.context";
import { useWorkspaceNavigation } from "@/features/navigation/use-workspace-navigation";
import { SettingsDialogProvider } from "@/features/settings/settings-dialog-provider";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";
import { useThemeTitle } from "@/features/theme/use-theme-title";
import { LandingTour } from "@/features/tour/landing-tour";
import { TourContext } from "@/features/tour/tour.context";

export const MainLayout = () => {
	const theme = usePlaygroundTheme();
	// React freezes DOM style props in development; keep the shared theme mutable.
	const layoutStyle = { ...theme.overrides["main-layout"] };
	const { pathname } = useLocation();
	const [isTourOpen, setIsTourOpen] = useState(false);
	const [pendingTour, setPendingTour] = useState(false);
	// Routes with their own header hold the mobile navigation button there.
	const [pageHeaderCount, setPageHeaderCount] = useState(0);
	const registerPageHeader = useCallback(() => {
		setPageHeaderCount((count) => count + 1);
		return () => setPageHeaderCount((count) => count - 1);
	}, []);
	const hasPageHeader = pageHeaderCount > 0;

	const [isSidebarOpen, setIsSidebarOpen] = useCacheState(
		theme.sidebar.expandedByDefault,
		`sidebar--isOpen`,
	);

	const navigation = useWorkspaceNavigation(isSidebarOpen, setIsSidebarOpen);

	const chatStore = useCreateChatStore(theme, NEW_CHAT_BUILD_DEFAULTS);
	const embeddedPageMap = useChatSelector(
		chatStore,
		(chat) => chat.embeddedPageMap,
	);

	// Refs for embed iframe sync
	const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
	const iframeReadyRef = useRef<Record<string, boolean>>({});
	const pendingNavRef = useRef<Record<string, string>>({});

	// embedPath -> iframeBase (the hash-derived root path inside the iframe)
	const embedPathToIframeBase = useMemo(() => {
		const map: Record<string, string> = {};
		for (const [embedPath, item] of Object.entries(embeddedPageMap)) {
			try {
				const hash = new URL(item.url).hash; // e.g. "#/agent"
				map[embedPath] = hash.startsWith("#") ? hash.slice(1) : hash; // e.g. "/agent"
			} catch {
				map[embedPath] = `/${embedPath}`; // fallback to the embed path itself
			}
		}
		return map;
	}, [embeddedPageMap]);

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
		if (theme.tour?.show === false) return;
		const hasSeen = document.cookie
			.split("; ")
			.find((c) => c.startsWith("hasSeenTour="));
		if (!hasSeen) {
			// biome-ignore lint/suspicious/noDocumentCookie: TODO: why not use localStorage?
			document.cookie = "hasSeenTour=true; path=/; max-age=31536000"; // 1 year
			if (theme.dialog) {
				setPendingTour(true);
			} else {
				setIsTourOpen(true);
			}
		}
	}, [theme.tour?.show, theme.dialog]);

	return (
		<Chat.SessionProvider store={chatStore}>
			<TourContext.Provider
				value={{
					isOpen: isTourOpen,
					startTour: () => setIsTourOpen(true),
					stopTour: () => setIsTourOpen(false),
				}}
			>
				<SettingsDialogProvider>
					<PlaygroundChatConfigProvider>
						<LandingTour />
						<WorkspaceNavigationContext.Provider
							value={navigation.setWorkAreaOpen}
						>
							<PageHeaderContext.Provider
								value={registerPageHeader}
							>
								<SidebarProvider
									open={navigation.isNavigationOpen}
									onOpenChange={navigation.setNavigationOpen}
									style={
										{
											"--sidebar-width": "16rem",
											"--sidebar-width-mobile": "16rem",
										} as CSSProperties
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
											className={cn(
												"relative flex h-dvh w-full flex-col overflow-hidden bg-background",
												// room for the open-navigation button, kept while the desktop
												// navigation is open too so the page never shifts
												!hasPageHeader &&
													"pt-14 md:pt-10",
											)}
											style={layoutStyle}
										>
											{!hasPageHeader && (
												<NavigationButton />
											)}
											<div className="relative min-h-0 w-full flex-1 overflow-hidden">
												<Outlet />
												{Object.values(
													embeddedPageMap,
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
															style={{
																// visibility:hidden removes the iframe from
																// the browser touch hit-test pipeline on
																// mobile (opacity:0 alone does not), so
																// inactive iframes no longer intercept swipe
																visibility:
																	isActive
																		? "visible"
																		: "hidden",
																pointerEvents:
																	isActive
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
							</PageHeaderContext.Provider>
						</WorkspaceNavigationContext.Provider>
					</PlaygroundChatConfigProvider>
				</SettingsDialogProvider>
			</TourContext.Provider>
		</Chat.SessionProvider>
	);
};
