import { AppsRounded } from "@mui/icons-material";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { FlexLayout } from "@semoss/shared";
import { Stack, styled, Typography } from "@semoss/ui";
import type { ResponseMessageStore, RoomStore } from "@/stores";

const StyledSidebarOpen = styled(Stack, {
	shouldForwardProp: (prop) => prop !== "isSelected",
})<{
	isSelected: boolean;
}>(({ theme, isSelected }) => ({
	padding: theme.spacing(1),
	borderRadius: theme.shape.borderRadiusLg,
	borderWidth: "1px",
	borderStyle: "solid",
	borderColor: isSelected
		? theme.palette.primary.main
		: theme.palette.secondary.border,
	cursor: "pointer",
}));

interface ResponseMessageToolProps {
	/** Room to render */
	room: RoomStore;

	/** Message to render */
	message: ResponseMessageStore;

	/** Tool to render */
	tool: ResponseMessageStore["tools"][number];
}

export const ResponseMessageTool: React.FC<ResponseMessageToolProps> = observer(
	({ room, message, tool }) => {
		const isSelected = computed(() => {
			return (
				room.sidebar.isOpen &&
				room.sidebar.type === "ARTIFACTS" &&
				room.artifact.model.getNodeById(
					`message-${message.id}-tool-${tool.id}`,
				) !== undefined
			);
		}).get();

		return (
			<StyledSidebarOpen
				isSelected={isSelected}
				direction={"row"}
				alignItems={"center"}
				spacing={2}
				onClick={() => {
					// open the sidebar
					room.openSidebar("ARTIFACTS");

					// set the id
					const toolNodeId = `message-${message.id}-tool-${tool.id}`;

					// select the node if there
					const selectedNode =
						room.artifact.model.getNodeById(toolNodeId);
					if (selectedNode) {
						room.artifact.model.doAction(
							FlexLayout.Actions.selectTab(selectedNode.getId()),
						);
						return;
					}

					// create the node if it is not there
					// where to add the node
					const addId =
						room.artifact.model.getActiveTabset()?.getId() ||
						room.artifact.model
							.getRoot()
							.getChildren()[0]
							?.getId() ||
						"";

					// create and select the panel
					room.artifact.model.doAction(
						FlexLayout.Actions.addNode(
							{
								id: toolNodeId,
								type: "tab",
								name: tool.title,
								component: "tools-artifact",
								config: {
									messageId: message.id,
									appId: tool._meta.map.SMSS_PROJECT_ID,
									toolId: tool.id,
									toolName: tool.name,
									toolArguments: tool.arguments,
								},
								enableClose: true,
							},
							addId,
							FlexLayout.DockLocation.CENTER,
							-1,
							true,
						),
					);
				}}
			>
				<AppsRounded fontSize="medium" />
				<Stack direction={"column"} spacing={1} flex={1}>
					<Typography
						variant="subtitle2"
						sx={{
							textOverflow: "ellipsis",
						}}
					>
						{tool.title}
					</Typography>
					<Typography variant="caption">Click to Open</Typography>
				</Stack>
			</StyledSidebarOpen>
		);
	},
);
