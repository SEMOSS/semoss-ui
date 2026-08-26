import {
	FileTextIcon,
	FolderTreeIcon,
	MessageSquareIcon,
	SettingsIcon,
} from "lucide-react";
import { useEffect } from "react";
import { makeEngineRoomMcp } from "@/api/rooms";
import { useEngine, useWorkbench, useWorkbenchCommands } from "@/hooks";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@/stores/workbench";
import { WORKBENCH_ASSISTANT_PANEL } from "../../assistant";
import { Workbench } from "../../core";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "../../workbench.constants";
import { WorkbenchCommandMenuButton } from "../../workbench-command-menu-button";
import { ENGINE_FILE_EDITOR_PANEL } from "../engine-file-editor-panel";
import { ENGINE_FILE_EXPLORER_PANEL } from "../engine-file-explorer-panel";
import { ENGINE_MCP_EDITOR_PANEL } from "../engine-mcp-editor-panel";
import { createEngineSettingsPanel } from "../engine-settings-panel";
import { EngineSettingsToggle } from "../engine-settings-toggle";
import { VECTOR_DOCUMENTS_PANEL } from "./vector-documents-panel";

/**
 * The default arrangement: assistant + documents in the main dock, files on
 * the left. The assistant lives in the main tabset here (not a border), so
 * its record carries no border min-width.
 */
const VECTOR_WORKBENCH_LAYOUT: WorkbenchLayout = {
	version: 1,
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [
			WORKBENCH_COMPONENTS.ASSISTANT,
			WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS,
		],
		activeId: WORKBENCH_COMPONENTS.ASSISTANT,
		enableDeleteWhenEmpty: false,
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
		[WORKBENCH_PANEL_RECORDS.ENGINE_FILE_EXPLORER.id]:
			WORKBENCH_PANEL_RECORDS.ENGINE_FILE_EXPLORER,
	},
	borders: {
		left: {
			panelIds: [WORKBENCH_COMPONENTS.FILE_EXPLORER],
			activeId: WORKBENCH_COMPONENTS.FILE_EXPLORER,
			size: 300,
		},
	},
};

/** Blueprints, keyed by type. Module-scope so identities never churn. */
const VECTOR_WORKBENCH_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[WORKBENCH_COMPONENTS.FILE_EXPLORER]: ENGINE_FILE_EXPLORER_PANEL,
	[WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS]: VECTOR_DOCUMENTS_PANEL,
	[WORKBENCH_COMPONENTS.FILE_EDITOR]: ENGINE_FILE_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.MCP_EDITOR]: ENGINE_MCP_EDITOR_PANEL,
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
	const { engine } = useEngine();

	const configureAssistant = useWorkbench((s) => s.assistant.configure);

	// Keep the assistant prompt and room tools in sync with the active engine.
	useEffect(() => {
		configureAssistant({
			systemPrompt: `You are the assistant for the ${engine.engine_display_name || engine.engine_name} vector workbench (${engine.engine_id}, subtype ${engine.engine_subtype || "unknown"}). Use only the tools provided in this room and decide whether a tool is needed for each request. For questions about indexed content, call VectorDatabaseQuery before answering, ground the answer only in its returned chunks, and cite the Source and Divider when available. Use ListDocumentsInVectorDatabase when the user asks what is indexed. For requests to add, download, or remove vector documents, or to inspect or change engine asset files, use the matching room tool; honor its approval requirement and the user's permissions. When the user attaches a file and asks to index it, use the available attachment path with the document embedding tool. Simple greetings or general guidance that do not require engine data can be answered without a tool. Do not invent unsupported parameters, and never claim an operation succeeded unless its tool result confirms success.`,
			prepareRoom: (insightId) =>
				makeEngineRoomMcp(insightId, engine.engine_id),
		});
	}, [
		configureAssistant,
		engine.engine_display_name,
		engine.engine_id,
		engine.engine_name,
		engine.engine_subtype,
	]);

	useWorkbenchCommands([
		{
			id: "workbench.file-explorer.open",
			label: "Open File Explorer",
			icon: <FolderTreeIcon />,
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.FILE_EXPLORER,
				);
			},
		},
		{
			id: "workbench.settings.open",
			label: "Open Settings",
			icon: <SettingsIcon />,
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
				);
			},
		},
		{
			id: "workbench.vector-documents.open",
			label: "Open Documents",
			icon: <FileTextIcon />,
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS,
				);
			},
		},
		{
			id: "workbench.vector-assistant.open",
			label: "Open Assistant",
			icon: <MessageSquareIcon />,
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.ASSISTANT,
				);
			},
		},
	]);

	return (
		<Workbench
			layout={VECTOR_WORKBENCH_LAYOUT}
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
