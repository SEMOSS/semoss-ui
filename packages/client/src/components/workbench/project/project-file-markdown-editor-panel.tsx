import { useEffect, useRef, useState } from "react";
import { FileMarkdownEditor, getFileIconComponent } from "@semoss/shared";
import { useProject, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import {
	ProjectFileMarkdownEditorControl,
	type ProjectFileMarkdownEditorControlValue,
} from "./project-file-markdown-editor-control";

export interface ProjectFileMarkdownEditorConfig {
	name: string;
	path: string;
	readOnly?: boolean;
}

const ProjectFileMarkdownEditorPanel: WorkbenchComponent<
	ProjectFileMarkdownEditorConfig
> = ({ config, id, rename, setValue }) => {
	const { project, permission } = useProject();
	const readOnly =
		Boolean(config.readOnly) ||
		!(permission === "OWNER" || permission === "EDIT");
	const actionsRef = useRef<React.ComponentRef<
		typeof FileMarkdownEditor
	> | null>(null);
	const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");
	// setValue changes identity after writing the value.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		const value: ProjectFileMarkdownEditorControlValue = {
			canSave: !readOnly,
			refresh: () => actionsRef.current?.refresh(),
			save: () => void actionsRef.current?.save?.(),
			setViewMode,
			viewMode,
		};
		setValue(value);
	}, [readOnly, viewMode]);
	useWorkbenchControl(id, ProjectFileMarkdownEditorControl);

	return (
		<FileMarkdownEditor
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

export const PROJECT_FILE_MARKDOWN_EDITOR_PANEL: WorkbenchPanelConfig<ProjectFileMarkdownEditorConfig> =
	{
		name: "Markdown",
		canRename: false,
		mount: "keepAlive",
		matches: (a, b) => a.path === b.path,
		icon: ({ name, className }) => {
			const Icon = getFileIconComponent(name ?? "");
			return <Icon className={className} />;
		},
		content: ProjectFileMarkdownEditorPanel,
	};
