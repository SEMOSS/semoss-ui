import { useEffect, useRef } from "react";
import {
	FileImageViewer,
	type FileMode,
	getFileIconComponent,
} from "@semoss/shared";
import { useEngine, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import {
	EngineFileImageEditorControl,
	type EngineFileImageEditorControlValue,
} from "./engine-file-image-editor-control";

export interface EngineFileImageEditorConfig {
	name: string;
	path: string;
	fileMode?: "ENGINE" | "INSIGHT";
	insightId?: string;
}

const EngineFileImageEditorPanel: WorkbenchComponent<
	EngineFileImageEditorConfig
> = ({ config, id, setValue }) => {
	const { engine } = useEngine();
	const viewerRef = useRef<React.ComponentRef<typeof FileImageViewer> | null>(
		null,
	);
	// setValue changes identity after writing the value.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		const value: EngineFileImageEditorControlValue = {
			refresh: () => viewerRef.current?.refresh(),
		};
		setValue(value);
	}, []);
	useWorkbenchControl(id, EngineFileImageEditorControl);
	const mode: FileMode =
		config.fileMode === "INSIGHT" && config.insightId
			? { type: "INSIGHT", insightId: config.insightId }
			: { type: "ENGINE", engine: engine.engine_id };

	return (
		<FileImageViewer
			ref={(actions) => {
				viewerRef.current = actions;
			}}
			mode={mode}
			path={config.path}
		/>
	);
};

export const ENGINE_FILE_IMAGE_EDITOR_PANEL: WorkbenchPanelConfig<EngineFileImageEditorConfig> =
	{
		name: "Image",
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
		content: EngineFileImageEditorPanel,
	};
