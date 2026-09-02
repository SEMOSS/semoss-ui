import { useEffect, useRef } from "react";
import { FilePdfViewer, getFileIconComponent } from "@semoss/shared";
import { useProject, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import {
	ProjectFilePdfEditorControl,
	type ProjectFilePdfEditorControlValue,
} from "./project-file-pdf-editor-control";

export interface ProjectFilePdfEditorConfig {
	name: string;
	path: string;
	readOnly?: boolean;
}

const ProjectFilePdfEditorPanel: WorkbenchComponent<
	ProjectFilePdfEditorConfig
> = ({ config, id, setValue }) => {
	const { project } = useProject();
	const viewerRef = useRef<React.ComponentRef<typeof FilePdfViewer> | null>(
		null,
	);
	// setValue changes identity after writing the value.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		const value: ProjectFilePdfEditorControlValue = {
			refresh: () => viewerRef.current?.refresh(),
		};
		setValue(value);
	}, []);
	useWorkbenchControl(id, ProjectFilePdfEditorControl);

	return (
		<FilePdfViewer
			ref={(actions) => {
				viewerRef.current = actions;
			}}
			mode={{ type: "APP", app: project.project_id }}
			path={config.path}
		/>
	);
};

export const PROJECT_FILE_PDF_EDITOR_PANEL: WorkbenchPanelConfig<ProjectFilePdfEditorConfig> =
	{
		name: "PDF",
		canRename: false,
		mount: "keepAlive",
		matches: (a, b) => a.path === b.path,
		icon: ({ name, className }) => {
			const Icon = getFileIconComponent(name ?? "");
			return <Icon className={className} />;
		},
		content: ProjectFilePdfEditorPanel,
	};
