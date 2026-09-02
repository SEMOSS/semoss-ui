import { useEffect, useRef } from "react";
import {
	type FileMode,
	FilePdfViewer,
	getFileIconComponent,
} from "@semoss/shared";
import { useEngine, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import {
	EngineFilePdfEditorControl,
	type EngineFilePdfEditorControlValue,
} from "./engine-file-pdf-editor-control";

export interface EngineFilePdfEditorConfig {
	name: string;
	path: string;
	fileMode?: "ENGINE" | "INSIGHT";
	insightId?: string;
}

const EngineFilePdfEditorPanel: WorkbenchComponent<
	EngineFilePdfEditorConfig
> = ({ config, id, setValue }) => {
	const { engine } = useEngine();
	const viewerRef = useRef<React.ComponentRef<typeof FilePdfViewer> | null>(
		null,
	);
	// setValue changes identity after writing the value.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		const value: EngineFilePdfEditorControlValue = {
			refresh: () => viewerRef.current?.refresh(),
		};
		setValue(value);
	}, []);
	useWorkbenchControl(id, EngineFilePdfEditorControl);
	const mode: FileMode =
		config.fileMode === "INSIGHT" && config.insightId
			? { type: "INSIGHT", insightId: config.insightId }
			: { type: "ENGINE", engine: engine.engine_id };

	return (
		<FilePdfViewer
			ref={(actions) => {
				viewerRef.current = actions;
			}}
			mode={mode}
			path={config.path}
		/>
	);
};

export const ENGINE_FILE_PDF_EDITOR_PANEL: WorkbenchPanelConfig<EngineFilePdfEditorConfig> =
	{
		name: "PDF",
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
		content: EngineFilePdfEditorPanel,
	};
