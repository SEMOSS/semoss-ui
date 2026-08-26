import { FileEditor, getFileIconComponent } from "@semoss/shared";
import { MetadataHelpDialog } from "@/components/shared";
import { MCP } from "@/constants";
import { useEngine, useWorkbenchCommands } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";

/** The config an engine file-editor instance is opened with. */
export interface EngineFileEditorConfig {
	name: string;
	path: string;
	fileMode?: "ENGINE" | "INSIGHT";
	insightId?: string;
}

export const EngineFileEditorPanel: WorkbenchComponent<
	EngineFileEditorConfig
> = ({ id, config, rename }) => {
	const { engine, permission } = useEngine();

	const readOnly = !(permission === "OWNER" || permission === "EDIT");

	const isDriverFile = MCP.DRIVER_PATHS.some((f) => config.path.endsWith(f));

	useWorkbenchCommands([
		{
			id: `workbench.engine-file-editor.${id}.close`,
			label: `Close ${config.name}`,
			description: "Close this file editor panel.",
			icon: null,
			handler: (get) => {
				get().layout.actions.closePanel(id);
			},
		},
	]);

	if (config.fileMode === "INSIGHT" && config.insightId) {
		return (
			<FileEditor
				mode={{
					type: "INSIGHT",
					insightId: config.insightId,
				}}
				path={config.path}
				readOnly={readOnly}
				onChange={(_content, isModified) => {
					// the dirty marker is a programmatic rename; canRename
					// only gates user-facing rename affordances
					rename(isModified ? `${config.name}*` : config.name);
				}}
			/>
		);
	}

	return (
		<FileEditor
			mode={{
				type: "ENGINE",
				engine: engine.engine_id,
			}}
			path={config.path}
			readOnly={readOnly}
			leadingToolbar={
				isDriverFile ? <MetadataHelpDialog compact /> : undefined
			}
			onChange={(_content, isModified) => {
				rename(isModified ? `${config.name}*` : config.name);
			}}
		/>
	);
};

/**
 * Blueprint for engine file-editor instances. Instances dedupe on their file
 * path (plus mode), so a renamed file re-selects its open editor instead of
 * opening a duplicate. keepAlive: unsaved buffers survive tab switches.
 */
export const ENGINE_FILE_EDITOR_PANEL: WorkbenchPanelConfig<EngineFileEditorConfig> =
	{
		name: "Editor",
		canRename: false,
		mount: "keepAlive",
		matches: (a, b) =>
			a.path === b.path &&
			a.fileMode === b.fileMode &&
			a.insightId === b.insightId,
		icon: ({ name, className }) => {
			const Icon = getFileIconComponent(name ?? "");
			return <Icon className={className} />;
		},
		content: EngineFileEditorPanel,
	};
