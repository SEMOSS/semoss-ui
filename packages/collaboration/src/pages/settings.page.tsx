import { Outlet } from "react-router";
import { SettingsPanel } from "@/features/settings/settings-panel";

/** The persistent parent route retains drafts between settings categories. */
export function SettingsPage() {
	return (
		<>
			<SettingsPanel />
			<Outlet />
		</>
	);
}
