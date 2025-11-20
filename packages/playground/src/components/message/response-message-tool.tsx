import { CheckIcon, HammerIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
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

		// this will render the component whenever the sidebar model changes
		room.sidebar.counter;

		const nodeId = `message-${message.id}-tool-${tool.id}`;

		// track if it is active
		const isActive =
			room.sidebar.isOpen && !!room.sidebar.model.getNodeById(nodeId);

		// TODO: if the plan is executing, only the execution step is enabled
		let isDisabled = false;
		if (room.mode === "executing") {
			isDisabled =
				room.plan?.step?.details.stepType !== "tool_call" ||
				room.plan?.step?.details.tool_name !== tool.name ||
				room.plan?.step?.details._meta.map.SMSS_PROJECT_ID !==
					tool._meta.map.SMSS_PROJECT_ID;
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
				className={`group flex w-full flex-row items-center gap-5 rounded-lg border border-border bg-primary-foreground p-4 text-left shadow-sm ${
					isDisabled
						? "cursor-not-allowed opacity-50"
						: `cursor-pointer hover:bg-accent ${isActive ? "border-primary" : ""}`
				}`}
				onClick={() => {
					if (room.isSidebarNodeSelected(nodeId)) {
						room.removeSidebarNode(nodeId);
					} else {
						// open the sidebar
						room.addSidebarNode(nodeId, {
							type: "tab",
							name: tool.title,
							component: "room-tool",
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
						});
					}
				}}
			>
				<div
					className={`mr-1 flex size-9 flex-col items-center justify-center overflow-hidden rounded bg-primary/10 p-2 text-primary`}
				>
					{icon}
				</div>
				<div className="flex-1">
					<div
						className="truncate text-base"
						title={tool.title}
					>
						{tool.title}
					</div>
					<div
						className="truncate text-muted-foreground text-sm"
						title={tool.title}
					>
						{tool.title}
					</div>
				</div>
			</button>
		);
	},
);
