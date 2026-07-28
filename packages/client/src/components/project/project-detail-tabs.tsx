import { useMemo, useState } from "react";
import type { Role } from "@semoss/shared";
import { Tabs, TabsList, TabsTrigger } from "@semoss/ui/next";
import { ProjectAccessControl, ProjectOverview } from "@/components/project";
import { useProject } from "@/hooks";
import { AppActivityPage } from "@/pages/app/app-activity-page";
import { AppCommitsPage } from "@/pages/app/app-commits-page";
import { AppFilesPage } from "@/pages/app/app-files-page";
import { AppGithubPage } from "@/pages/app/app-github-page";
import { AppMcpUsagePage } from "@/pages/app/app-mcp-usage-page";
import { AppSettingsPage } from "@/pages/app/app-settings-page";
import { AppSmssPage } from "@/pages/app/app-smss-page";
import { ProjectDependenciesPage } from "@/pages/project/project-dependencies-page";

interface ProjectDetailTabsProps {
	/** Tabs to show */
	tabs: {
		name: string;
		component:
			| "project-overview"
			| "project-dependencies"
			| "mcp-usage"
			| "activity"
			| "commits"
			| "github"
			| "settings"
			| "access-control"
			| "files"
			| "smss";
		restrict?: Role[];
	}[];
}

export const ProjectDetailTabs = ({ tabs }: ProjectDetailTabsProps) => {
	const { project, permission, refresh } = useProject();

	const [selectedTabName, setSelectedTabName] = useState<string>("Overview");

	// see all the visible tabs
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

	// the current active tab index based on the current pathname
	const activeTabIdx = useMemo(() => {
		const idx = visibleTabs.findIndex((t) => t.name === selectedTabName);
		return idx >= 0 ? idx : 0;
	}, [visibleTabs, selectedTabName]);

	const activeTab = activeTabIdx >= 0 ? visibleTabs[activeTabIdx] : undefined;

	return (
		<div
			className={`flex h-full w-full flex-col gap-2 overflow-hidden bg-card p-2`}
		>
			{visibleTabs.length > 0 && (
				<Tabs value={activeTab?.component ?? ""}>
					<div className="w-full overflow-x-auto">
						<TabsList className="w-max flex-nowrap gap-2">
							{visibleTabs.map((tab) => (
								<TabsTrigger
									key={tab.name}
									value={tab.component}
									onClick={() => {
										setSelectedTabName(tab.name);
									}}
									data-testid={`appDetail-${tab.name}-tab`}
								>
									{tab.name}
								</TabsTrigger>
							))}
						</TabsList>
					</div>
				</Tabs>
			)}
			<div className="w-full flex-1 overflow-auto bg-card p-2">
				{/** TODO: should not be loading in Page. Load in the component directly */}
				{activeTab?.component === "project-overview" && (
					<ProjectOverview
						project={project}
						permission={permission}
						refresh={refresh}
					/>
				)}
				{activeTab?.component === "project-dependencies" && (
					<ProjectDependenciesPage />
				)}
				{activeTab?.component === "mcp-usage" && <AppMcpUsagePage />}
				{activeTab?.component === "activity" && <AppActivityPage />}
				{activeTab?.component === "commits" && <AppCommitsPage />}
				{activeTab?.component === "github" && <AppGithubPage />}
				{activeTab?.component === "settings" && <AppSettingsPage />}
				{activeTab?.component === "access-control" && (
					<ProjectAccessControl />
				)}
				{activeTab?.component === "files" && <AppFilesPage />}
				{activeTab?.component === "smss" && <AppSmssPage />}
			</div>
		</div>
	);
};
