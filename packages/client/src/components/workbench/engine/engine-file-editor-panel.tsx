import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { FileEditor, type FlexLayout } from "@semoss/shared";
import { MetadataHelpDialog } from "@/components/shared";
import { MCP } from "@/constants";
import { useEngine, useWorkbench } from "@/hooks";

interface EngineFileEditorPanelProps {
	/** FlexLayout tab node backing the file editor. */
	node: FlexLayout.TabNode;
}

export const EngineFileEditorPanel: React.FC<EngineFileEditorPanelProps> =
	observer(({ node }) => {
		const { engine, permission } = useEngine();
		const registerCommand = useWorkbench((state) => state.registerCommand);
		const renamePanel = useWorkbench((state) => state.renamePanel);

		const readOnly = !(permission === "OWNER" || permission === "EDIT");

		const config: {
			name: string;
			path: string;
			fileMode?: "ENGINE" | "INSIGHT";
			insightId?: string;
		} = node.getConfig();

		const isDriverFile = MCP.DRIVER_PATHS.some((f) =>
			config.path.endsWith(f),
		);

		useEffect(() => {
			const panelId = node.getId();

			return registerCommand({
				id: `workbench.engine-file-editor.${panelId}.close`,
				label: `Close ${node.getName()}`,
				description: "Close this database query panel.",
				icon: null,
				handler: (get) => {
					get().closePanel(panelId);
				},
			});
		}, [node, registerCommand]);

		if (config.fileMode === "INSIGHT" && config.insightId) {
			return (
				<FileEditor
					mode={{
						type: "INSIGHT",
						insightId: config.insightId,
					}}
					path={config.path}
					readOnly={readOnly}
					onChange={(_content, isModified) => {
						const updated = isModified
							? `${config.name}*`
							: config.name;

						renamePanel(node.getId(), updated);
					}}
				/>
			);
		}

		return (
			<FileEditor
				mode={{
					type: "ENGINE",
					engine: engine.engine_id,
				}}
				path={config.path}
				readOnly={readOnly}
				leadingToolbar={
					isDriverFile ? <MetadataHelpDialog compact /> : undefined
				}
				onChange={(_content, isModified) => {
					const updated = isModified
						? `${config.name}*`
						: config.name;

					renamePanel(node.getId(), updated);
				}}
			/>
		);
	});
