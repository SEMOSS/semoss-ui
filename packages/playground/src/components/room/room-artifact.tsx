import { XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { FlexLayout } from "@semoss/shared";
import { RoomSidebar, ToolsArtifact } from "@/components";
import type { RoomStore } from "@/stores";

interface RoomArtifactProps {
	/** Room to render */
	room: RoomStore;
}

export const RoomArtifact: React.FC<RoomArtifactProps> = observer(
	({ room }) => {
		return (
			<RoomSidebar
				header={"Tools"}
				maximize={true}
				onClose={() => room.closeSidebar()}
			>
				<div className="relative h-full w-full overflow-hidden">
					<FlexLayout.Layout
						model={room.artifact.model}
						factory={(node) => {
							return <ToolsArtifact node={node} />;
						}}
						icons={{
							close: <XIcon />,
						}}
					/>
				</div>
			</RoomSidebar>
		);
	},
);
