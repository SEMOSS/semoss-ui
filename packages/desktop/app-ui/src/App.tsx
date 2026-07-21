import { useEffect, useState } from "react";
import { Env, InsightProvider } from "@semoss/sdk/react";
import type { EnvironmentConfig } from "../../electron/connections/types";
import { ChatShell } from "./chat-shell";
import { ConnectionsPage } from "./connections-page";
import { SettingsDialog, type SettingsTab } from "./settings-dialog";
import { TitleBar } from "./title-bar";

export const App = () => {
	const [status, setStatus] = useState<"loading" | "ready">("loading");
	const [environment, setEnvironment] = useState<EnvironmentConfig | null>(
		null,
	);
	const [signedIn, setSignedIn] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [settingsTab, setSettingsTab] = useState<SettingsTab>("appearance");

	useEffect(() => {
		void (async () => {
			const [env, isSignedIn] = await Promise.all([
				window.semossDesktop.connections.getEnvironment(),
				window.semossDesktop.connections.isSignedIn(),
			]);
			setEnvironment(env);
			setSignedIn(isSignedIn);
			setStatus("ready");
		})();
	}, []);

	const openSettings = (tab: SettingsTab) => {
		setSettingsTab(tab);
		setSettingsOpen(true);
	};

	if (status === "loading") {
		return null;
	}

	if (!signedIn || !environment) {
		return (
			<div className="flex h-screen flex-col">
				<TitleBar
					sidebarOpen={sidebarOpen}
					onToggleSidebar={() => setSidebarOpen((open) => !open)}
					onOpenSettings={() => openSettings("account")}
				/>
				<div className="min-h-0 flex-1 overflow-y-auto">
					<ConnectionsPage variant="full" />
				</div>
			</div>
		);
	}

	// Runs on every render of this branch — idempotent, and must happen
	// before InsightProvider mounts below.
	Env.update({ MODULE: environment.modulePath });

	return (
		<InsightProvider>
			<div className="flex h-screen flex-col">
				<TitleBar
					currentConnectionAlias={environment.alias}
					sidebarOpen={sidebarOpen}
					onToggleSidebar={() => setSidebarOpen((open) => !open)}
					onOpenSettings={() => openSettings("account")}
				/>
				<div className="min-h-0 flex-1">
					<ChatShell
						sidebarOpen={sidebarOpen}
						onOpenSettings={() => openSettings("appearance")}
					/>
				</div>
			</div>
			<SettingsDialog
				open={settingsOpen}
				onOpenChange={setSettingsOpen}
				defaultTab={settingsTab}
			/>
		</InsightProvider>
	);
};
