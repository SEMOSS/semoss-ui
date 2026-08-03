import { Pencil } from "lucide-react";
import { createElement, useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import type { Project, ProjectDependency, Role } from "@semoss/shared";
import {
	Button,
	Dialog,
	DialogContent,
	Spinner,
	Tabs,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { ResourceNotFound } from "@/components/common/resource-not-found";
import { ShareOverlay } from "@/components/ui";
import { ProjectContext } from "@/contexts";
import { useAPI, useRootStore } from "@/hooks";
import { AppAccessControlPage } from "@/pages/app/app-access-control-page";
import { AppActivityPage } from "@/pages/app/app-activity-page";
import { AppCommitsPage } from "@/pages/app/app-commits-page";
import { AppFilesPage } from "@/pages/app/app-files-page";
import { AppGithubPage } from "@/pages/app/app-github-page";
import { AppMcpUsagePage } from "@/pages/app/app-mcp-usage-page";
import { AppOverviewPage } from "@/pages/app/app-overview-page";
import { AppSettingsPage } from "@/pages/app/app-settings-page";
import { AppSmssPage } from "@/pages/app/app-smss-page";
import { ProjectDependenciesPage } from "@/pages/project/project-dependencies-page";
import { normalizeTagArray } from "@/utility";
import { EditProjectDetailDialog } from "./edit-project-detail-dialog";

const EMBEDDED_TAB_COMPONENTS: Record<string, React.FunctionComponent> = {
	"": AppOverviewPage,
	dependencies: ProjectDependenciesPage,
	"mcp-usage": AppMcpUsagePage,
	activity: AppActivityPage,
	commits: AppCommitsPage,
	github: AppGithubPage,
	settings: AppSettingsPage,
	"access-control": AppAccessControlPage,
	files: AppFilesPage,
	smss: AppSmssPage,
};

interface ProjectDetailTabsProps {
	/** Type of the route */
	type: Project["project_type"];

	/** Tabs to show */
	tabs: {
		name: string;
		path: string;
		restrict?: Role[];
	}[];
}

export const ProjectDetailTabs = ({
	type: _type,
	tabs,
}: ProjectDetailTabsProps) => {
	const { appId } = useParams();

	const { configStore } = useRootStore();

	const [selectedTabName, setSelectedTabName] = useState<string>("Overview");
	const [isShareOverlayOpen, setIsShareOverlayOpen] = useState(false);
	const [isEditDetailsModalOpen, setIsEditDetailsModalOpen] = useState(false);

	// get a user's permission
	const getUserEnginePermission = useAPI(
		appId ? ["getUserProjectPermission", appId] : null,
		{
			data: undefined,
		},
	);

	// get dependencies for the project
	const getDependencies = usePixel<{
		engines: ProjectDependency[];
		dependencies: string[];
	}>(appId ? `GetProjectDependencies(project=["${appId}"]);` : "");

	// the core metadata keys plus any dynamic ones from the project config
	const metaKeys = useMemo(() => {
		const dynamicKeys = configStore.store.config.projectMetaKeys
			.map((k) => k.metakey)
			.filter(
				(key) =>
					key !== "description" &&
					key !== "markdown" &&
					key !== "tag" &&
					key !== "tags",
			);
		return ["description", "markdown", "tag", ...dynamicKeys];
	}, [configStore.store.config.projectMetaKeys]);

	// get the metadata for the project
	const getMetadata = usePixel<Project>(
		appId
			? `GetProjectMetadata(project=["${appId}"], metaKeys=${JSON.stringify(metaKeys)});`
			: "",
	);

	/**
	 * Refresh the project data
	 */
	const refresh = useCallback(async () => {
		getDependencies.refresh();
		getUserEnginePermission.refresh();
		getMetadata.refresh();
	}, [
		getDependencies.refresh,
		getUserEnginePermission.refresh,
		getMetadata.refresh,
	]);

	const tags = useMemo(
		() => normalizeTagArray(getMetadata.data?.tag),
		[getMetadata.data?.tag],
	);

	// see all the visible tabs
	const visibleTabs = useMemo(() => {
		return tabs.filter((tab) => {
			if (!tab.restrict || tab.restrict.length === 0) {
				return true;
			}
			if (!getUserEnginePermission.data) {
				return false;
			}
			return tab.restrict.includes(getUserEnginePermission.data);
		});
	}, [tabs, getUserEnginePermission.data]);

	// the current active tab index based on the current pathname
	const activeTabIdx = useMemo(() => {
		const idx = visibleTabs.findIndex((t) => t.name === selectedTabName);
		return idx >= 0 ? idx : 0;
	}, [visibleTabs, selectedTabName]);

	if (
		getUserEnginePermission.status === "ERROR" ||
		getDependencies.status === "ERROR" ||
		getMetadata.status === "ERROR"
	) {
		return <ResourceNotFound path="/app" />;
	}

	if (
		getUserEnginePermission.status !== "SUCCESS" ||
		!getUserEnginePermission.data ||
		getDependencies.status !== "SUCCESS" ||
		getMetadata.status !== "SUCCESS"
	) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	const activeTab = activeTabIdx >= 0 ? visibleTabs[activeTabIdx] : undefined;
	const embeddedComponent = activeTab
		? EMBEDDED_TAB_COMPONENTS[activeTab.path]
		: undefined;

	return (
		<ProjectContext.Provider
			value={{
				appId: getMetadata.data.project_id || "",
				project: getMetadata.data,
				permission: getUserEnginePermission.data,
				dependencies: getDependencies.data?.engines || [],
				tags,
				refresh,
			}}
		>
			<div
				className={`flex h-full w-full flex-col gap-2 overflow-hidden bg-card p-2`}
			>
				{visibleTabs.length > 0 && (
					<Tabs value={activeTab?.path ?? ""}>
						<div className="w-full overflow-x-auto">
							<TabsList className="w-max flex-nowrap gap-2">
								{visibleTabs.map((tab) => (
									<TabsTrigger
										key={tab.name}
										value={tab.path}
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
					{activeTab?.path === "" &&
						getUserEnginePermission.data !== "DISCOVERABLE" &&
						getUserEnginePermission.data !== "READ_ONLY" && (
							<div className="flex justify-end">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="outline"
											size="icon"
											aria-label="Edit"
											onClick={() => {
												setIsEditDetailsModalOpen(true);
											}}
											data-testid="appDetail-edit-btn"
										>
											<Pencil className="size-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Edit</TooltipContent>
								</Tooltip>
							</div>
						)}
					{embeddedComponent
						? createElement(embeddedComponent, {})
						: null}
				</div>
			</div>

			<Dialog
				open={isShareOverlayOpen}
				onOpenChange={(o) => !o && setIsShareOverlayOpen(false)}
			>
				<DialogContent className="max-w-lg p-0">
					<ShareOverlay
						appId={appId || ""}
						diffs={false}
						onClose={() => setIsShareOverlayOpen(false)}
					/>
				</DialogContent>
			</Dialog>

			<EditProjectDetailDialog
				open={isEditDetailsModalOpen}
				project={getMetadata.data}
				onClose={(success) => {
					if (success) {
						refresh();
					}

					setIsEditDetailsModalOpen(false);
				}}
			/>
		</ProjectContext.Provider>
	);
};
