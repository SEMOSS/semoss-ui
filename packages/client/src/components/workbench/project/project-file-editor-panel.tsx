import { useEffect } from "react";
import { FileEditor, type FlexLayout } from "@semoss/shared";
import { MetadataHelpDialog } from "@/components/shared";
import { MCP } from "@/constants";
import { useProject, useWorkbench } from "@/hooks";

interface ProjectFileEditorPanelProps {
	/** FlexLayout tab node backing the file editor. */
	node: FlexLayout.TabNode;

	/**
	 * Forces view-only behavior regardless of permission. Read-only is already
	 * derived from the project permission, so this is only needed by view-only
	 * workbenches that must stay read-only for an OWNER/EDIT user.
	 */
	readOnly?: boolean;
}

/**
 * Project-scoped file editor panel — the `APP`-mode twin of
 * `EngineFileEditorPanel`. Marks its tab with a trailing `*` while the file has
 * unsaved changes and registers a command to close itself.
 */
export const ProjectFileEditorPanel: React.FC<ProjectFileEditorPanelProps> = ({
	node,
	readOnly = false,
}) => {
	const { project, permission } = useProject();
	const registerCommand = useWorkbench((state) => state.registerCommand);
	const renamePanel = useWorkbench((state) => state.renamePanel);

	const isReadOnly =
		readOnly || !(permission === "OWNER" || permission === "EDIT");

	const config: {
		name: string;
		path: string;
	} = node.getConfig();

	const isDriverFile = MCP.DRIVER_PATHS.some((f) => config.path.endsWith(f));

	useEffect(() => {
		const panelId = node.getId();

		return registerCommand({
			id: `workbench.project-file-editor.${panelId}.close`,
			label: `Close ${node.getName()}`,
			description: "Close this file editor panel.",
			icon: null,
			handler: (get) => {
				get().closePanel(panelId);
			},
		});
	}, [node, registerCommand]);

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
				const updated = isModified ? `${config.name}*` : config.name;

				renamePanel(node.getId(), updated);
			}}
		/>
	);
};
