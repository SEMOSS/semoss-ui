import { NavLink, useLocation } from "react-router";
import { cn } from "@semoss/ui/next";
import { AboutYou } from "@/features/collaboration/components/about-you";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { CollaborationPageHeader } from "@/features/collaboration/components/collaboration-page-header";
import { AppearanceSettings } from "./appearance-settings";
import { DataSettings } from "./data-settings";
import { RulesSettings } from "./rules-settings";
import { settingsSections } from "./settings-sections";

/** Route-driven categories keep form drafts mounted until the user leaves Settings. */
export function SettingsPanel() {
	const { pathname } = useLocation();
	const selected =
		settingsSections.find(({ id }) =>
			pathname.replace(/\/$/, "").endsWith(`/${id}`),
		)?.id ?? "about-you";
	return (
		<CollaborationPage>
			<CollaborationPageHeader
				title="Settings"
				description="Your profile, preferences, and workspace configuration."
			/>
			<div className="flex min-w-0 flex-col gap-4 md:flex-row md:gap-6">
				<nav
					aria-label="Settings categories"
					className="flex shrink-0 flex-wrap gap-1 md:w-44 md:flex-col md:self-start"
				>
					{settingsSections.map(({ id, label }) => (
						<NavLink
							key={id}
							to={`/settings/${id}`}
							className={({ isActive }) =>
								cn(
									"flex min-h-11 items-center rounded-lg px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring",
									isActive
										? "bg-muted font-medium text-foreground"
										: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
								)
							}
						>
							{label}
						</NavLink>
					))}
				</nav>
				<div className="min-w-0 max-w-4xl flex-1">
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
			</div>
		</CollaborationPage>
	);
}
