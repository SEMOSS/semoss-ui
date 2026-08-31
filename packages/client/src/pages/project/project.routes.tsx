import { Outlet } from "react-router-dom";
import { AutomationWorkbenchPage } from "@/components/automation-workspace";
import { ProjectAccessControl, ProjectCatalog } from "@/components/project";
import {
	AppCommitsPage,
	AppGithubPage,
	AppGithubSelectRepoPage,
	AppMcpUsagePage,
	AppSettingsPage,
	AppSmssPage,
	NewPromptBuilderAppPage,
	ViewAppPage,
} from "../app";
import { AgentActivityPage } from "./agent/agent-activity-page";
import { CreateAgentPage } from "./agent/create-agent-page";
import { EditAgentPage } from "./agent/edit-agent-page";
import { CreateAppPage } from "./app/create-app-page";
import { EditAppPage } from "./app/edit-app-page";
import { CreateAutomationPage } from "./automation/create-automation-page";
import { CreateNotebookPage } from "./notebook/create-notebook-page";
import { EditNotebookPage } from "./notebook/edit-notebook-page";
import { ViewNotebookPage } from "./notebook/view-notebook-page";
import { ProjectDependenciesPage } from "./project-dependencies-page";
import { ProjectLayout } from "./project-layout";
import { ProjectOverviewPage } from "./project-overview-page";
import { ProjectTabsLayout } from "./project-tabs-layout";
import { CreateSkillPage } from "./skill/create-skill-page";
import { EditSkillPage } from "./skill/edit-skill-page";
import { ViewSkillPage } from "./skill/view-skill-page";

export const PROJECT_ROUTES: {
	/** Name of the specific path */
	path: string;

	/** Element to render */
	element: React.ReactNode;

	/** Child routes */
	children?: (typeof PROJECT_ROUTES)[number][];
}[] = [
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
										name: "Commits",
										path: "commits",
										restrict: ["OWNER", "EDIT"],
									},
									{
										name: "GitHub",
										path: "github",
										restrict: ["OWNER"],
									},
									{
										name: "Settings",
										path: "settings",
										restrict: ["OWNER"],
									},
									{
										name: "Access Control",
										path: "access-control",
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
								path: "commits",
								element: <AppCommitsPage />,
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
								path: "settings",
								element: <AppSettingsPage />,
							},
							{
								path: "access-control",
								element: <ProjectAccessControl />,
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
										name: "Commits",
										path: "commits",
										restrict: ["OWNER", "EDIT"],
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
								path: "commits",
								element: <AppCommitsPage />,
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
										name: "Commits",
										path: "commits",
										restrict: ["OWNER", "EDIT"],
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
								path: "commits",
								element: <AppCommitsPage />,
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
						path: "*",
						element: (
							<ProjectTabsLayout
								tabs={[
									{ name: "Overview", path: "" },
									{
										name: "Commits",
										path: "commits",
										restrict: ["OWNER", "EDIT"],
									},
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
										name: "Access Control",
										path: "access-control",
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
								path: "commits",
								element: <AppCommitsPage />,
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
								path: "agent-activity",
								element: <AgentActivityPage />,
							},
							{
								path: "access-control",
								element: <ProjectAccessControl />,
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
