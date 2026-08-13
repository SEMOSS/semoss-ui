import { observer } from "mobx-react-lite";
import { FileEditor, FlexLayout } from "@semoss/shared";
import { MetadataHelpDialog } from "@/components/shared";
import { MCP } from "@/constants";
import { useEngine } from "@/hooks";

interface EngineFileEditorPanelProps {
	/** Node */
	node: FlexLayout.TabNode;
}

export const EngineFileEditorPanel: React.FC<EngineFileEditorPanelProps> =
	observer(({ node }) => {
		const { engine, permission } = useEngine();
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

						// rename the tab
						node.getModel().doAction(
							FlexLayout.Actions.renameTab(node.getId(), updated),
						);
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

					// rename the tab
					node.getModel().doAction(
						FlexLayout.Actions.renameTab(node.getId(), updated),
					);
				}}
			/>
		);
	});
