import { useMemo, useState } from "react";
import type { Role } from "@semoss/shared";
import { Tabs, TabsList, TabsTrigger } from "@semoss/ui/next";
import { useEngine } from "@/hooks";
import { EngineActivityPage } from "@/pages/engine/engine-activity-page";
import { EngineMcpUsagePage } from "@/pages/engine/engine-mcp-usage-page";
import { EngineMetadataPage } from "@/pages/engine/engine-metadata-page";
import { EngineOverviewPage } from "@/pages/engine/engine-overview-page";
import { EngineSettingsPage } from "@/pages/engine/engine-settings-page";
import { EngineSmssPage } from "@/pages/engine/engine-smss-page";
import { EngineUsagePage } from "@/pages/engine/engine-usage-page";

interface EngineSettingsPanelProps {
	/** Settings tabs to display; differs by engine type */
	tabs: {
		/** Label shown on the tab trigger */
		name: string;

		/** Page rendered when the tab is active */
		component:
			| "overview"
			| "usage"
			| "mcp-usage"
			| "activity"
			| "metadata"
			| "access-control"
			| "smss";

		/** Restrict the tab to certain roles */
		restrict: Role[];
	}[];
}

/**
 * Renders the engine settings surfaces (overview, usage, MCP, activity,
 * metadata, access control, SMSS) inside a workbench bottom panel. The set of
 * tabs differs by engine type. Loads the engine metadata and the user's role,
 * then provides the EngineContext so the embedded pages behave the same as
 * their standalone route counterparts.
 */
export const EngineSettingsPanel: React.FC<EngineSettingsPanelProps> = ({
	tabs,
}) => {
	const { permission } = useEngine();

	const [selectedComponent, setSelectedComponent] =
		useState<EngineSettingsPanelProps["tabs"][number]["component"]>(
			"overview",
		);

	// filter the tabs to the ones the user is allowed to see
	const visibleTabs = useMemo(() => {
		return tabs.filter((tab) => {
			if (!tab.restrict || tab.restrict.length === 0) {
				return true;
			}
			if (!permission) {
				return false;
			}
			return tab.restrict.includes(permission);
		});
	}, [tabs, permission]);

	// the active tab, falling back to the first visible tab
	const activeTab = useMemo(() => {
		return (
			visibleTabs.find((tab) => tab.component === selectedComponent) ??
			visibleTabs[0]
		);
	}, [visibleTabs, selectedComponent]);

	return (
		<div className="flex h-full w-full flex-col gap-2 overflow-hidden p-2">
			{visibleTabs.length > 0 && (
				<Tabs value={activeTab?.component ?? ""}>
					<div className="w-full overflow-x-auto">
						<TabsList className="w-max flex-nowrap gap-2">
							{visibleTabs.map((tab) => (
								<TabsTrigger
									key={tab.component}
									value={tab.component}
									onClick={() => {
										setSelectedComponent(tab.component);
									}}
									data-testid={`engineSettings-${tab.name}-tab`}
								>
									{tab.name}
								</TabsTrigger>
							))}
						</TabsList>
					</div>
				</Tabs>
			)}
			<div className="w-full flex-1 overflow-auto bg-(--card) p-2">
				{activeTab?.component === "overview" && <EngineOverviewPage />}
				{activeTab?.component === "usage" && <EngineUsagePage />}
				{activeTab?.component === "mcp-usage" && <EngineMcpUsagePage />}
				{activeTab?.component === "activity" && <EngineActivityPage />}
				{activeTab?.component === "metadata" && <EngineMetadataPage />}
				{activeTab?.component === "access-control" && (
					<EngineSettingsPage />
				)}
				{activeTab?.component === "smss" && <EngineSmssPage />}
			</div>
		</div>
	);
};
