import { observer } from "mobx-react-lite";
import { FileEditor, FlexLayout } from "@semoss/shared";

interface EngineFileEditorProps {
	/** Node */
	node: FlexLayout.TabNode;

	/** Engine */
	engine: string;
}

export const EngineFileEditor: React.FC<EngineFileEditorProps> = observer(
	({ node, engine }) => {
		const config: {
			name: string;
			path: string;
		} = node.getConfig();

		return (
			<FileEditor
				mode={{
					type: "ENGINE",
					engine: engine,
				}}
				path={config.path}
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
	},
);
