import { ReactFlow } from "@xyflow/react";
import { observer } from "mobx-react-lite";
import { Panel } from "./panel";

export const GraphPanel: React.FC = observer(() => {
	return (
		<Panel>
			<ReactFlow nodes={[]} edges={[]} />
		</Panel>
	);
});
