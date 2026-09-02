import { useEffect, useRef, useState } from "react";
import {
	type FileMode,
	FileNotebook,
	getFileIconComponent,
} from "@semoss/shared";
import { useEngine, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import {
	EngineFileNotebookEditorControl,
	type EngineFileNotebookEditorControlValue,
} from "./engine-file-notebook-editor-control";

export interface EngineFileNotebookEditorConfig {
	name: string;
	path: string;
	fileMode?: "ENGINE" | "INSIGHT";
	insightId?: string;
}

const EngineFileNotebookEditorPanel: WorkbenchComponent<
	EngineFileNotebookEditorConfig
> = ({ config, id, rename, setValue }) => {
	const { engine, permission } = useEngine();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const actionsRef = useRef<React.ComponentRef<typeof FileNotebook> | null>(
		null,
	);
	const [viewMode, setViewMode] = useState<"notebook" | "raw">("notebook");
	// setValue changes identity after writing the value.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		const value: EngineFileNotebookEditorControlValue = {
			canSave: !readOnly,
			refresh: () => actionsRef.current?.refresh(),
			save: () => void actionsRef.current?.save?.(),
			setViewMode,
			viewMode,
		};
		setValue(value);
	}, [readOnly, viewMode]);
	useWorkbenchControl(id, EngineFileNotebookEditorControl);
	const mode: FileMode =
		config.fileMode === "INSIGHT" && config.insightId
			? { type: "INSIGHT", insightId: config.insightId }
			: { type: "ENGINE", engine: engine.engine_id };

	return (
		<FileNotebook
			ref={(actions) => {
				actionsRef.current = actions;
			}}
			mode={mode}
			path={config.path}
			onChange={(_content, isModified) => {
				rename(isModified ? `${config.name}*` : config.name);
			}}
			readOnly={readOnly}
			viewMode={viewMode}
		/>
	);
};

export const ENGINE_FILE_NOTEBOOK_EDITOR_PANEL: WorkbenchPanelConfig<EngineFileNotebookEditorConfig> =
	{
		name: "Notebook",
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
		content: EngineFileNotebookEditorPanel,
	};
