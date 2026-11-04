import { observer } from "mobx-react-lite";
import {
	type CSSProperties,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { matchPath, Outlet, useLocation } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { SidebarInset, SidebarProvider, useCacheState } from "@semoss/ui/next";
import { setFavicon } from "@semoss/utility/browser";
import { GlobalDialog } from "@/components/common/global-dialog";
import { GlobalFooter } from "@/components/common/global-footer";
import { GlobalNav } from "@/components/common/global-nav";
import { LandingTour } from "@/components/common/landing-tour";
import { SessionRevokedDialog } from "@/components/common/session-revoked-dialog";
import { ROOM_PANEL_COMPONENTS } from "@/components/room/panels/room-panel.components";
import { ChatContext } from "@/contexts/chat-context";
import { TourContext } from "@/contexts/tour-context";
import { useWorkspaceNavigation } from "@/features/conversation/use-workspace-navigation";
import { WorkspaceNavigationContext } from "@/features/conversation/workspace-navigation.context";
import { MobileNavigationButton } from "@/features/navigation/mobile-navigation-button";
import { SettingsDialogProvider } from "@/features/settings/settings-dialog-provider";
import { useRoot } from "@/hooks/use-root";
import { useThemeTitle } from "@/hooks/use-theme-title";
import { ChatStore } from "@/stores/chat/chat.store";

export const MainLayout = observer(() => {
	const { actions } = useInsight();
	const { root } = useRoot();
	const theme = root.theme;
	// React freezes DOM style props in development; keep the observable theme mutable.
	const layoutStyle = { ...theme.overrides["main-layout"] };
	const { pathname } = useLocation();
	const [isTourOpen, setIsTourOpen] = useState(false);
	const [pendingTour, setPendingTour] = useState(false);

	const [isSidebarOpen, setIsSidebarOpen] = useCacheState(
		theme.sidebar.expandedByDefault,
		`sidebar--isOpen`,
	);

	const navigation = useWorkspaceNavigation(isSidebarOpen, setIsSidebarOpen);

	// set up the chat store
	const chatStore = useMemo(() => {
		const store = new ChatStore(root.theme, actions, ROOM_PANEL_COMPONENTS);

		// initialize it
		store.initialize();

		return store;
	}, [root.theme, actions]);

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
				map[embedPath] = `/${embedPath}`; // fallback to the embed path itself
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
			<TourContext.Provider
				value={{
					isOpen: isTourOpen,
					startTour: () => setIsTourOpen(true),
					stopTour: () => setIsTourOpen(false),
				}}
			>
				<SettingsDialogProvider>
					<LandingTour />
					<WorkspaceNavigationContext.Provider
						value={navigation.setWorkAreaOpen}
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
								<SessionRevokedDialog />
								<div
									data-testid="main-layout"
									className="relative flex h-dvh w-full flex-col overflow-hidden bg-background pt-14 md:pt-0"
									style={layoutStyle}
								>
									<MobileNavigationButton />
									<div className="relative min-h-0 w-full flex-1 overflow-hidden">
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
													style={{
														// visibility:hidden removes the iframe from
														// the browser touch hit-test pipeline on
														// mobile (opacity:0 alone does not), so
														// inactive iframes no longer intercept swipe
														visibility: isActive
															? "visible"
															: "hidden",
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
					</WorkspaceNavigationContext.Provider>
				</SettingsDialogProvider>
			</TourContext.Provider>
		</ChatContext.Provider>
	);
});
