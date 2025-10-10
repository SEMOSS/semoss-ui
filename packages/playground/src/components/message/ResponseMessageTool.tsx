import { GridViewRounded } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { FlexLayout } from "@semoss/shared";
import { Stack, styled, Typography } from "@semoss/ui";
import type { ResponseMessageStore } from "@/stores";

const StyledSidebarOpen = styled(Stack, {
	shouldForwardProp: (prop) => prop !== "disabled",
})<{
	disabled: boolean;
}>(({ theme, disabled }) => ({
	padding: "8px",
	borderRadius: "12px",
	borderWidth: "1px",
	borderStyle: "solid",
	borderColor: theme.palette.secondary.border,
	cursor: disabled ? "not-allowed" : "pointer",
	opacity: disabled ? theme.palette.action.disabledOpacity : 1,
	pointerEvents: disabled ? "none" : "auto",
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

		// TODO: if the plan is executing, only the execution step is enabled
		let isDisabled = false;
		if (room.mode === "executing") {
			isDisabled =
				room.plan?.step?.details.stepType !== "tool_call" ||
				room.plan?.step?.details.tool_name !== tool.name ||
				room.plan?.step?.details._meta.map.SMSS_PROJECT_ID !==
					tool._meta.map.SMSS_PROJECT_ID;
		}

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
					disabled={isDisabled}
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
