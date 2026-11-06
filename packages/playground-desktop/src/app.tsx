import { useCallback } from "react";
import { LanguageDirection } from "@semoss/chat";
import { desktopResources, I18nBuilder, I18nextProvider } from "@semoss/i18n";
import { AccessStoreProvider, createAccessStore } from "@semoss/panels";
import type { ChatPreferencesAdapter } from "@semoss/sdk";
import { Env, Session } from "@semoss/sdk";
import { ThemeProvider, Toaster } from "@semoss/ui/next";
import type { InstanceStore } from "./features/instances/instance.store";
import { InstancePickerPage } from "./features/instances/instance-picker-page";
import { DesktopRouter } from "./pages/router";
import { BEARER_TOKEN_SECRET, deleteSecret } from "./platform/keychain";

// Languages load lazily (one chunk per language) through the builder.
const i18nBuilder = new I18nBuilder(desktopResources);

/** Awaited before the first render so the active language is present. */
export const i18nReady = i18nBuilder.ready;

// The file panels resolve resource permissions off a host-supplied cache; one
// per app, since a permission is a fact about (user, resource).
const accessStore = createAccessStore();

/** Props for {@link App}. */
export interface AppProps {
	/** The saved instances. */
	instances: InstanceStore;
	/** Where the picked model is kept; null until an instance is in use. */
	preferences: ChatPreferencesAdapter | null;
}

/**
 * The desktop app: the instance picker until an instance is in use, then
 * sign in and the chat. Switching instances starts the app over (a reload),
 * so the SDK, its session and every room begin again against the new server.
 *
 * @component
 */
export const App = ({ instances, preferences }: AppProps) => {
	const startOver = useCallback(() => window.location.reload(), []);
	const handleSwitchServer = useCallback(async () => {
		await instances.setActiveInstance(null);
		startOver();
	}, [instances, startOver]);
	const handleSignOut = useCallback(async () => {
		const active = instances.activeInstance;
		// signing out forgets a remembered token too
		Env.update({ BEARER_TOKEN: "", BEARER_PROVIDER: "" });
		if (active) {
			await deleteSecret(active.id, BEARER_TOKEN_SECRET);
		}
		await Session.logout();
	}, [instances]);

	return (
		<I18nextProvider i18n={i18nBuilder.i18n}>
			<LanguageDirection>
				<AccessStoreProvider store={accessStore}>
					<ThemeProvider
						defaultTheme="system"
						storageKey="smss-ui-theme-playground-desktop"
					>
						<div className="absolute inset-0 h-screen w-screen overflow-hidden">
							{preferences && instances.activeInstance ? (
								<DesktopRouter
									instances={instances}
									preferences={preferences}
									onSwitchServer={() =>
										void handleSwitchServer()
									}
									onSignOut={() => void handleSignOut()}
								/>
							) : (
								<InstancePickerPage
									instances={instances}
									onUseInstance={startOver}
								/>
							)}
						</div>
						<Toaster position="top-center" />
					</ThemeProvider>
				</AccessStoreProvider>
			</LanguageDirection>
		</I18nextProvider>
	);
};
