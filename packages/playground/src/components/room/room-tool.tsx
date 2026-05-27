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
		message: string;
		toolId: string;
	} = useMemo(() => {
		return node.getConfig();
	}, [node]);

	// `app` is empty for server tools (provider-executed) — ToolsView handles
	// the routing internally.
	if (!config || !config.message || !config.toolId) {
		return <div>No Tool</div>;
	}

	return (
		<ToolsView
			room={room}
			app={config.app}
			message={config.message}
			toolId={config.toolId}
		/>
	);
});
