import { Navigate, Outlet } from "react-router";
import { ProjectAccessControl, ProjectCatalog } from "@/components/project";
import { AutomationWorkbenchPage } from "@/components/workbench/automation";
import {
	AppGithubPage,
	AppGithubSelectRepoPage,
	AppMcpUsagePage,
	AppSmssPage,
	NewPromptBuilderAppPage,
	ViewAppPage,
} from "../app";
import { AppActivityPage } from "../app/app-activity-page";
import { AgentActivityPage } from "./agent/agent-activity-page";
import { AgentOverviewPage } from "./agent/agent-overview-page";
import { CreateAgentPage } from "./agent/create-agent-page";
import { EditAgentPage } from "./agent/edit-agent-page";
import { CreateAppPage } from "./app/create-app-page";
import { EditAppPage } from "./app/edit-app-page";
import { CreateAutomationPage } from "./automation/create-automation-page";
import { CreateNotebookPage } from "./notebook/create-notebook-page";
import { EditNotebookPage } from "./notebook/edit-notebook-page";
import { ViewNotebookPage } from "./notebook/view-notebook-page";
import { ProjectAuditPage } from "./project-audit.page";
import { ProjectDependenciesPage } from "./project-dependencies-page";
import { ProjectLayout } from "./project-layout";
import { ProjectOverviewPage } from "./project-overview-page";
import { ProjectSettingsLayout } from "./project-settings-layout";
import { PROJECT_SETTINGS_SECTIONS } from "./project-settings-sections";
import { ProjectTabsLayout } from "./project-tabs-layout";
import { CreateSkillPage } from "./skill/create-skill-page";
import { EditSkillPage } from "./skill/edit-skill-page";
import { ViewSkillPage } from "./skill/view-skill-page";

/** One project route. */
interface ProjectRoute {
	/** Name of the specific path */
	path: string;

	/** Element to render */
	element: React.ReactNode;

	/** Child routes */
	children?: ProjectRoute[];
}

/**
 * The Settings tab every project type shares: each section at its own path,
 * in the left-menu layout, which shows the sections the viewer has on the
 * project and sends any other path to the first of them.
 *
 * @returns The route.
 */
const buildProjectSettingsRoute = (): ProjectRoute => ({
	path: "settings",
	element: <ProjectSettingsLayout />,
	children: [
		...PROJECT_SETTINGS_SECTIONS.map(({ path, element }) => ({
			path,
			element,
		})),
		{ path: "*", element: null },
	],
});

export const PROJECT_ROUTES: ProjectRoute[] = [
	{
		path: "app",
		element: <Outlet />,
		children: [
			{
				path: "",
				element: <ProjectCatalog type="CODE" />,
			},
			{
				path: "new",
				element: <CreateAppPage />,
			},
			{
				path: "new/prompt",
				element: <NewPromptBuilderAppPage />,
			},
			{
				path: ":appId",
				element: <ProjectLayout />,
				children: [
					{
						path: "edit",
						element: <EditAppPage />,
					},
					{
						path: "view",
						element: <ViewAppPage />,
					},
					{
						path: "*",
						element: (
							<ProjectTabsLayout
								tabs={[
									{ name: "Overview", path: "" },
									{
										name: "Dependencies",
										path: "dependencies",
										restrict: [
											"OWNER",
											"EDIT",
											"READ_ONLY",
										],
									},
									{
										name: "MCP",
										path: "mcp-usage",
										restrict: [
											"OWNER",
											"EDIT",
											"READ_ONLY",
										],
									},
									{
										name: "Activity Log",
										path: "activity",
										restrict: [
											"OWNER",
											"EDIT",
											"READ_ONLY",
										],
									},
									{
										name: "GitHub",
										path: "github",
										restrict: ["OWNER"],
									},
									{
										name: "Access Control",
										path: "access-control",
										restrict: ["OWNER", "EDIT"],
									},
									{
										name: "Audit Trail",
										path: "audit",
										restrict: ["OWNER"],
									},
									{
										name: "Settings",
										path: "settings",
										restrict: ["OWNER", "EDIT"],
									},
									{
										name: "SMSS",
										path: "smss",
										restrict: ["OWNER"],
									},
								]}
							/>
						),
						children: [
							{
								path: "",
								element: <ProjectOverviewPage />,
							},
							{
								path: "dependencies",
								element: <ProjectDependenciesPage />,
							},
							{
								path: "mcp-usage",
								element: <AppMcpUsagePage />,
							},
							{
								path: "activity",
								element: <AppActivityPage />,
							},

							{
								path: "github",
								element: <AppGithubPage />,
							},
							{
								path: "github/select-repo",
								element: <AppGithubSelectRepoPage />,
							},
							buildProjectSettingsRoute(),
							{
								path: "access-control",
								element: <ProjectAccessControl />,
							},
							{
								path: "audit",
								element: <ProjectAuditPage />,
							},
							{
								path: "access-control/bulk-access-management",
								element: (
									<ProjectAccessControl view="BULK_ACCESS_MANAGEMENT" />
								),
							},
							{
								path: "access-control/effective-permissions",
								element: (
									<ProjectAccessControl view="EFFECTIVE" />
								),
							},
							{
								path: "smss",
								element: <AppSmssPage />,
							},
						],
					},
				],
			},
		],
	},
	{
		path: "skill",
		element: <Outlet />,
		children: [
			{
				path: "",
				element: <ProjectCatalog type="SKILL" />,
			},
			{
				path: "new",
				element: <CreateSkillPage />,
			},
			{
				path: ":appId",
				element: <ProjectLayout />,
				children: [
					{
						path: "edit",
						element: <EditSkillPage />,
					},
					{
						path: "view",
						element: <ViewSkillPage />,
					},
					{
						path: "*",
						element: (
							<ProjectTabsLayout
								tabs={[
									{ name: "Overview", path: "" },
									{
										name: "MCP",
										path: "mcp-usage",
										restrict: [
											"OWNER",
											"EDIT",
											"READ_ONLY",
										],
									},
									{
										name: "Activity Log",
										path: "activity",
										restrict: [
											"OWNER",
											"EDIT",
											"READ_ONLY",
										],
									},
									{
										name: "GitHub",
										path: "github",
										restrict: ["OWNER"],
									},
									{
										name: "Access Control",
										path: "access-control",
										restrict: ["OWNER", "EDIT"],
									},
									{
										name: "Audit Trail",
										path: "audit",
										restrict: ["OWNER"],
									},
									{
										name: "Settings",
										path: "settings",
										restrict: ["OWNER", "EDIT"],
									},
									{
										name: "SMSS",
										path: "smss",
										restrict: ["OWNER"],
									},
								]}
							/>
						),
						children: [
							{
								path: "",
								element: <ProjectOverviewPage />,
							},
							{
								// a skill serves its own tools, so there is no
								// remote endpoint to repoint it at
								path: "mcp-usage",
								element: (
									<AppMcpUsagePage
										showRemoteConnection={false}
									/>
								),
							},
							{
								path: "activity",
								element: <AppActivityPage />,
							},

							{
								path: "github",
								element: <AppGithubPage />,
							},
							{
								path: "github/select-repo",
								element: <AppGithubSelectRepoPage />,
							},
							{
								path: "access-control",
								element: <ProjectAccessControl />,
							},
							{
								path: "access-control/bulk-access-management",
								element: (
									<ProjectAccessControl view="BULK_ACCESS_MANAGEMENT" />
								),
							},
							{
								path: "access-control/effective-permissions",
								element: (
									<ProjectAccessControl view="EFFECTIVE" />
								),
							},
							buildProjectSettingsRoute(),
							{
								path: "audit",
								element: <ProjectAuditPage />,
							},
							{
								path: "smss",
								element: <AppSmssPage />,
							},
						],
					},
				],
			},
		],
	},
	{
		path: "notebook",
		element: <Outlet />,
		children: [
			{
				path: "",
				element: <ProjectCatalog type="NOTEBOOK" />,
			},
			{
				path: "new",
				element: <CreateNotebookPage />,
			},
			{
				path: ":appId",
				element: <ProjectLayout />,
				children: [
					{
						path: "edit",
						element: <EditNotebookPage />,
					},
					{
						path: "view",
						element: <ViewNotebookPage />,
					},
					{
						path: "*",
						element: (
							<ProjectTabsLayout
								tabs={[
									{ name: "Overview", path: "" },
									{
										name: "Activity Log",
										path: "activity",
										restrict: [
											"OWNER",
											"EDIT",
											"READ_ONLY",
										],
									},
									{
										name: "GitHub",
										path: "github",
										restrict: ["OWNER"],
									},
									{
										name: "Access Control",
										path: "access-control",
										restrict: ["OWNER", "EDIT"],
									},
									{
										name: "Audit Trail",
										path: "audit",
										restrict: ["OWNER"],
									},
									{
										name: "Settings",
										path: "settings",
										restrict: ["OWNER", "EDIT"],
									},
									{
										name: "SMSS",
										path: "smss",
										restrict: ["OWNER"],
									},
								]}
							/>
						),
						children: [
							{
								path: "",
								element: <ProjectOverviewPage />,
							},
							{
								path: "activity",
								element: <AppActivityPage />,
							},

							{
								path: "github",
								element: <AppGithubPage />,
							},
							{
								path: "github/select-repo",
								element: <AppGithubSelectRepoPage />,
							},
							{
								path: "access-control",
								element: <ProjectAccessControl />,
							},
							{
								path: "access-control/bulk-access-management",
								element: (
									<ProjectAccessControl view="BULK_ACCESS_MANAGEMENT" />
								),
							},
							{
								path: "access-control/effective-permissions",
								element: (
									<ProjectAccessControl view="EFFECTIVE" />
								),
							},
							buildProjectSettingsRoute(),
							{
								path: "audit",
								element: <ProjectAuditPage />,
							},
							{
								path: "smss",
								element: <AppSmssPage />,
							},
						],
					},
				],
			},
		],
	},
	{
		path: "automation",
		element: <Outlet />,
		children: [
			{
				path: "",
				element: <ProjectCatalog type="AUTOMATION" />,
			},
			{
				path: "new",
				element: <CreateAutomationPage />,
			},
			{
				path: ":appId",
				element: <ProjectLayout />,
				children: [
					{
						path: "edit",
						element: <AutomationWorkbenchPage />,
					},
					{
						path: "*",
						element: (
							<ProjectTabsLayout
								tabs={[
									{ name: "Overview", path: "" },
									{
										name: "Dependencies",
										path: "dependencies",
										restrict: [
											"OWNER",
											"EDIT",
											"READ_ONLY",
										],
									},
									{
										name: "MCP",
										path: "mcp-usage",
										restrict: [
											"OWNER",
											"EDIT",
											"READ_ONLY",
										],
									},
									{
										name: "Activity Log",
										path: "activity",
										restrict: [
											"OWNER",
											"EDIT",
											"READ_ONLY",
										],
									},
									{
										name: "GitHub",
										path: "github",
										restrict: ["OWNER"],
									},
									{
										name: "Access Control",
										path: "access-control",
										restrict: ["OWNER", "EDIT"],
									},
									{
										name: "Audit Trail",
										path: "audit",
										restrict: ["OWNER"],
									},
									{
										name: "Settings",
										path: "settings",
										restrict: ["OWNER", "EDIT"],
									},
									{
										name: "SMSS",
										path: "smss",
										restrict: ["OWNER"],
									},
								]}
							/>
						),
						children: [
							{
								path: "",
								element: <ProjectOverviewPage />,
							},
							{
								path: "dependencies",
								element: <ProjectDependenciesPage />,
							},
							{
								path: "mcp-usage",
								element: <AppMcpUsagePage />,
							},
							{
								path: "activity",
								element: <AppActivityPage />,
							},

							{
								path: "github",
								element: <AppGithubPage />,
							},
							{
								path: "github/select-repo",
								element: <AppGithubSelectRepoPage />,
							},
							buildProjectSettingsRoute(),
							{
								path: "access-control",
								element: <ProjectAccessControl />,
							},
							{
								path: "audit",
								element: <ProjectAuditPage />,
							},
							{
								path: "access-control/bulk-access-management",
								element: (
									<ProjectAccessControl view="BULK_ACCESS_MANAGEMENT" />
								),
							},
							{
								path: "access-control/effective-permissions",
								element: (
									<ProjectAccessControl view="EFFECTIVE" />
								),
							},
							{
								path: "smss",
								element: <AppSmssPage />,
							},
						],
					},
				],
			},
		],
	},
	{
		path: "agent",
		element: <Outlet />,
		children: [
			{
				path: "",
				element: <ProjectCatalog type="WORKSPACE" />,
			},
			{
				path: "new",
				element: <CreateAgentPage />,
			},
			{
				path: ":appId",
				element: <ProjectLayout />,
				children: [
					{
						path: "edit",
						element: <EditAgentPage />,
					},
					{
						// Agents land on their Overview tab; keep old /view
						// links working
						path: "view",
						element: <Navigate to=".." relative="path" replace />,
					},
					{
						path: "*",
						element: (
							<ProjectTabsLayout
								tabs={[
									{ name: "Overview", path: "" },
									{
										name: "GitHub",
										path: "github",
										restrict: ["OWNER"],
									},
									{
										name: "Agent Activity",
										path: "agent-activity",
										restrict: [
											"OWNER",
											"EDIT",
											"READ_ONLY",
										],
									},
									{
										name: "Activity Log",
										path: "activity",
										restrict: [
											"OWNER",
											"EDIT",
											"READ_ONLY",
										],
									},
									{
										name: "Access Control",
										path: "access-control",
										restrict: ["OWNER", "EDIT"],
									},
									{
										name: "Audit Trail",
										path: "audit",
										restrict: ["OWNER"],
									},
									{
										name: "Settings",
										path: "settings",
										restrict: [
											"OWNER",
											"EDIT",
											"READ_ONLY",
										],
									},
									{
										name: "SMSS",
										path: "smss",
										restrict: ["OWNER"],
									},
								]}
							/>
						),
						children: [
							{
								path: "",
								element: <AgentOverviewPage />,
							},
							buildProjectSettingsRoute(),
							{
								path: "github",
								element: <AppGithubPage />,
							},
							{
								path: "github/select-repo",
								element: <AppGithubSelectRepoPage />,
							},
							{
								path: "agent-activity",
								element: <AgentActivityPage />,
							},
							{
								path: "activity",
								element: <AppActivityPage />,
							},
							{
								path: "access-control",
								element: <ProjectAccessControl />,
							},
							{
								path: "audit",
								element: <ProjectAuditPage />,
							},
							{
								path: "access-control/bulk-access-management",
								element: (
									<ProjectAccessControl view="BULK_ACCESS_MANAGEMENT" />
								),
							},
							{
								path: "access-control/effective-permissions",
								element: (
									<ProjectAccessControl view="EFFECTIVE" />
								),
							},
							{
								path: "smss",
								element: <AppSmssPage />,
							},
						],
					},
				],
			},
		],
	},
];
