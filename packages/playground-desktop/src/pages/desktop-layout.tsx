import { type CSSProperties, useMemo } from "react";
import { Outlet, useNavigate } from "react-router";
import {
	ChatProvider,
	SettingsDialogProvider,
	useWorkspaceNavigation,
	WorkspaceNavigationContext,
} from "@semoss/chat";
import { CONNECTORS_SETTINGS_PAGE } from "@semoss/chat/connectors";
import type { ChatPreferencesAdapter } from "@semoss/sdk";
import { useConfig } from "@semoss/sdk/react";
import { SidebarInset, SidebarProvider, useCacheState } from "@semoss/ui/next";
import { DesktopNav } from "../features/navigation/desktop-nav";
import {
	buildDesktopHostConfig,
	readInstanceChatTheme,
} from "../host/build-desktop-host-config";
import { hasOverlayTitleBar } from "../platform/window-chrome";

/** The settings dialog's pages after General. */
const SETTINGS_PAGES = [CONNECTORS_SETTINGS_PAGE];

/** The sidebar's widths: open, and folded to its rail. */
const SIDEBAR_STYLE = {
	"--sidebar-width": "16rem",
	"--sidebar-width-icon": "3rem",
} as CSSProperties;

/**
 * The rail is wide enough for the window's controls above it (they reach
 * 70px in from the window's edge), so they never cover the page beside it.
 */
const OVERLAY_TITLE_BAR_SIDEBAR_STYLE = {
	...SIDEBAR_STYLE,
	"--sidebar-width-icon": "4.5rem",
} as CSSProperties;

/** Props for {@link DesktopLayout}. */
export interface DesktopLayoutProps {
	/** The name of the server in use. */
	instanceName: string;
	/** Where the picked model is kept. */
	preferences: ChatPreferencesAdapter;
	/** Go back to the instance picker. */
	onSwitchServer: () => void;
	/** Sign out of the instance. */
	onSignOut: () => void;
}

/**
 * The signed in app: the chat, set up from the instance's playground theme,
 * beside the desktop sidebar. The sidebar remembers whether it is open;
 * opening a room's Workspace folds it to its rail for the room's sake, and
 * closing the Workspace puts it back.
 *
 * @component
 */
export const DesktopLayout = ({
	instanceName,
	preferences,
	onSwitchServer,
	onSignOut,
}: DesktopLayoutProps) => {
	const navigate = useNavigate();
	const serverTheme = useConfig((state) => state.theme);
	const chatConfig = useMemo(
		() =>
			buildDesktopHostConfig({
				theme: readInstanceChatTheme(serverTheme),
				preferences: preferences,
				navigate: navigate,
			}),
		[serverTheme, preferences, navigate],
	);
	const [isSidebarOpen, setIsSidebarOpen] = useCacheState(
		true,
		"desktop-sidebar--isOpen",
	);
	const navigation = useWorkspaceNavigation(isSidebarOpen, setIsSidebarOpen);

	return (
		<ChatProvider config={chatConfig}>
			<SettingsDialogProvider pages={SETTINGS_PAGES}>
				<WorkspaceNavigationContext.Provider
					value={navigation.setWorkAreaOpen}
				>
					<SidebarProvider
						open={navigation.isNavigationOpen}
						onOpenChange={navigation.setNavigationOpen}
						style={
							hasOverlayTitleBar()
								? OVERLAY_TITLE_BAR_SIDEBAR_STYLE
								: SIDEBAR_STYLE
						}
						className="h-full min-h-0 overflow-hidden"
					>
						<DesktopNav
							instanceName={instanceName}
							onSwitchServer={onSwitchServer}
							onSignOut={onSignOut}
						/>
						<SidebarInset className="min-w-0 overflow-hidden">
							<Outlet />
						</SidebarInset>
					</SidebarProvider>
				</WorkspaceNavigationContext.Provider>
			</SettingsDialogProvider>
		</ChatProvider>
	);
};
