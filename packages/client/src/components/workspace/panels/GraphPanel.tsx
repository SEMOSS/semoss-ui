import { ReactFlow } from "@xyflow/react";
import { observer } from "mobx-react-lite";
import { useBlocks } from "@semoss/renderer";
import { Typography, useNotification } from "@semoss/ui";
import { Panel } from "./Panel";

export const GraphPanel: React.FC = observer(() => {
	const notification = useNotification();

	const { state } = useBlocks();

	return (
		<Panel>
			<ReactFlow
				// width={'100%'}
				nodes={[]}
				edges={[]}
			/>
		</Panel>
	);
});
