import { useEffect, useRef } from "react";
import { FileImageViewer, getFileIconComponent } from "@semoss/shared";
import { useProject, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import {
	ProjectFileImageEditorControl,
	type ProjectFileImageEditorControlValue,
} from "./project-file-image-editor-control";

export interface ProjectFileImageEditorConfig {
	name: string;
	path: string;
	readOnly?: boolean;
}

const ProjectFileImageEditorPanel: WorkbenchComponent<
	ProjectFileImageEditorConfig
> = ({ config, id, setValue }) => {
	const { project } = useProject();
	const viewerRef = useRef<React.ComponentRef<typeof FileImageViewer> | null>(
		null,
	);
	// setValue changes identity after writing the value.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		const value: ProjectFileImageEditorControlValue = {
			refresh: () => viewerRef.current?.refresh(),
		};
		setValue(value);
	}, []);
	useWorkbenchControl(id, ProjectFileImageEditorControl);

	return (
		<FileImageViewer
			ref={(actions) => {
				viewerRef.current = actions;
			}}
			mode={{ type: "APP", app: project.project_id }}
			path={config.path}
		/>
	);
};

export const PROJECT_FILE_IMAGE_EDITOR_PANEL: WorkbenchPanelConfig<ProjectFileImageEditorConfig> =
	{
		name: "Image",
		canRename: false,
		mount: "keepAlive",
		matches: (a, b) => a.path === b.path,
		icon: ({ name, className }) => {
			const Icon = getFileIconComponent(name ?? "");
			return <Icon className={className} />;
		},
		content: ProjectFileImageEditorPanel,
	};
