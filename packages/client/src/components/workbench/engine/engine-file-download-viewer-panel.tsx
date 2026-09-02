import {
	FileDownloadView,
	type FileMode,
	getFileIconComponent,
} from "@semoss/shared";
import { useEngine } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";

export interface EngineFileDownloadViewerConfig {
	name: string;
	path: string;
	fileMode?: "ENGINE" | "INSIGHT";
	insightId?: string;
}

const EngineFileDownloadViewerPanel: WorkbenchComponent<
	EngineFileDownloadViewerConfig
> = ({ config }) => {
	const { engine } = useEngine();
	const mode: FileMode =
		config.fileMode === "INSIGHT" && config.insightId
			? { type: "INSIGHT", insightId: config.insightId }
			: { type: "ENGINE", engine: engine.engine_id };

	return <FileDownloadView mode={mode} path={config.path} />;
};

export const ENGINE_FILE_DOWNLOAD_VIEWER_PANEL: WorkbenchPanelConfig<EngineFileDownloadViewerConfig> =
	{
		name: "Download",
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
		content: EngineFileDownloadViewerPanel,
	};
