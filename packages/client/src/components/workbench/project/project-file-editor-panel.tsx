import { FileEditor, getFileIconComponent } from "@semoss/shared";
import { MetadataHelpDialog } from "@/components/shared";
import { MCP } from "@/constants";
import { useProject } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";

/** The config a project file-editor instance is opened with. */
export interface ProjectFileEditorConfig {
	name: string;
	path: string;
	/** Forced view-only mode, set by the read-only workbenches. */
	readOnly?: boolean;
}

/**
 * Project-scoped file editor panel — the `APP`-mode twin of
 * `EngineFileEditorPanel`. Marks its tab with a trailing `*` while the file has
 * unsaved changes. A forced view-only mode comes through `config.readOnly`
 * (set by view-only workbenches).
 */
export const ProjectFileEditorPanel: WorkbenchComponent<
	ProjectFileEditorConfig
> = ({ config, rename }) => {
	const { project, permission } = useProject();

	const isReadOnly =
		Boolean(config.readOnly) ||
		!(permission === "OWNER" || permission === "EDIT");

	const isDriverFile = MCP.DRIVER_PATHS.some((f) => config.path.endsWith(f));

	return (
		<FileEditor
			mode={{
				type: "APP",
				app: project.project_id,
			}}
			path={config.path}
			readOnly={isReadOnly}
			leadingToolbar={
				isDriverFile ? <MetadataHelpDialog compact /> : undefined
			}
			onChange={(_content, isModified) => {
				// the dirty marker is a programmatic rename; canRename only
				// gates user-facing rename affordances
				rename(isModified ? `${config.name}*` : config.name);
			}}
		/>
	);
};

/**
 * Blueprint for project file-editor instances. Instances dedupe on their file
 * path, so a renamed file re-selects its open editor instead of opening a
 * duplicate. That is `selectPanel`'s behaviour only — dragging a file out of
 * the explorer deliberately spawns a second view of it. keepAlive: unsaved
 * buffers survive tab switches.
 */
export const PROJECT_FILE_EDITOR_PANEL: WorkbenchPanelConfig<ProjectFileEditorConfig> =
	{
		name: "Editor",
		canRename: false,
		mount: "keepAlive",
		matches: (a, b) => a.path === b.path,
		icon: ({ name, className }) => {
			const Icon = getFileIconComponent(name ?? "");
			return <Icon className={className} />;
		},
		content: ProjectFileEditorPanel,
	};
