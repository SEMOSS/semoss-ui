import { CloseRounded } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { FlexLayout } from "@semoss/shared";
import { styled } from "@semoss/ui";
import { ArtifactApp, RightMenu } from "@/components";
import type { RoomStore } from "@/stores";

const StyledContent = styled("div")(() => ({
	position: "relative",
	height: "100%",
	width: "100%",
	overflow: "hidden",
}));

interface RoomArtifactProps {
	/** Room to render */
	room: RoomStore;
}

export const RoomArtifact: React.FC<RoomArtifactProps> = observer(
	({ room }) => {
		return (
			<RightMenu header={"Artifacts"} onClose={() => room.closeSidebar()}>
				<StyledContent>
					<FlexLayout.Layout
						model={room.artifact.model}
						factory={(node) => {
							return <ArtifactApp node={node} />;
						}}
						icons={{
							close: <CloseRounded fontSize="small" />,
						}}
					/>
				</StyledContent>
			</RightMenu>
		);
	},
);
