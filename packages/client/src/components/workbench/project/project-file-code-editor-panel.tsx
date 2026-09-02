import { useEffect, useRef } from "react";
import { FileCodeEditor, getFileIconComponent } from "@semoss/shared";
import { MetadataHelpDialog } from "@/components/shared";
import { MCP } from "@/constants";
import { useProject, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import {
	ProjectFileCodeEditorControl,
	type ProjectFileCodeEditorControlValue,
} from "./project-file-code-editor-control";

export interface ProjectFileCodeEditorConfig {
	name: string;
	path: string;
	readOnly?: boolean;
}

const ProjectFileCodeEditorPanel: WorkbenchComponent<
	ProjectFileCodeEditorConfig
> = ({ config, id, rename, setValue }) => {
	const { project, permission } = useProject();
	const readOnly =
		Boolean(config.readOnly) ||
		!(permission === "OWNER" || permission === "EDIT");
	const actionsRef = useRef<React.ComponentRef<typeof FileCodeEditor> | null>(
		null,
	);
	const canSave = !readOnly;
	// setValue changes identity after writing the value.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		const value: ProjectFileCodeEditorControlValue = {
			canSave,
			refresh: () => actionsRef.current?.refresh(),
			save: () => void actionsRef.current?.save?.(),
		};
		setValue(value);
	}, [canSave]);
	useWorkbenchControl(id, ProjectFileCodeEditorControl);
	const mode = { type: "APP" as const, app: project.project_id };
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
				isDriverFile ? <MetadataHelpDialog compact /> : undefined
			}
			hideToolbar
			readOnly={readOnly}
		/>
	);
};

export const PROJECT_FILE_CODE_EDITOR_PANEL: WorkbenchPanelConfig<ProjectFileCodeEditorConfig> =
	{
		name: "Editor",
		canRename: false,
		mount: "keepAlive",
		matches: (a, b) => a.path === b.path,
		icon: ({ name, className }) => {
			const Icon = getFileIconComponent(name ?? "");
			return <Icon className={className} />;
		},
		content: ProjectFileCodeEditorPanel,
	};
