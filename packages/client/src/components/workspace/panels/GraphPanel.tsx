import { ReactFlow } from "@xyflow/react";
import { observer } from "mobx-react-lite";
import { Panel } from "./Panel";

export const GraphPanel: React.FC = observer(() => {
	return (
		<Panel>
			<ReactFlow nodes={[]} edges={[]} />
		</Panel>
	);
});
