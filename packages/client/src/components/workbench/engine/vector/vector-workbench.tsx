import { useEffect, useMemo } from "react";
import type { Role } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import type { FileExplorerApi } from "@semoss/shared";
import { makeEngineRoomMcp } from "@/api/rooms";
import { useEngine, useWorkbench, useWorkbenchCommands } from "@/hooks";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@/stores/workbench";
import { WORKBENCH_ASSISTANT_PANEL } from "../../assistant";
import { Workbench } from "../../core";
import { WorkbenchCommandMenuButton } from "../../core/workbench-command-menu-button";
import {
	FILE_CODE_EDITOR_PANEL,
	FILE_DOWNLOAD_PANEL,
	FILE_EXPLORER_PANEL,
	FILE_IMAGE_VIEWER_PANEL,
	FILE_MARKDOWN_EDITOR_PANEL,
	FILE_MCP_EDITOR_PANEL,
	FILE_NOTEBOOK_EDITOR_PANEL,
	FILE_PDF_VIEWER_PANEL,
	FILE_PPTX_VIEWER_PANEL,
} from "../../files";
import { GIT_DIFF_PANEL, GIT_VERSION_PANEL } from "../../git";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "../../workbench.constants";
import { createEngineSettingsPanel } from "../engine-settings-panel";
import { EngineSettingsToggle } from "../engine-settings-toggle";
import { VECTOR_DOCUMENTS_PANEL } from "./vector-documents-panel";

/**
 * The default arrangement: assistant + documents in the main dock, files on
 * the left. The assistant lives in the main tabset here (not a border), so
 * its record carries no border min-width.
 */
const createVectorWorkbenchLayout = (
	engineId: string,
	permission: Role,
): WorkbenchLayout => {
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	return {
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: [
				WORKBENCH_COMPONENTS.ASSISTANT,
				WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS,
			],
			activeId: WORKBENCH_COMPONENTS.ASSISTANT,
		},
		panels: {
			[WORKBENCH_COMPONENTS.ASSISTANT]: {
				id: WORKBENCH_COMPONENTS.ASSISTANT,
				type: WORKBENCH_COMPONENTS.ASSISTANT,
				name: "Assistant",
				helpText: "Vector workbench assistant",
				canClose: false,
			},
			[WORKBENCH_PANEL_RECORDS.VECTOR_DOCUMENTS.id]:
				WORKBENCH_PANEL_RECORDS.VECTOR_DOCUMENTS,
			[WORKBENCH_PANEL_RECORDS.FILE_EXPLORER.id]: {
				...WORKBENCH_PANEL_RECORDS.FILE_EXPLORER,
				config: { type: "ENGINE", id: engineId },
			},
			...(!readOnly
				? {
						[WORKBENCH_PANEL_RECORDS.GIT_VERSION.id]: {
							...WORKBENCH_PANEL_RECORDS.GIT_VERSION,
							config: { type: "ENGINE", id: engineId },
						},
					}
				: {}),
		},
		borders: {
			left: {
				panelIds: [
					WORKBENCH_COMPONENTS.FILE_EXPLORER,
					...(!readOnly ? [WORKBENCH_COMPONENTS.GIT_VERSION] : []),
				],
				activeId: WORKBENCH_COMPONENTS.FILE_EXPLORER,
				size: 300,
			},
		},
	};
};

/** Blueprints, keyed by type. Module-scope so identities never churn. */
const VECTOR_WORKBENCH_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[WORKBENCH_COMPONENTS.FILE_EXPLORER]: FILE_EXPLORER_PANEL,
	[WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS]: VECTOR_DOCUMENTS_PANEL,
	[WORKBENCH_COMPONENTS.FILE_CODE_EDITOR]: FILE_CODE_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_DOWNLOAD]: FILE_DOWNLOAD_PANEL,
	[WORKBENCH_COMPONENTS.FILE_IMAGE_VIEWER]: FILE_IMAGE_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_MARKDOWN_EDITOR]: FILE_MARKDOWN_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_NOTEBOOK_EDITOR]: FILE_NOTEBOOK_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_PDF_VIEWER]: FILE_PDF_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_PPTX_VIEWER]: FILE_PPTX_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_MCP_EDITOR]: FILE_MCP_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.GIT_VERSION]: GIT_VERSION_PANEL,
	[WORKBENCH_COMPONENTS.GIT_DIFF]: GIT_DIFF_PANEL,
	[WORKBENCH_COMPONENTS.ENGINE_SETTINGS]: createEngineSettingsPanel([
		{
			name: "Overview",
			component: "overview",
			restrict: ["READ_ONLY", "EDIT", "OWNER", "DISCOVERABLE"],
		},
		{
			name: "Usage",
			component: "usage",
			restrict: ["READ_ONLY", "EDIT", "OWNER"],
		},
		{
			name: "MCP",
			component: "mcp-usage",
			restrict: ["READ_ONLY", "EDIT", "OWNER"],
		},
		{
			name: "Activity Log",
			component: "activity",
			restrict: ["READ_ONLY", "EDIT", "OWNER"],
		},
		{
			name: "Access Control",
			component: "access-control",
			restrict: ["EDIT", "OWNER"],
		},
		{
			name: "SMSS",
			component: "smss",
			restrict: ["OWNER"],
		},
	]),
	[WORKBENCH_COMPONENTS.ASSISTANT]: WORKBENCH_ASSISTANT_PANEL,
};

/**
 * Vector workbench that exposes the engine's files through the shared file
 * explorer, editor, and MCP editor. Rendered inside an InsightProvider by the
 * page so its file operations share a single insight.
 */
export const VectorWorkbench: React.FC = () => {
	const { engine, permission } = useEngine();
	const insight = useInsight();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const workbenchLayout = useMemo(
		() => createVectorWorkbenchLayout(engine.engine_id, permission),
		[engine.engine_id, permission],
	);

	const configureWorkbench = useWorkbench((s) => s.configure);

	// Keep the assistant prompt and room tools in sync with the active engine.
	useEffect(() => {
		configureWorkbench({
			resource: {
				type: "ENGINE",
				id: engine.engine_id,
				permission,
			},
			assistant: {
				systemPrompt: `You are the assistant for the ${engine.engine_display_name || engine.engine_name} vector workbench (${engine.engine_id}, subtype ${engine.engine_subtype || "unknown"}). Use only the tools provided in this room and decide whether a tool is needed for each request. For questions about indexed content, call VectorDatabaseQuery before answering, ground the answer only in its returned chunks, and cite the Source and Divider when available. Use ListDocumentsInVectorDatabase when the user asks what is indexed. For requests to add, download, or remove vector documents, or to inspect or change engine asset files, use the matching room tool; honor its approval requirement and the user's permissions. When the user attaches a file and asks to index it, use the available attachment path with the document embedding tool. Simple greetings or general guidance that do not require engine data can be answered without a tool. Do not invent unsupported parameters, and never claim an operation succeeded unless its tool result confirms success.`,
				prepareRoom: (insightId) =>
					makeEngineRoomMcp(insightId, engine.engine_id),
			},
		});
	}, [
		configureWorkbench,
		engine.engine_display_name,
		engine.engine_id,
		engine.engine_name,
		engine.engine_subtype,
		permission,
	]);

	useWorkbenchCommands([
		{
			id: "workbench.server.reconnect",
			label: "Reconnect Server",
			handler: () => {
				void insight.actions
					.run("ReconnectServer();")
					.catch(console.error);
			},
		},
		{
			id: "workbench.file.create",
			category: "File",
			label: "Create File",
			visible: !readOnly,
			handler: (get) =>
				(
					get().layout.values[WORKBENCH_COMPONENTS.FILE_EXPLORER] as
						| FileExplorerApi
						| undefined
				)?.commands.openNewFile(undefined, "add_file"),
		},
		{
			id: "workbench.file.create-folder",
			category: "File",
			label: "Create Folder",
			visible: !readOnly,
			handler: (get) =>
				(
					get().layout.values[WORKBENCH_COMPONENTS.FILE_EXPLORER] as
						| FileExplorerApi
						| undefined
				)?.commands.openNewFile(undefined, "add_directory"),
		},
		{
			id: "workbench.file.upload",
			category: "File",
			label: "Upload Files",
			visible: !readOnly,
			handler: (get) =>
				(
					get().layout.values[WORKBENCH_COMPONENTS.FILE_EXPLORER] as
						| FileExplorerApi
						| undefined
				)?.commands.openNewFile(undefined, "upload"),
		},
		{
			id: "workbench.file.refresh",
			category: "File",
			label: "Refresh Files",
			handler: (get) =>
				(
					get().layout.values[WORKBENCH_COMPONENTS.FILE_EXPLORER] as
						| FileExplorerApi
						| undefined
				)?.commands.refresh(),
		},
		{
			id: "workbench.file-explorer.open",
			category: "View",
			label: "Open File Explorer",
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.FILE_EXPLORER,
					{ type: "ENGINE", id: engine.engine_id },
				);
			},
		},
		{
			id: "workbench.version-control.open",
			category: "View",
			label: "Open Version Control",
			visible: !readOnly,
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.GIT_VERSION,
					{ type: "ENGINE", id: engine.engine_id },
				);
			},
		},
		{
			id: "workbench.settings.open",
			category: "View",
			label: "Open Settings",
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
				);
			},
		},
		{
			id: "workbench.vector-documents.open",
			category: "View",
			label: "Open Documents",
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS,
				);
			},
		},
		{
			id: "workbench.vector-assistant.open",
			category: "View",
			label: "Open Assistant",
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.ASSISTANT,
				);
			},
		},
	]);

	return (
		<Workbench
			layout={workbenchLayout}
			components={VECTOR_WORKBENCH_COMPONENTS}
			borderSlots={{
				left: {
					after: (
						<>
							<WorkbenchCommandMenuButton />
							<EngineSettingsToggle />
						</>
					),
				},
			}}
		/>
	);
};
