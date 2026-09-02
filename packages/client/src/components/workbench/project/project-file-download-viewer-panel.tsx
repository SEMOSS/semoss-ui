import { FileDownloadView, getFileIconComponent } from "@semoss/shared";
import { useProject } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";

export interface ProjectFileDownloadViewerConfig {
	name: string;
	path: string;
	readOnly?: boolean;
}

const ProjectFileDownloadViewerPanel: WorkbenchComponent<
	ProjectFileDownloadViewerConfig
> = ({ config }) => {
	const { project } = useProject();

	return (
		<FileDownloadView
			mode={{ type: "APP", app: project.project_id }}
			path={config.path}
		/>
	);
};

export const PROJECT_FILE_DOWNLOAD_VIEWER_PANEL: WorkbenchPanelConfig<ProjectFileDownloadViewerConfig> =
	{
		name: "Download",
		canRename: false,
		mount: "keepAlive",
		matches: (a, b) => a.path === b.path,
		icon: ({ name, className }) => {
			const Icon = getFileIconComponent(name ?? "");
			return <Icon className={className} />;
		},
		content: ProjectFileDownloadViewerPanel,
	};
