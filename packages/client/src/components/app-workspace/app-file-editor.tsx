import { observer } from "mobx-react-lite";
import { FileEditor, FlexLayout } from "@semoss/shared";
import { MetadataHelpDialog } from "@/components/shared";
import { MCP } from "@/constants";

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

		const isDriverFile = MCP.DRIVER_PATHS.some((f) =>
			config.path.endsWith(f),
		);

		return (
			<FileEditor
				mode={{
					type: "APP",
					app: app,
				}}
				path={config.path}
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
	},
);
