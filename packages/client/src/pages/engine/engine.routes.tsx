import { Navigate, Outlet } from "react-router-dom";
import { ImportPage } from "../import";
import { EngineActivityPage } from "./engine-activity-page";
import { EngineCommitsPage } from "./engine-commits-page";
import { EngineFileManagerPage } from "./engine-file-manager-page";
import { EngineFilePage } from "./engine-file-page";
import { EngineIndexPage } from "./engine-index-page";
import { EngineLayout } from "./engine-layout";
import { EngineMcpUsagePage } from "./engine-mcp-usage-page";
import { EngineMetadataPage } from "./engine-metadata-page";
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
	/** Name of the specific path */
	path: string;

	/** Element to render */
	element: React.ReactNode;

	/** Child routes */
	children?: (typeof ENGINE_ROUTES)[number][];
}[] = [
	// FUNCTION
	{
		path: "function",
		element: <Outlet />,
		children: [
			{
				path: "",
				element: (
					<EngineIndexPage
						name="Function"
						path="function"
						type="FUNCTION"
						description="Expose and reuse LLM functionality in the form of functions to promote efficiency across app development. These functions include LLM Guard scanners to ensure the secure use of LLMs. "
					/>
				),
			},
			{
				path: "new",
				element: <ImportPage name="Function" type="FUNCTION" />,
			},
			{
				path: ":engineId",
				element: (
					<EngineLayout
						name="Function"
						path="function"
						type="FUNCTION"
						tabs={[
							{
								name: "Overview",
								path: "",
								restrict: [
									"READ_ONLY",
									"EDIT",
									"OWNER",
									"DISCOVERABLE",
								],
							},
							{
								name: "Usage",
								path: "usage",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "MCP",
								path: "mcp-usage",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "Activity Log",
								path: "activity",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "Access Control",
								path: "access-control",
								restrict: ["EDIT", "OWNER"],
							},
							{
								name: "Files",
								path: "files",
								restrict: ["EDIT", "OWNER"],
							},
							{
								name: "Commits",
								path: "commits",
								restrict: ["EDIT", "OWNER"],
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
					{ path: "", element: <EngineOverviewPage /> },
					{ path: "usage", element: <EngineUsagePage /> },
					{ path: "mcp-usage", element: <EngineMcpUsagePage /> },
					{ path: "activity", element: <EngineActivityPage /> },
					{ path: "access-control", element: <EngineSettingsPage /> },
					{ path: "files", element: <EngineFileManagerPage /> },
					{ path: "commits", element: <EngineCommitsPage /> },
					{ path: "smss", element: <EngineSmssPage /> },
					{ path: "*", element: <Navigate to="." replace /> },
				],
			},
			{ path: "*", element: <Navigate to="." replace /> },
		],
	},
	// MODEL
	{
		path: "model",
		element: <Outlet />,
		children: [
			{
				path: "",
				element: (
					<EngineIndexPage
						name="Model"
						path="model"
						type="MODEL"
						description="Models are diverse, with particular strengths and weaknesses specific to each use case. Our model catalog exposes these models in an abstracted fashion, allowing data scientists to hand-select and/or swap models as desired."
					/>
				),
			},
			{
				path: "new",
				element: <ImportPage name="Model" type="MODEL" />,
			},
			{
				path: ":engineId",
				element: (
					<EngineLayout
						name="Model"
						path="model"
						type="MODEL"
						tabs={[
							{
								name: "Overview",
								path: "",
								restrict: [
									"READ_ONLY",
									"EDIT",
									"OWNER",
									"DISCOVERABLE",
								],
							},
							{
								name: "Usage",
								path: "usage",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "MCP",
								path: "mcp-usage",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "Activity Log",
								path: "activity",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "Chat",
								path: "chat",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "Access Control",
								path: "access-control",
								restrict: ["EDIT", "OWNER"],
							},
							{
								name: "Files",
								path: "files",
								restrict: ["EDIT", "OWNER"],
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
					{ path: "", element: <EngineOverviewPage /> },
					{ path: "usage", element: <EngineUsagePage /> },
					{ path: "mcp-usage", element: <EngineMcpUsagePage /> },
					{ path: "activity", element: <EngineActivityPage /> },
					{ path: "chat", element: <EngineModelChatPage /> },
					{ path: "access-control", element: <EngineSettingsPage /> },
					{ path: "files", element: <EngineFileManagerPage /> },
					{ path: "smss", element: <EngineSmssPage /> },
					{ path: "*", element: <Navigate to="." replace /> },
				],
			},
			{ path: "*", element: <Navigate to="." replace /> },
		],
	},
	// DATABASE
	{
		path: "database",
		element: <Outlet />,
		children: [
			{
				path: "",
				element: (
					<EngineIndexPage
						name="Database"
						path="database"
						type="DATABASE"
						description="Database catalog is an integrated data nexus connecting to diverse databases and serving as a springboard for unified data orchestration, innovation, and insights. Access structured data sources like relational database management systems (RDBMS), Triplestore/RDF, graph databases, Excel/CSVs, and data exposed via API.  "
					/>
				),
			},
			{
				path: "new",
				element: <ImportPage name="Database" type="DATABASE" />,
			},
			{
				path: ":engineId",
				element: (
					<EngineLayout
						name="Database"
						path="database"
						type="DATABASE"
						tabs={[
							{
								name: "Overview",
								path: "",
								restrict: [
									"READ_ONLY",
									"EDIT",
									"OWNER",
									"DISCOVERABLE",
								],
							},
							{
								name: "Usage",
								path: "usage",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "MCP",
								path: "mcp-usage",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "Activity Log",
								path: "activity",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "Metadata",
								path: "metadata",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "Query",
								path: "query",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "Query",
								path: "sparql-query",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "Access Control",
								path: "access-control",
								restrict: ["EDIT", "OWNER"],
							},
							{
								name: "Files",
								path: "files",
								restrict: ["EDIT", "OWNER"],
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
					{ path: "", element: <EngineOverviewPage /> },
					{ path: "usage", element: <EngineUsagePage /> },
					{ path: "mcp-usage", element: <EngineMcpUsagePage /> },
					{ path: "activity", element: <EngineActivityPage /> },
					{ path: "metadata", element: <EngineMetadataPage /> },
					{ path: "query", element: <EngineSqlQueryPage /> },
					{
						path: "sparql-query",
						element: <EngineSparqlQueryPage />,
					},
					{ path: "access-control", element: <EngineSettingsPage /> },
					{ path: "files", element: <EngineFileManagerPage /> },
					{ path: "smss", element: <EngineSmssPage /> },
					{ path: "*", element: <Navigate to="." replace /> },
				],
			},
			{ path: "*", element: <Navigate to="." replace /> },
		],
	},
	// VECTOR
	{
		path: "vector",
		element: <Outlet />,
		children: [
			{
				path: "",
				element: (
					<EngineIndexPage
						name="Vector"
						path="vector"
						type="VECTOR"
						description="Knowledge repositories, also known as vector databases, enable fast retrieval of information and semantic search. Create knowledge repositories on the fly and connect them for simplified reuse across apps.  "
					/>
				),
			},
			{
				path: "new",
				element: <ImportPage name="Vector" type="VECTOR" />,
			},
			{
				path: ":engineId",
				element: (
					<EngineLayout
						name="Vector"
						path="vector"
						type="VECTOR"
						tabs={[
							{
								name: "Overview",
								path: "",
								restrict: [
									"READ_ONLY",
									"EDIT",
									"OWNER",
									"DISCOVERABLE",
								],
							},
							{
								name: "Usage",
								path: "usage",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "MCP",
								path: "mcp-usage",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "Activity Log",
								path: "activity",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "Documents",
								path: "documents",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "Q&A",
								path: "qa",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "Access Control",
								path: "access-control",
								restrict: ["EDIT", "OWNER"],
							},
							{
								name: "Files",
								path: "files",
								restrict: ["EDIT", "OWNER"],
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
					{ path: "", element: <EngineOverviewPage /> },
					{ path: "usage", element: <EngineUsagePage /> },
					{ path: "mcp-usage", element: <EngineMcpUsagePage /> },
					{ path: "activity", element: <EngineActivityPage /> },
					{ path: "documents", element: <EngineFilePage /> },
					{ path: "qa", element: <EngineQAPage /> },
					{ path: "access-control", element: <EngineSettingsPage /> },
					{ path: "files", element: <EngineFileManagerPage /> },
					{ path: "smss", element: <EngineSmssPage /> },
					{ path: "*", element: <Navigate to="." replace /> },
				],
			},
			{ path: "*", element: <Navigate to="." replace /> },
		],
	},
	// STORAGE
	{
		path: "storage",
		element: <Outlet />,
		children: [
			{
				path: "",
				element: (
					<EngineIndexPage
						name="Storage"
						path="storage"
						type="STORAGE"
						description="Tapping into unstructured data (e.g., audio, video, images, code) is critical when training and using AI solutions. Our storage catalog enables integration with many industry-leading cloud storage solutions to effortlessly access a project's unstructured data."
					/>
				),
			},
			{
				path: "new",
				element: <ImportPage name="Storage" type="STORAGE" />,
			},
			{
				path: ":engineId",
				element: (
					<EngineLayout
						name="Storage"
						path="storage"
						type="STORAGE"
						tabs={[
							{
								name: "Overview",
								path: "",
								restrict: [
									"READ_ONLY",
									"EDIT",
									"OWNER",
									"DISCOVERABLE",
								],
							},
							{
								name: "Usage",
								path: "usage",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "MCP",
								path: "mcp-usage",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "Activity Log",
								path: "activity",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "Storage Viewer",
								path: "storage-viewer",
								restrict: [
									"READ_ONLY",
									"EDIT",
									"OWNER",
									"DISCOVERABLE",
								],
							},
							{
								name: "Access Control",
								path: "access-control",
								restrict: ["EDIT", "OWNER"],
							},
							{
								name: "Files",
								path: "files",
								restrict: ["EDIT", "OWNER"],
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
					{ path: "", element: <EngineOverviewPage /> },
					{ path: "usage", element: <EngineUsagePage /> },
					{ path: "mcp-usage", element: <EngineMcpUsagePage /> },
					{ path: "activity", element: <EngineActivityPage /> },
					{
						path: "storage-viewer",
						element: <EngineStorageViewerPage />,
					},
					{ path: "access-control", element: <EngineSettingsPage /> },
					{ path: "files", element: <EngineFileManagerPage /> },
					{ path: "smss", element: <EngineSmssPage /> },
					{ path: "*", element: <Navigate to="." replace /> },
				],
			},
			{ path: "*", element: <Navigate to="." replace /> },
		],
	},
	// GUARDRAIL
	{
		path: "guardrail",
		element: <Outlet />,
		children: [
			{
				path: "",
				element: (
					<EngineIndexPage
						name="Guardrail"
						path="guardrail"
						type="GUARDRAIL"
						description="Guardrail Catalog is a centralized hub for managing and deploying guardrails that ensure safety, compliance, and reliability across the platform. It provides ready-to-use options like Gliner and Detoxify, and supports custom guardrail uploads via ZIP files, enabling consistent, secure, and scalable interactions."
					/>
				),
			},
			{
				path: "new",
				element: <ImportPage name="Guardrail" type="GUARDRAIL" />,
			},
			{
				path: ":engineId",
				element: (
					<EngineLayout
						name="Guardrail"
						path="guardrail"
						type="GUARDRAIL"
						tabs={[
							{
								name: "Overview",
								path: "",
								restrict: [
									"READ_ONLY",
									"EDIT",
									"OWNER",
									"DISCOVERABLE",
								],
							},
							{
								name: "Usage",
								path: "usage",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "Activity Log",
								path: "activity",
								restrict: ["READ_ONLY", "EDIT", "OWNER"],
							},
							{
								name: "Access Control",
								path: "access-control",
								restrict: ["EDIT", "OWNER"],
							},
							{
								name: "Files",
								path: "files",
								restrict: ["EDIT", "OWNER"],
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
					{ path: "", element: <EngineOverviewPage /> },
					{ path: "usage", element: <EngineUsagePage /> },
					{ path: "activity", element: <EngineActivityPage /> },
					{ path: "access-control", element: <EngineSettingsPage /> },
					{ path: "files", element: <EngineFileManagerPage /> },
					{ path: "smss", element: <EngineSmssPage /> },
					{ path: "*", element: <Navigate to="." replace /> },
				],
			},
			{ path: "*", element: <Navigate to="." replace /> },
		],
	},
];
