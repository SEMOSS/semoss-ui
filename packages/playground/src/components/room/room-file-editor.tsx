import { observer } from "mobx-react-lite";
import { FileEditor, FlexLayout } from "@semoss/shared";
import type { RoomStore } from "@/stores";

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
		} = node.getConfig();

		return (
			<FileEditor
				mode={{
					type: "APP",
					app: "059ad2f3-fae4-4c56-8b1e-a1933d540846",
				}}
				path={config.path}
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
