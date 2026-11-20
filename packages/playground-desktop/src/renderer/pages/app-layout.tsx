import { type CSSProperties, useMemo, useState } from "react";
import { Outlet } from "react-router";
import {
	ChatConfigProvider,
	ChatSessionProvider,
	UserSettingsDialog,
	useCreateChatStore,
	useDefaultSettingsPages,
	useUserSettingsDialog,
} from "@semoss/chat";
import { SidebarInset, SidebarProvider } from "@semoss/ui/next";
import { useDesktopChatConfig } from "@/features/chat-config/use-desktop-chat-config";
import { useDesktopCommands } from "@/features/commands/use-desktop-commands";
import { getDesktopBridge } from "@/features/desktop-bridge/desktop-bridge";
import { DesktopSidebar } from "@/features/navigation/desktop-sidebar";
import { useWorkbenchNavigation } from "@/features/navigation/use-workbench-navigation";
import { useServerSettingsSection } from "@/features/server-connection/use-server-settings-section";

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
	const config = useDesktopChatConfig({
		onOpenSettings: settings.openSettings,
		onWorkbenchOpenChange: navigation.setWorkbenchOpen,
	});
	const store = useCreateChatStore(config);
	useDesktopCommands(getDesktopBridge());
	// the chat's pages, then the app's Server page
	const chatPages = useDefaultSettingsPages();
	const serverPage = useServerSettingsSection();
	const pages = useMemo(
		() => [...chatPages, serverPage],
		[chatPages, serverPage],
	);

	return (
		<ChatSessionProvider store={store}>
			<ChatConfigProvider config={config}>
				<UserSettingsDialog
					open={settings.isOpen}
					onOpenChange={settings.setIsOpen}
					section={settings.section}
					onSectionChange={settings.setSection}
					pages={pages}
				/>
				<SidebarProvider
					open={navigation.isNavigationOpen}
					onOpenChange={navigation.setNavigationOpen}
					style={{ "--sidebar-width": "16rem" } as CSSProperties}
					className="h-dvh"
				>
					<DesktopSidebar />
					<SidebarInset className="m-0! min-w-0 rounded-none! shadow-none">
						<div className="relative h-dvh w-full overflow-hidden bg-background">
							<Outlet />
						</div>
					</SidebarInset>
				</SidebarProvider>
			</ChatConfigProvider>
		</ChatSessionProvider>
	);
};
