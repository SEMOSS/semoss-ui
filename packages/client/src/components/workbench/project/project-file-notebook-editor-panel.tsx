import { useEffect, useRef, useState } from "react";
import { FileNotebook, getFileIconComponent } from "@semoss/shared";
import { useProject, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import {
	ProjectFileNotebookEditorControl,
	type ProjectFileNotebookEditorControlValue,
} from "./project-file-notebook-editor-control";

export interface ProjectFileNotebookEditorConfig {
	name: string;
	path: string;
	readOnly?: boolean;
}

const ProjectFileNotebookEditorPanel: WorkbenchComponent<
	ProjectFileNotebookEditorConfig
> = ({ config, id, rename, setValue }) => {
	const { project, permission } = useProject();
	const readOnly =
		Boolean(config.readOnly) ||
		!(permission === "OWNER" || permission === "EDIT");
	const actionsRef = useRef<React.ComponentRef<typeof FileNotebook> | null>(
		null,
	);
	const [viewMode, setViewMode] = useState<"notebook" | "raw">("notebook");
	// setValue changes identity after writing the value.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		const value: ProjectFileNotebookEditorControlValue = {
			canSave: !readOnly,
			refresh: () => actionsRef.current?.refresh(),
			save: () => void actionsRef.current?.save?.(),
			setViewMode,
			viewMode,
		};
		setValue(value);
	}, [readOnly, viewMode]);
	useWorkbenchControl(id, ProjectFileNotebookEditorControl);

	return (
		<FileNotebook
			ref={(actions) => {
				actionsRef.current = actions;
			}}
			mode={{ type: "APP", app: project.project_id }}
			path={config.path}
			onChange={(_content, isModified) => {
				rename(isModified ? `${config.name}*` : config.name);
			}}
			readOnly={readOnly}
			viewMode={viewMode}
		/>
	);
};

export const PROJECT_FILE_NOTEBOOK_EDITOR_PANEL: WorkbenchPanelConfig<ProjectFileNotebookEditorConfig> =
	{
		name: "Notebook",
		canRename: false,
		mount: "keepAlive",
		matches: (a, b) => a.path === b.path,
		icon: ({ name, className }) => {
			const Icon = getFileIconComponent(name ?? "");
			return <Icon className={className} />;
		},
		content: ProjectFileNotebookEditorPanel,
	};
