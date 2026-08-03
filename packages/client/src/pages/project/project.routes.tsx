import { Outlet } from "react-router-dom";
import {
	ProjectAccessControl,
	ProjectCatalog,
	ProjectEdit,
} from "@/components/project";
import {
	AppCommitsPage,
	AppFilesPage,
	AppGithubPage,
	AppGithubSelectRepoPage,
	AppMcpUsagePage,
	AppSettingsPage,
	AppSmssPage,
	NewPromptBuilderAppPage,
	ViewAppPage,
} from "../app";
import { CreateAgentPage } from "./agent/create-agent-page";
import { CreateAppPage } from "./app/create-app-page";
import { ProjectDependenciesPage } from "./project-dependencies-page";
import { ProjectLayout } from "./project-layout";
import { ProjectOverviewPage } from "./project-overview-page";
import { ProjectTabsLayout } from "./project-tabs-layout";
import { CreateSkillPage } from "./skill/create-skill-page";
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
				element: <ProjectLayout type="CODE" />,
				children: [
					{
						path: "edit",
						element: <ProjectEdit />,
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
										name: "Files",
										path: "files",
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
								path: "files",
								element: <AppFilesPage />,
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
				element: <ProjectLayout type="SKILL" />,
				children: [
					{
						path: "edit",
						element: <ProjectEdit />,
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
				element: <ProjectLayout type="WORKSPACE" />,
				children: [
					{
						path: "edit",
						element: <ProjectEdit />,
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
];
