import { useEffect, useRef, useState } from "react";
import {
	FileMarkdownEditor,
	type FileMode,
	getFileIconComponent,
} from "@semoss/shared";
import { useEngine, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import {
	EngineFileMarkdownEditorControl,
	type EngineFileMarkdownEditorControlValue,
} from "./engine-file-markdown-editor-control";

export interface EngineFileMarkdownEditorConfig {
	name: string;
	path: string;
	fileMode?: "ENGINE" | "INSIGHT";
	insightId?: string;
}

const EngineFileMarkdownEditorPanel: WorkbenchComponent<
	EngineFileMarkdownEditorConfig
> = ({ config, id, rename, setValue }) => {
	const { engine, permission } = useEngine();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const actionsRef = useRef<React.ComponentRef<
		typeof FileMarkdownEditor
	> | null>(null);
	const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");
	// setValue changes identity after writing the value.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		const value: EngineFileMarkdownEditorControlValue = {
			canSave: !readOnly,
			refresh: () => actionsRef.current?.refresh(),
			save: () => void actionsRef.current?.save?.(),
			setViewMode,
			viewMode,
		};
		setValue(value);
	}, [readOnly, viewMode]);
	useWorkbenchControl(id, EngineFileMarkdownEditorControl);
	const mode: FileMode =
		config.fileMode === "INSIGHT" && config.insightId
			? { type: "INSIGHT", insightId: config.insightId }
			: { type: "ENGINE", engine: engine.engine_id };

	return (
		<FileMarkdownEditor
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

export const ENGINE_FILE_MARKDOWN_EDITOR_PANEL: WorkbenchPanelConfig<EngineFileMarkdownEditorConfig> =
	{
		name: "Markdown",
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
		content: EngineFileMarkdownEditorPanel,
	};
