import { type CSSProperties, useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router";
import {
	ChatConfigProvider,
	ChatSessionProvider,
	UserSettingsDialog,
	useCreateChatStore,
	useUserSettingsDialog,
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
import { usePlaygroundChatConfig } from "@/features/chat-config/use-playground-chat-config";
import { EmbeddedPages } from "@/features/embed/embedded-pages";
import { GlobalNav } from "@/features/navigation/global-nav";
import { NavigationButton } from "@/features/navigation/navigation-button";
import { PageHeaderContext } from "@/features/navigation/page-header.context";
import { useWorkbenchNavigation } from "@/features/navigation/use-workbench-navigation";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";
import { useThemeTitle } from "@/features/theme/use-theme-title";
import { LandingTour } from "@/features/tour/landing-tour";
import { TourContext } from "@/features/tour/tour.context";
import { useLandingTour } from "@/features/tour/use-landing-tour";

/**
 * The signed in shell: it makes and provides the chat store, the chat's
 * config, the settings dialog and the tour, and lays out the global
 * navigation beside the route, over the theme's embedded pages
 * (`EmbeddedPages`).
 */
export const AppLayout = () => {
	const theme = usePlaygroundTheme();
	// React freezes DOM style props in development; keep the shared theme mutable.
	const layoutStyle = { ...theme.overrides["main-layout"] };
	// Routes with their own header hold the open-navigation button there; they
	// register through `PageHeaderContext`, and the count survives overlaps.
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

	const navigation = useWorkbenchNavigation(isSidebarOpen, setIsSidebarOpen);
	const { tour, acknowledgeWelcome } = useLandingTour(theme);

	const settings = useUserSettingsDialog();
	const chatConfig = usePlaygroundChatConfig({
		openSettings: settings.openSettings,
		onWorkbenchOpenChange: navigation.setWorkbenchOpen,
	});
	const chatStore = useCreateChatStore(chatConfig);

	useThemeTitle(theme);

	useEffect(() => {
		const icon = theme?.images?.tabIcon;
		if (icon) setFavicon(icon);
	}, [theme?.images?.tabIcon]);

	return (
		<ChatSessionProvider store={chatStore}>
			<TourContext.Provider value={tour}>
				<ChatConfigProvider config={chatConfig}>
					<UserSettingsDialog
						open={settings.isOpen}
						onOpenChange={settings.setIsOpen}
						section={settings.section}
						onSectionChange={settings.setSection}
					/>
					<LandingTour />

					<PageHeaderContext.Provider value={registerPageHeader}>
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
									onAcknowledge={acknowledgeWelcome}
								/>
								<div
									data-testid="main-layout"
									className={cn(
										"relative flex h-dvh w-full flex-col overflow-hidden bg-background",
										// room for the open-navigation button, kept while the desktop
										// navigation is open too so the page never shifts
										!hasPageHeader && "pt-14 md:pt-10",
									)}
									style={layoutStyle}
								>
									{!hasPageHeader && <NavigationButton />}
									<div className="relative min-h-0 w-full flex-1 overflow-hidden">
										<Outlet />
										<EmbeddedPages />
									</div>
									<GlobalFooter />
								</div>
							</SidebarInset>
						</SidebarProvider>
					</PageHeaderContext.Provider>
				</ChatConfigProvider>
			</TourContext.Provider>
		</ChatSessionProvider>
	);
};
