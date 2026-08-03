import { useStore } from "zustand";
import { FileEditor, FlexLayout } from "@semoss/shared";
import type { RoomStore } from "@/stores";

interface RoomFileEditorProps {
	/** Node */
	node: FlexLayout.TabNode;

	/** Room */
	room: RoomStore;
}

export const RoomFileEditor: React.FC<RoomFileEditorProps> = ({
	node,
	room,
}) => {
	const insightId = useStore(room, (s) => s.insightId);
	const config: {
		name: string;
		path: string;
	} = node.getConfig();

	return (
		<FileEditor
			mode={{
				type: "INSIGHT",
				insightId,
			}}
			path={config.path}
			onChange={(_content, isModified) => {
				const updated = isModified ? `${config.name}*` : config.name;

				// rename the tab
				room.sidebar.model.doAction(
					FlexLayout.Actions.renameTab(node.getId(), updated),
				);
			}}
		/>
	);
};
