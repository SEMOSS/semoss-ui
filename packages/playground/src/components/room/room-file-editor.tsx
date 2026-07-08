import { observer } from "mobx-react-lite";
import { FileEditor, FlexLayout } from "@semoss/shared";
import type { RoomStore } from "@/stores";

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL
	? import.meta.env.VITE_PLATFORM_URL
	: "";

interface RoomFileEditorProps {
	/** Node */
	node: FlexLayout.TabNode;

	/** Room */
	room: RoomStore;
}

export const RoomFileEditor: React.FC<RoomFileEditorProps> = observer(
	({ node, room }) => {
		const config: {
			name: string;
			path: string;
			initialTab?: "edit" | "preview";
		} = node.getConfig();

		return (
			<FileEditor
				mode={{
					type: "INSIGHT",
				}}
				path={config.path}
				platformUrl={PLATFORM_URL}
				notebookInitialTab={config.initialTab}
				onNotebookRowSelectionChange={(selection) => {
					room.setSelectedNotebookRow(selection);
				}}
				onChange={(_content, isModified) => {
					const updated = isModified
						? `${config.name}*`
						: config.name;

					// rename the tab
					room.sidebar.model.doAction(
						FlexLayout.Actions.renameTab(node.getId(), updated),
					);
				}}
			/>
		);
	},
);
