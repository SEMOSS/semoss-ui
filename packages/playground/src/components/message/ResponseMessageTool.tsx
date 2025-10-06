import { GridViewRounded } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { FlexLayout } from "@semoss/shared";
import { Stack, styled, Typography } from "@semoss/ui";
import type { ResponseMessageStore } from "@/stores";

const StyledSidebarOpen = styled(Stack)(({ theme }) => ({
	padding: "8px",
	borderRadius: "12px",
	borderWidth: "1px",
	borderStyle: "solid",
	borderColor: theme.palette.secondary.border,
	cursor: "pointer",
}));

interface ResponseMessageToolProps {
	/** Message to render */
	message: ResponseMessageStore;

	/** Tool to render */
	tool: ResponseMessageStore["tools"][number];
}

export const ResponseMessageTool: React.FC<ResponseMessageToolProps> = observer(
	({ message, tool }) => {
		const { room } = message;

		return (
			<Stack direction={"column"} spacing={1} width={"100%"}>
				<Stack>
					<Typography variant="subtitle2" noWrap={true}>
						{tool._meta.map.SMSS_PROJECT_NAME}
					</Typography>
					<Typography variant="caption" noWrap={true}>
						{tool.title}
					</Typography>
				</Stack>
				<StyledSidebarOpen
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
								FlexLayout.Actions.selectTab(
									selectedNode.getId(),
								),
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
										app: tool._meta.map.SMSS_PROJECT_ID,
										tool: {
											message: message.id,
											id: tool.id,
											name: tool.name,
											parameters: tool.parameters,
										},
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
					<GridViewRounded
						fontSize="medium"
						sx={{ color: "#757575" }}
					/>
					<Stack direction={"column"} spacing={1} flex={1}>
						<Typography variant="subtitle2" noWrap={true}>
							{tool.title}
						</Typography>
						<Typography variant="caption">Click to Open</Typography>
					</Stack>
				</StyledSidebarOpen>
			</Stack>
		);
	},
);
