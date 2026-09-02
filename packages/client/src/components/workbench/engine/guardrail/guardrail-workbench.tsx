import { useEffect } from "react";
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
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "../../workbench.constants";
import { ENGINE_FILE_CODE_EDITOR_PANEL } from "../engine-file-code-editor-panel";
import { ENGINE_FILE_DOWNLOAD_VIEWER_PANEL } from "../engine-file-download-viewer-panel";
import { ENGINE_FILE_EXPLORER_PANEL } from "../engine-file-explorer-panel";
import { ENGINE_FILE_IMAGE_EDITOR_PANEL } from "../engine-file-image-editor-panel";
import { ENGINE_FILE_MARKDOWN_EDITOR_PANEL } from "../engine-file-markdown-editor-panel";
import { ENGINE_FILE_NOTEBOOK_EDITOR_PANEL } from "../engine-file-notebook-editor-panel";
import { ENGINE_FILE_PDF_EDITOR_PANEL } from "../engine-file-pdf-editor-panel";
import { ENGINE_MCP_EDITOR_PANEL } from "../engine-mcp-editor-panel";
import { createEngineSettingsPanel } from "../engine-settings-panel";
import { EngineSettingsToggle } from "../engine-settings-toggle";
import {
	ENGINE_GIT_DIFF_PANEL,
	ENGINE_VERSION_PANEL,
} from "../version-control";

/** The default arrangement: files on the left, assistant on the right. */
const GUARDRAIL_WORKBENCH_LAYOUT: WorkbenchLayout = {
	version: 2,
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [],
		activeId: null,
	},
	panels: {
		[WORKBENCH_PANEL_RECORDS.ENGINE_FILE_EXPLORER.id]:
			WORKBENCH_PANEL_RECORDS.ENGINE_FILE_EXPLORER,
		[WORKBENCH_PANEL_RECORDS.ENGINE_VERSION.id]:
			WORKBENCH_PANEL_RECORDS.ENGINE_VERSION,
		[WORKBENCH_PANEL_RECORDS.ASSISTANT.id]:
			WORKBENCH_PANEL_RECORDS.ASSISTANT,
	},
	borders: {
		left: {
			panelIds: [
				WORKBENCH_COMPONENTS.FILE_EXPLORER,
				WORKBENCH_COMPONENTS.ENGINE_VERSION,
			],
			activeId: WORKBENCH_COMPONENTS.FILE_EXPLORER,
			size: 300,
		},
		right: {
			panelIds: [WORKBENCH_COMPONENTS.ASSISTANT],
			activeId: null,
			size: 400,
		},
	},
};

/** Blueprints, keyed by type. Module-scope so identities never churn. */
const GUARDRAIL_WORKBENCH_COMPONENTS: Record<string, WorkbenchPanelConfigAny> =
	{
		[WORKBENCH_COMPONENTS.FILE_EXPLORER]: ENGINE_FILE_EXPLORER_PANEL,
		[WORKBENCH_COMPONENTS.FILE_CODE_EDITOR]: ENGINE_FILE_CODE_EDITOR_PANEL,
		[WORKBENCH_COMPONENTS.FILE_DOWNLOAD_VIEWER]:
			ENGINE_FILE_DOWNLOAD_VIEWER_PANEL,
		[WORKBENCH_COMPONENTS.FILE_IMAGE_EDITOR]:
			ENGINE_FILE_IMAGE_EDITOR_PANEL,
		[WORKBENCH_COMPONENTS.FILE_MARKDOWN_EDITOR]:
			ENGINE_FILE_MARKDOWN_EDITOR_PANEL,
		[WORKBENCH_COMPONENTS.FILE_NOTEBOOK_EDITOR]:
			ENGINE_FILE_NOTEBOOK_EDITOR_PANEL,
		[WORKBENCH_COMPONENTS.FILE_PDF_EDITOR]: ENGINE_FILE_PDF_EDITOR_PANEL,
		[WORKBENCH_COMPONENTS.MCP_EDITOR]: ENGINE_MCP_EDITOR_PANEL,
		[WORKBENCH_COMPONENTS.ENGINE_VERSION]: ENGINE_VERSION_PANEL,
		[WORKBENCH_COMPONENTS.ENGINE_GIT_DIFF]: ENGINE_GIT_DIFF_PANEL,
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
 * Guardrail workbench that exposes the engine's files through the shared file
 * explorer, editor, and MCP editor. Rendered inside an InsightProvider by the
 * page so its file operations share a single insight.
 */
export const GuardrailWorkbench: React.FC = () => {
	const { engine } = useEngine();

	const configureAssistant = useWorkbench((s) => s.assistant.configure);

	// Keep the assistant prompt and room tools in sync with the active engine.
	useEffect(() => {
		configureAssistant({
			systemPrompt: `You are the assistant for the ${engine.engine_display_name || engine.engine_name} workbench (${engine.engine_id}). Your role is to help the user understand, test, and configure this guardrail. Use only the tools provided in this room. Never claim that an operation succeeded unless its tool result confirms success. Keep answers concise and grounded in the active engine.`,
			prepareRoom: (insightId) =>
				makeEngineRoomMcp(insightId, engine.engine_id),
		});
	}, [
		configureAssistant,
		engine.engine_display_name,
		engine.engine_id,
		engine.engine_name,
	]);

	useWorkbenchCommands([
		{
			id: "workbench.file-explorer.open",
			category: "View",
			label: "Open File Explorer",
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.FILE_EXPLORER,
				);
			},
		},
		{
			id: "workbench.version-control.open",
			category: "View",
			label: "Open Version Control",
			handler: (get) => {
				get().layout.actions.selectPanel(
					WORKBENCH_COMPONENTS.ENGINE_VERSION,
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
	]);

	return (
		<Workbench
			layout={GUARDRAIL_WORKBENCH_LAYOUT}
			components={GUARDRAIL_WORKBENCH_COMPONENTS}
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
