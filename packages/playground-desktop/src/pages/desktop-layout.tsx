import { useMemo } from "react";
import { Outlet, useNavigate } from "react-router";
import { ChatProvider, SettingsDialogProvider } from "@semoss/chat";
import { CONNECTORS_SETTINGS_PAGE } from "@semoss/chat/connectors";
import type { ChatPreferencesAdapter } from "@semoss/sdk";
import { useConfig } from "@semoss/sdk/react";
import {
	buildDesktopHostConfig,
	readInstanceChatTheme,
} from "../host/build-desktop-host-config";
import { DesktopNav } from "./desktop-nav";

/** The settings dialog's pages after General. */
const SETTINGS_PAGES = [CONNECTORS_SETTINGS_PAGE];

/** Props for {@link DesktopLayout}. */
export interface DesktopLayoutProps {
	/** Where the picked model is kept. */
	preferences: ChatPreferencesAdapter;
	/** Go back to the instance picker. */
	onSwitchServer: () => void;
	/** Sign out of the instance. */
	onSignOut: () => void;
}

/**
 * The signed in app: the chat, set up from the instance's playground theme,
 * beside the desktop navigation.
 *
 * @component
 */
export const DesktopLayout = ({
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

	return (
		<ChatProvider config={chatConfig}>
			<SettingsDialogProvider pages={SETTINGS_PAGES}>
				<div className="flex h-full w-full overflow-hidden">
					<DesktopNav
						onSwitchServer={onSwitchServer}
						onSignOut={onSignOut}
					/>
					<main className="min-w-0 flex-1">
						<Outlet />
					</main>
				</div>
			</SettingsDialogProvider>
		</ChatProvider>
	);
};
