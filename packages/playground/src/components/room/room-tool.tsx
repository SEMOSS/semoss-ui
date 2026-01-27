import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import type { FlexLayout } from "@semoss/shared";
import { ToolsView } from "@/components";
import type { RoomStore } from "@/stores";

interface RoomToolProps {
	/** Room info */
	room: RoomStore;

	/** Node */
	node: FlexLayout.TabNode;
}

/**
 * Renders a tool inside a room
 *
 * @component
 */
export const RoomTool: React.FC<RoomToolProps> = observer(({ node, room }) => {
	const config: {
		app: string;
		tool: {
			message: string;
			id: string;
			name: string;
			title: string;
			parameters: Record<string, unknown>;
			original_name: string;
		};
	} = useMemo(() => {
		return node.getConfig();
	}, [node]);

	if (!config || !config.app || !config.tool) {
		return <div>No Tool</div>;
	}

	return <ToolsView room={room} app={config.app} tool={config.tool} />;
});
