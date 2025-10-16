import { CheckIcon, HammerIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { FlexLayout } from "@semoss/shared";
import type { ResponseMessageStore } from "@/stores";

// Styled component replaced with Tailwind classes inline
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

		let color = "";
		if (tool.response) {
			color = "bg-primary";
		} else {
			color = "bg-secondary";
		}

		let icon = null;
		if (tool.response) {
			icon = <CheckIcon />;
		} else {
			icon = <HammerIcon />;
		}

		return (
			<button
				type="button"
				disabled={isDisabled}
				className={`group flex w-full flex-row items-start gap-2 rounded-lg border border-border px-3 py-2 ${
					isDisabled
						? "cursor-not-allowed opacity-50"
						: "cursor-pointer hover:bg-accent"
				}`}
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
				<div
					className={`${color} mr-1 flex size-8 flex-col items-center justify-center overflow-hidden rounded-full p-2`}
				>
					{icon}
				</div>
				<span className="wrap-break-word mt-1 text-left text-base">
					{tool.title}
				</span>
			</button>
		);
	},
);
