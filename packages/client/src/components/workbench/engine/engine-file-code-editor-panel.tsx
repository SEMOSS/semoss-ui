import { useEffect, useRef } from "react";
import {
	FileCodeEditor,
	type FileMode,
	getFileIconComponent,
} from "@semoss/shared";
import { MetadataHelpDialog } from "@/components/shared";
import { MCP } from "@/constants";
import { useEngine, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import {
	EngineFileCodeEditorControl,
	type EngineFileCodeEditorControlValue,
} from "./engine-file-code-editor-control";

export interface EngineFileCodeEditorConfig {
	name: string;
	path: string;
	fileMode?: "ENGINE" | "INSIGHT";
	insightId?: string;
}

const EngineFileCodeEditorPanel: WorkbenchComponent<
	EngineFileCodeEditorConfig
> = ({ config, id, rename, setValue }) => {
	const { engine, permission } = useEngine();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const actionsRef = useRef<React.ComponentRef<typeof FileCodeEditor> | null>(
		null,
	);
	const canSave = !readOnly;
	// setValue changes identity after writing the value.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		const value: EngineFileCodeEditorControlValue = {
			canSave,
			refresh: () => actionsRef.current?.refresh(),
			save: () => void actionsRef.current?.save?.(),
		};
		setValue(value);
	}, [canSave]);
	useWorkbenchControl(id, EngineFileCodeEditorControl);
	const mode: FileMode =
		config.fileMode === "INSIGHT" && config.insightId
			? { type: "INSIGHT", insightId: config.insightId }
			: { type: "ENGINE", engine: engine.engine_id };
	const onChange = (_content: string, isModified: boolean) => {
		rename(isModified ? `${config.name}*` : config.name);
	};

	const isDriverFile = MCP.DRIVER_PATHS.some((path) =>
		config.path.endsWith(path),
	);

	return (
		<FileCodeEditor
			ref={(actions) => {
				actionsRef.current = actions;
			}}
			mode={mode}
			path={config.path}
			onChange={onChange}
			leadingToolbar={
				mode.type === "ENGINE" && isDriverFile ? (
					<MetadataHelpDialog compact />
				) : undefined
			}
			hideToolbar
			readOnly={readOnly}
		/>
	);
};

export const ENGINE_FILE_CODE_EDITOR_PANEL: WorkbenchPanelConfig<EngineFileCodeEditorConfig> =
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
		content: EngineFileCodeEditorPanel,
	};
