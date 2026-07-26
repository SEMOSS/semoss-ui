import { Navigate, Outlet } from "react-router-dom";
import { DatabasePageContent } from "@/components/import/database/database-page-content";
import { FunctionImport } from "@/components/import/function/function-import";
import { GuardrailImport } from "@/components/import/guardrail/guardrail-import";
import { StorageImport } from "@/components/import/storage/storage-import";
import { VectorImport } from "@/components/import/vector/vector-import";
import { ImportLayout, ModelImportPage } from "../import";
import { EngineActivityPage } from "./engine-activity-page";
import { EngineCommitsPage } from "./engine-commits-page";
import { EngineIndexPage } from "./engine-index-page";
import { EngineLayout } from "./engine-layout";
import { EngineMcpUsagePage } from "./engine-mcp-usage-page";
import { EngineMetadataPage } from "./engine-metadata-page";
import { EngineOverviewPage } from "./engine-overview-page";
import { EngineSettingsPage } from "./engine-settings-page";
import { EngineSmssPage } from "./engine-smss-page";
import { EngineTabsLayout } from "./engine-tabs-layout";
import { EngineUsagePage } from "./engine-usage-page";
import { EngineWorkbenchPage } from "./engine-workbench-page";

export const ENGINE_ROUTES: {
	/** Name of the specific path (omitted for pathless layout routes) */
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
				element: <FunctionImport name="Function" />,
			},
			{
				element: (
					<EngineLayout
						catalog={{
							name: "Function",
							path: "/function",
						}}
					/>
				),
				path: ":engineId",
				children: [
					{
						path: "workbench",
						element: <EngineWorkbenchPage />,
					},
					{
						path: "*",
						element: (
							<EngineTabsLayout
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
										restrict: [
											"READ_ONLY",
											"EDIT",
											"OWNER",
										],
									},
									{
										name: "MCP",
										path: "mcp-usage",
										restrict: [
											"READ_ONLY",
											"EDIT",
											"OWNER",
										],
									},
									{
										name: "Activity Log",
										path: "activity",
										restrict: [
											"READ_ONLY",
											"EDIT",
											"OWNER",
										],
									},
									{
										name: "Access Control",
										path: "access-control",
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
							{
								path: "mcp-usage",
								element: <EngineMcpUsagePage />,
							},
							{
								path: "activity",
								element: <EngineActivityPage />,
							},
							{
								path: "access-control",
								element: <EngineSettingsPage />,
							},
							{ path: "commits", element: <EngineCommitsPage /> },
							{ path: "smss", element: <EngineSmssPage /> },
							{ path: "*", element: <Navigate to="." replace /> },
						],
					},
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
				element: (
					<ImportLayout>
						<ModelImportPage />
					</ImportLayout>
				),
			},
			{
				element: (
					<EngineLayout
						catalog={{
							name: "Model",
							path: "/model",
						}}
					/>
				),
				path: ":engineId",
				children: [
					{
						path: "workbench",
						element: <EngineWorkbenchPage />,
					},
					{
						path: "*",
						element: (
							<EngineTabsLayout
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
										restrict: [
											"READ_ONLY",
											"EDIT",
											"OWNER",
										],
									},
									{
										name: "MCP",
										path: "mcp-usage",
										restrict: [
											"READ_ONLY",
											"EDIT",
											"OWNER",
										],
									},
									{
										name: "Activity Log",
										path: "activity",
										restrict: [
											"READ_ONLY",
											"EDIT",
											"OWNER",
										],
									},
									{
										name: "Access Control",
										path: "access-control",
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
							{
								path: "mcp-usage",
								element: <EngineMcpUsagePage />,
							},
							{
								path: "activity",
								element: <EngineActivityPage />,
							},
							{
								path: "access-control",
								element: <EngineSettingsPage />,
							},
							{ path: "smss", element: <EngineSmssPage /> },
							{ path: "*", element: <Navigate to="." replace /> },
						],
					},
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
				element: <DatabasePageContent name="Database" />,
			},
			{
				element: (
					<EngineLayout
						catalog={{
							name: "Database",
							path: "/database",
						}}
					/>
				),
				path: ":engineId",
				children: [
					{
						path: "workbench",
						element: <EngineWorkbenchPage />,
					},
					{
						path: "*",
						element: (
							<EngineTabsLayout
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
										restrict: [
											"READ_ONLY",
											"EDIT",
											"OWNER",
										],
									},
									{
										name: "MCP",
										path: "mcp-usage",
										restrict: [
											"READ_ONLY",
											"EDIT",
											"OWNER",
										],
									},
									{
										name: "Activity Log",
										path: "activity",
										restrict: [
											"READ_ONLY",
											"EDIT",
											"OWNER",
										],
									},
									{
										name: "Metadata",
										path: "metadata",
										restrict: [
											"READ_ONLY",
											"EDIT",
											"OWNER",
										],
									},
									{
										name: "Access Control",
										path: "access-control",
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
							{
								path: "mcp-usage",
								element: <EngineMcpUsagePage />,
							},
							{
								path: "activity",
								element: <EngineActivityPage />,
							},
							{
								path: "metadata",
								element: <EngineMetadataPage />,
							},
							{
								path: "access-control",
								element: <EngineSettingsPage />,
							},
							{ path: "smss", element: <EngineSmssPage /> },
							{ path: "*", element: <Navigate to="." replace /> },
						],
					},
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
				element: <VectorImport name="Vector" />,
			},
			{
				element: (
					<EngineLayout
						catalog={{
							name: "Vector",
							path: "/vector",
						}}
					/>
				),
				path: ":engineId",
				children: [
					{
						path: "workbench",
						element: <EngineWorkbenchPage />,
					},
					{
						path: "*",
						element: (
							<EngineTabsLayout
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
										restrict: [
											"READ_ONLY",
											"EDIT",
											"OWNER",
										],
									},
									{
										name: "MCP",
										path: "mcp-usage",
										restrict: [
											"READ_ONLY",
											"EDIT",
											"OWNER",
										],
									},
									{
										name: "Activity Log",
										path: "activity",
										restrict: [
											"READ_ONLY",
											"EDIT",
											"OWNER",
										],
									},
									{
										name: "Access Control",
										path: "access-control",
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
							{
								path: "mcp-usage",
								element: <EngineMcpUsagePage />,
							},
							{
								path: "activity",
								element: <EngineActivityPage />,
							},
							{
								path: "access-control",
								element: <EngineSettingsPage />,
							},
							{ path: "smss", element: <EngineSmssPage /> },
							{ path: "*", element: <Navigate to="." replace /> },
						],
					},
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
				element: <StorageImport name="Storage" />,
			},
			{
				element: (
					<EngineLayout
						catalog={{
							name: "Storage",
							path: "/storage",
						}}
					/>
				),
				path: ":engineId",
				children: [
					{
						path: "workbench",
						element: <EngineWorkbenchPage />,
					},
					{
						path: "*",
						element: (
							<EngineTabsLayout
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
										restrict: [
											"READ_ONLY",
											"EDIT",
											"OWNER",
										],
									},
									{
										name: "MCP",
										path: "mcp-usage",
										restrict: [
											"READ_ONLY",
											"EDIT",
											"OWNER",
										],
									},
									{
										name: "Activity Log",
										path: "activity",
										restrict: [
											"READ_ONLY",
											"EDIT",
											"OWNER",
										],
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
							{
								path: "mcp-usage",
								element: <EngineMcpUsagePage />,
							},
							{
								path: "activity",
								element: <EngineActivityPage />,
							},
							{
								path: "access-control",
								element: <EngineSettingsPage />,
							},
							{ path: "smss", element: <EngineSmssPage /> },
							{ path: "*", element: <Navigate to="." replace /> },
						],
					},
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
				element: <GuardrailImport name="Guardrail" />,
			},
			{
				element: (
					<EngineLayout
						catalog={{
							name: "Guardrail",
							path: "/guardrail",
						}}
					/>
				),
				path: ":engineId",
				children: [
					{
						path: "workbench",
						element: <EngineWorkbenchPage />,
					},
					{
						path: "*",
						element: (
							<EngineTabsLayout
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
										restrict: [
											"READ_ONLY",
											"EDIT",
											"OWNER",
										],
									},
									{
										name: "Activity Log",
										path: "activity",
										restrict: [
											"READ_ONLY",
											"EDIT",
											"OWNER",
										],
									},
									{
										name: "Access Control",
										path: "access-control",
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
							{
								path: "activity",
								element: <EngineActivityPage />,
							},
							{
								path: "access-control",
								element: <EngineSettingsPage />,
							},
							{ path: "smss", element: <EngineSmssPage /> },
							{ path: "*", element: <Navigate to="." replace /> },
						],
					},
				],
			},
			{ path: "*", element: <Navigate to="." replace /> },
		],
	},
];
