import { useEffect, useRef } from "react";
import { usePixel } from "@semoss/sdk/react";
import { getFileIconComponent } from "@semoss/shared";
import { Muted, Spinner } from "@semoss/ui/next";
import { useProject, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import { getImageMimeType } from "../file-editor.utility";
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
	const image = usePixel<string>(
		`GetAppAssetsBase64(filePath=[${JSON.stringify(config.path)}], project=[${JSON.stringify(project.project_id)}]);`,
		{ data: "" },
	);
	const refreshRef = useRef(image.refresh);
	refreshRef.current = image.refresh;

	// setValue changes identity after writing the value.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		const value: ProjectFileImageEditorControlValue = {
			refresh: () => refreshRef.current(),
		};
		setValue(value);
	}, []);
	useWorkbenchControl(id, ProjectFileImageEditorControl);

	if (image.status === "LOADING" || image.status === "INITIAL") {
		return (
			<output
				className="flex size-full items-center justify-center"
				aria-label="Loading image"
			>
				<Spinner />
			</output>
		);
	}

	if (image.status === "ERROR") {
		return (
			<div className="flex size-full items-center justify-center p-4">
				<Muted className="text-destructive" role="alert">
					{image.error?.message || "Failed to load image"}
				</Muted>
			</div>
		);
	}

	return (
		<div className="flex size-full items-center justify-center overflow-hidden bg-background p-4">
			<img
				className="max-h-full max-w-full object-contain"
				src={`data:${getImageMimeType(config.path)};base64,${image.data}`}
				alt={`Preview of ${config.name}`}
			/>
		</div>
	);
};

export const PROJECT_FILE_IMAGE_EDITOR_PANEL: WorkbenchPanelConfig<ProjectFileImageEditorConfig> =
	{
		name: "Image",
		canRename: false,
		mount: "keepAlive",
		matches: (a, b) => a.path === b.path,
		icon: ({ config, className }) => {
			const Icon = getFileIconComponent(config.path ?? "");
			return <Icon className={className} />;
		},
		content: ProjectFileImageEditorPanel,
	};
