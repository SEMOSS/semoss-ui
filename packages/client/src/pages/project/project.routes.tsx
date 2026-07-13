import { Outlet } from "react-router-dom";
import { ProjectCatalog, ProjectEdit } from "@/components/project";
import {
	AppAccessControlPage,
	AppCommitsPage,
	AppDependenciesPage,
	AppFilesPage,
	AppGithubPage,
	AppGithubSelectRepoPage,
	AppMcpUsagePage,
	AppOverviewPage,
	AppSettingsPage,
	AppSmssPage,
	NewPromptBuilderAppPage,
	ProjectDetailLayout,
	ViewAppPage,
} from "../app";
import { CreateAgentPage } from "./agent/create-agent-page";
import { CreateAppPage } from "./app/create-app-page";
import { CreateSkillPage } from "./skill/create-skill-page";

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
				path: ":appId/edit",
				element: <ProjectEdit type="CODE" />,
			},
			{
				path: ":appId/view",
				element: <ViewAppPage />,
			},
			{
				path: ":appId",
				element: (
					<ProjectDetailLayout
						tabs={[
							{ name: "Overview", path: "" },
							{
								name: "Dependencies",
								path: "dependencies",
								restrict: ["OWNER", "EDIT", "READ_ONLY"],
							},
							{
								name: "MCP Usage",
								path: "mcp-usage",
								restrict: ["OWNER", "EDIT", "READ_ONLY"],
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
							{ name: "SMSS", path: "smss", restrict: ["OWNER"] },
						]}
						embedded={false}
						showNav={true}
					/>
				),
				children: [
					{
						path: "",
						element: <AppOverviewPage />,
					},
					{
						path: "dependencies",
						element: <AppDependenciesPage />,
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
						element: <AppAccessControlPage />,
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
				path: ":appId/edit",
				element: <ProjectEdit type="SKILL" />,
			},
			{
				path: ":appId",
				element: (
					<ProjectDetailLayout
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
							{ name: "SMSS", path: "smss", restrict: ["OWNER"] },
						]}
						embedded={false}
						showNav={true}
					/>
				),
				children: [
					{
						path: "",
						element: <AppOverviewPage />,
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
						element: <AppAccessControlPage />,
					},

					{
						path: "smss",
						element: <AppSmssPage />,
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
				path: ":appId/edit",
				element: <ProjectEdit type="WORKSPACE" />,
			},
			{
				path: ":appId",
				element: (
					<ProjectDetailLayout
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
							{ name: "SMSS", path: "smss", restrict: ["OWNER"] },
						]}
						embedded={false}
						showNav={true}
					/>
				),
				children: [
					{
						path: "",
						element: <AppOverviewPage />,
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
						element: <AppAccessControlPage />,
					},

					{
						path: "smss",
						element: <AppSmssPage />,
					},
				],
			},
		],
	},
];
