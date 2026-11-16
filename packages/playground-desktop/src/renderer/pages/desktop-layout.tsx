import type { CSSProperties } from "react";
import { Outlet } from "react-router";
import { Chat, useCreateChatStore } from "@semoss/chat";
import { SidebarInset, SidebarProvider } from "@semoss/ui/next";
import { useDesktopCommands } from "@/features/commands/use-desktop-commands";
import { getDesktopBridge } from "@/features/desktop-bridge/desktop-bridge";
import { useDesktopChatConfig } from "@/features/room/use-desktop-chat-config";
import { DesktopSidebar } from "@/features/sidebar/desktop-sidebar";

/**
 * The signed in app: the chat's providers around the sidebar and the route.
 * Menu commands from the main process route into it.
 */
export const DesktopLayout = () => {
	const config = useDesktopChatConfig();
	const store = useCreateChatStore(config.theme, config.newChatDefaults);
	useDesktopCommands(getDesktopBridge());

	return (
		<Chat.SessionProvider store={store}>
			<Chat.ConfigProvider config={config}>
				<SidebarProvider
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
			</Chat.ConfigProvider>
		</Chat.SessionProvider>
	);
};
