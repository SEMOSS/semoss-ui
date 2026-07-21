import { useEffect, useState } from "react";
import { Env, InsightProvider } from "@semoss/sdk/react";
import type { ConnectionRecord } from "../../electron/connections/types";
import { ChatShell } from "./chat-shell";
import { ConnectionsPage } from "./connections-page";
import { SettingsDialog } from "./settings-dialog";
import { TitleBar } from "./title-bar";

export const App = () => {
	const [status, setStatus] = useState<"loading" | "ready">("loading");
	const [connection, setConnection] = useState<ConnectionRecord | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [settingsTab, setSettingsTab] = useState<
		"appearance" | "connections"
	>("appearance");

	useEffect(() => {
		void (async () => {
			const [list, currentId] = await Promise.all([
				window.semossDesktop.connections.list(),
				window.semossDesktop.connections.getCurrentId(),
			]);
			setConnection(list.find((c) => c.id === currentId) ?? null);
			setStatus("ready");
		})();
	}, []);

	const openSettings = (tab: "appearance" | "connections") => {
		setSettingsTab(tab);
		setSettingsOpen(true);
	};

	if (status === "loading") {
		return null;
	}

	if (!connection) {
		return (
			<div className="flex h-screen flex-col">
				<TitleBar
					sidebarOpen={sidebarOpen}
					onToggleSidebar={() => setSidebarOpen((open) => !open)}
					onOpenSettings={() => openSettings("connections")}
				/>
				<div className="min-h-0 flex-1 overflow-y-auto">
					<ConnectionsPage variant="full" />
				</div>
			</div>
		);
	}

	// Runs on every render of this branch — idempotent, and must happen
	// before InsightProvider mounts below.
	Env.update({ MODULE: connection.modulePath });

	return (
		<InsightProvider>
			<div className="flex h-screen flex-col">
				<TitleBar
					currentConnectionAlias={connection.alias}
					sidebarOpen={sidebarOpen}
					onToggleSidebar={() => setSidebarOpen((open) => !open)}
					onOpenSettings={() => openSettings("connections")}
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
