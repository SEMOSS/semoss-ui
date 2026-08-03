import type { Engine } from "@semoss/shared";
import type { Role } from "@/types";
import { EngineActivityPage } from "./engine-activity-page";
import { EngineCommitsPage } from "./engine-commits-page";
import { EngineFileManagerPage } from "./engine-file-manager-page";
import { EngineFilePage } from "./engine-file-page";
import { EngineMcpUsagePage } from "./engine-mcp-usage-page";
import { EngineMetadataPage } from "./engine-metadata-page";
import { EngineMigrationsPage } from "./engine-migrations.page";
import { EngineModelChatPage } from "./engine-model-chat-page";
import { EngineOverviewPage } from "./engine-overview-page";
import { EngineQAPage } from "./engine-qa-page";
import { EngineSettingsPage } from "./engine-settings-page";
import { EngineSmssPage } from "./engine-smss-page";
import { EngineSparqlQueryPage } from "./engine-sparql-query-page";
import { EngineSqlQueryPage } from "./engine-sql-query-page";
import { EngineStorageViewerPage } from "./engine-storage-viewer-page";
import { EngineUsagePage } from "./engine-usage-page";

export const ENGINE_ROUTES: {
	/** Name of the route */
	name: string;

	/** Path of the page */
	path: string;

	/** Type of the engine */
	type: Engine["engine_type"];

	/** Description of the engine*/
	description: string;

	/** Child paths associated with a specific engine */
	specific: {
		/** Name of the specific page */
		name: string;

		/** Path of the specific page */
		path: string;

		/** Restrict to certain roles (set to false to allow all) */
		restrict: Role[] | false;

		/** Component to render */
		component: React.FunctionComponent;
	}[];
}[] = [
	{
		name: "Function",
		path: "function",
		type: "FUNCTION",
		description:
			"Expose and reuse LLM functionality in the form of functions to promote efficiency across app development. These functions include LLM Guard scanners to ensure the secure use of LLMs. ",
		specific: [
			{
				name: "Overview",
				path: "",
				component: EngineOverviewPage,
				restrict: false,
			},
			{
				name: "Usage",
				path: "usage",
				component: EngineUsagePage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "MCP Usage",
				path: "mcp-usage",
				component: EngineMcpUsagePage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Activity Log",
				path: "activity",
				component: EngineActivityPage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Access Control",
				path: "access-control",
				component: EngineSettingsPage,
				restrict: ["EDIT", "OWNER"],
			},
			{
				name: "Files",
				path: "files",
				component: EngineFileManagerPage,
				restrict: ["EDIT", "OWNER"],
			},
			{
				name: "Commits",
				path: "commits",
				component: EngineCommitsPage,
				restrict: ["EDIT", "OWNER"],
			},
			{
				name: "SMSS",
				path: "smss",
				component: EngineSmssPage,
				restrict: ["OWNER"],
			},
		],
	},
	{
		name: "Model",
		path: "model",
		type: "MODEL",
		description:
			"Models are diverse, with particular strengths and weaknesses specific to each use case. Our model catalog exposes these models in an abstracted fashion, allowing data scientists to hand-select and/or swap models as desired.",
		specific: [
			{
				name: "Overview",
				path: "",
				component: EngineOverviewPage,
				restrict: false,
			},
			{
				name: "Usage",
				path: "usage",
				component: EngineUsagePage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "MCP Usage",
				path: "mcp-usage",
				component: EngineMcpUsagePage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Activity Log",
				path: "activity",
				component: EngineActivityPage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Chat",
				path: "chat",
				component: EngineModelChatPage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Access Control",
				path: "access-control",
				component: EngineSettingsPage,
				restrict: ["EDIT", "OWNER"],
			},
			{
				name: "Files",
				path: "files",
				component: EngineFileManagerPage,
				restrict: ["EDIT", "OWNER"],
			},
			{
				name: "SMSS",
				path: "smss",
				component: EngineSmssPage,
				restrict: ["OWNER"],
			},
		],
	},
	{
		name: "Database",
		path: "database",
		type: "DATABASE",
		description:
			"Database catalog is an integrated data nexus connecting to diverse databases and serving as a springboard for unified data orchestration, innovation, and insights. Access structured data sources like relational database management systems (RDBMS), Triplestore/RDF, graph databases, Excel/CSVs, and data exposed via API.  ",
		specific: [
			{
				name: "Overview",
				path: "",
				component: EngineOverviewPage,
				restrict: false,
			},
			{
				name: "Usage",
				path: "usage",
				component: EngineUsagePage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "MCP Usage",
				path: "mcp-usage",
				component: EngineMcpUsagePage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Activity Log",
				path: "activity",
				component: EngineActivityPage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Metadata",
				path: "metadata",
				component: EngineMetadataPage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Query",
				path: "query",
				component: EngineSqlQueryPage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Query",
				path: "sparql-query",
				component: EngineSparqlQueryPage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Migrations",
				path: "migrations",
				component: EngineMigrationsPage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Access Control",
				path: "access-control",
				component: EngineSettingsPage,
				restrict: ["EDIT", "OWNER"],
			},
			{
				name: "Files",
				path: "files",
				component: EngineFileManagerPage,
				restrict: ["EDIT", "OWNER"],
			},
			{
				name: "SMSS",
				path: "smss",
				component: EngineSmssPage,
				restrict: ["OWNER"],
			},
		],
	},
	{
		name: "Vector",
		path: "vector",
		type: "VECTOR",
		description:
			"Knowledge repositories, also known as vector databases, enable fast retrieval of information and semantic search. Create knowledge repositories on the fly and connect them for simplified reuse across apps.  ",
		specific: [
			{
				name: "Overview",
				path: "",
				component: EngineOverviewPage,
				restrict: false,
			},
			{
				name: "Usage",
				path: "usage",
				component: EngineUsagePage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "MCP Usage",
				path: "mcp-usage",
				component: EngineMcpUsagePage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Activity Log",
				path: "activity",
				component: EngineActivityPage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Documents",
				path: "documents",
				component: EngineFilePage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Q&A",
				path: "qa",
				component: EngineQAPage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Access Control",
				path: "access-control",
				component: EngineSettingsPage,
				restrict: ["EDIT", "OWNER"],
			},
			{
				name: "Files",
				path: "files",
				component: EngineFileManagerPage,
				restrict: ["EDIT", "OWNER"],
			},
			{
				name: "SMSS",
				path: "smss",
				component: EngineSmssPage,
				restrict: ["OWNER"],
			},
		],
	},
	{
		name: "Storage",
		path: "storage",
		type: "STORAGE",
		description:
			"Tapping into unstructured data (e.g., audio, video, images, code) is critical when training and using AI solutions. Our storage catalog enables integration with many industry-leading cloud storage solutions to effortlessly access a project's unstructured data.",
		specific: [
			{
				name: "Overview",
				path: "",
				component: EngineOverviewPage,
				restrict: false,
			},
			{
				name: "Usage",
				path: "usage",
				component: EngineUsagePage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "MCP Usage",
				path: "mcp-usage",
				component: EngineMcpUsagePage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Activity Log",
				path: "activity",
				component: EngineActivityPage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Storage Viewer",
				path: "storage-viewer",
				component: EngineStorageViewerPage,
				restrict: false,
			},
			{
				name: "Access Control",
				path: "access-control",
				component: EngineSettingsPage,
				restrict: ["EDIT", "OWNER"],
			},
			{
				name: "Files",
				path: "files",
				component: EngineFileManagerPage,
				restrict: ["EDIT", "OWNER"],
			},
			{
				name: "SMSS",
				path: "smss",
				component: EngineSmssPage,
				restrict: ["OWNER"],
			},
		],
	},
	{
		name: "Guardrail",
		path: "guardrail",
		type: "GUARDRAIL",
		description:
			"Guardrail Catalog is a centralized hub for managing and deploying guardrails that ensure safety, compliance, and reliability across the platform. It provides ready-to-use options like Gliner and Detoxify, and supports custom guardrail uploads via ZIP files, enabling consistent, secure, and scalable interactions.",
		specific: [
			{
				name: "Overview",
				path: "",
				component: EngineOverviewPage,
				restrict: false,
			},
			{
				name: "Usage",
				path: "usage",
				component: EngineUsagePage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Activity Log",
				path: "activity",
				component: EngineActivityPage,
				restrict: ["READ_ONLY", "EDIT", "OWNER"],
			},
			{
				name: "Access Control",
				path: "access-control",
				component: EngineSettingsPage,
				restrict: ["EDIT", "OWNER"],
			},
			{
				name: "Files",
				path: "files",
				component: EngineFileManagerPage,
				restrict: ["EDIT", "OWNER"],
			},
			{
				name: "SMSS",
				path: "smss",
				component: EngineSmssPage,
				restrict: ["OWNER"],
			},
		],
	},
];
