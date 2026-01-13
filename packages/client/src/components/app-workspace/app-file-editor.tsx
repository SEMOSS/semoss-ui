import { observer } from "mobx-react-lite";
import { FileEditor, FlexLayout } from "@semoss/shared";

interface AppFileEditorProps {
	/** Node */
	node: FlexLayout.TabNode;

	/** App */
	app: string;
}

export const AppFileEditor: React.FC<AppFileEditorProps> = observer(
	({ node, app }) => {
		const config: {
			name: string;
			path: string;
		} = node.getConfig();

		return (
			<FileEditor
				mode={{
					type: "APP",
					app: app,
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
