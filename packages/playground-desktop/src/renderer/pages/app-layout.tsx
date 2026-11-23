import { type CSSProperties, useMemo, useState } from "react";
import { Outlet } from "react-router";
import {
	ChatProvider,
	UserSettingsDialog,
	useDefaultUserSettingsSections,
	useUserSettingsDialog,
	useWorkbenchNavigation,
} from "@semoss/chat";
import { SidebarInset, SidebarProvider } from "@semoss/ui/next";
import { useHostChatConfig } from "@/features/chat-config/use-host-chat-config";
import { useDesktopCommands } from "@/features/commands/use-desktop-commands";
import { getDesktopBridge } from "@/features/desktop-bridge/desktop-bridge";
import { createDesktopFoldersHost } from "@/features/local-folders/desktop-folders-host";
import { DesktopToolsContext } from "@/features/local-folders/desktop-tools.context";
import { createDesktopToolsHost } from "@/features/local-folders/desktop-tools-host";
import { AppNavigation } from "@/features/navigation/app-navigation";
import { useServerSettingsSection } from "@/features/server-connection/use-server-settings-section";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";

/** The color modes offered where the theme turns dark mode off. */
const LIGHT_ONLY = ["light"] as const;

/**
 * The signed in app: the chat's providers around the settings dialog, the
 * sidebar and the route. The sidebar folds while a room's Workspace is open.
 * Menu commands from the main process route into it.
 */
export const AppLayout = () => {
	const settings = useUserSettingsDialog();
	// the sidebar folds while a room's Workspace is open, as the web app's does
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const navigation = useWorkbenchNavigation(isSidebarOpen, setIsSidebarOpen);
	// one per window, so each folder's source keeps its identity
	const [tools] = useState(() =>
		createDesktopToolsHost(createDesktopFoldersHost(getDesktopBridge())),
	);
	const config = useHostChatConfig({
		onOpenSettings: settings.openSettings,
		onWorkbenchOpenChange: navigation.setIsWorkbenchOpen,
		tools,
	});
	useDesktopCommands(getDesktopBridge());
	// the chat's sections, then the app's Server section
	const chatSections = useDefaultUserSettingsSections({
		colorModes: usePlaygroundTheme().featureFlags?.enableDarkMode
			? undefined
			: LIGHT_ONLY,
	});
	const serverSection = useServerSettingsSection();
	const settingsSections = useMemo(
		() => [...chatSections, serverSection],
		[chatSections, serverSection],
	);

	return (
		<DesktopToolsContext.Provider value={tools}>
			<ChatProvider config={config}>
				<UserSettingsDialog
					open={settings.isOpen}
					onOpenChange={settings.setIsOpen}
					section={settings.section}
					onSectionChange={settings.setSection}
					sections={settingsSections}
				/>
				<SidebarProvider
					open={navigation.isNavigationOpen}
					onOpenChange={navigation.setIsNavigationOpen}
					style={{ "--sidebar-width": "16rem" } as CSSProperties}
					className="h-dvh"
				>
					<AppNavigation onOpenSettings={settings.openSettings} />
					<SidebarInset className="m-0! min-w-0 rounded-none! shadow-none">
						<div className="relative h-dvh w-full overflow-hidden bg-background">
							<Outlet />
						</div>
					</SidebarInset>
				</SidebarProvider>
			</ChatProvider>
		</DesktopToolsContext.Provider>
	);
};
