import { useLocation } from "react-router";
import { H1 } from "@semoss/ui/next";
import { AboutYou } from "@/features/collaboration/components/about-you";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { AppearanceSettings } from "./appearance-settings";
import { DataSettings } from "./data-settings";
import { RulesSettings } from "./rules-settings";
import { SettingsTabBar } from "./settings-navigation";
import { settingsSections } from "./settings-sections";

/** Route-driven categories keep form drafts mounted until the user leaves Settings. */
export function SettingsPanel() {
	const { pathname } = useLocation();
	const selected =
		settingsSections.find(({ id }) =>
			pathname.replace(/\/$/, "").endsWith(`/${id}`),
		)?.id ?? "about-you";
	return (
		<>
			<SettingsTabBar />
			<CollaborationPage>
				{/* each section titles itself */}
				<H1 className="sr-only">Settings</H1>
				<div className="min-w-0 max-w-4xl">
					<div hidden={selected !== "about-you"}>
						<AboutYou />
					</div>
					<div hidden={selected !== "appearance"}>
						<AppearanceSettings />
					</div>
					<div hidden={selected !== "rules"}>
						<RulesSettings />
					</div>
					{selected === "data" && <DataSettings />}
				</div>
			</CollaborationPage>
		</>
	);
}
