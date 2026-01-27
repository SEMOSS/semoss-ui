import {
	AlertTriangleIcon,
	CheckIcon,
	HammerIcon,
	Loader2Icon,
	XCircleIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { Button } from "@semoss/ui/next";
import {
	MCP_DISPLAY_HIDDEN,
	MCP_DISPLAY_INLINE,
	TOOL_CANCELLATION_PROMPT,
} from "@/constants";
import { useLoadingMessage } from "@/hooks";
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

		/**
		 * Library hooks
		 */
		const { loadingMessage: toolExecutionMessage } = useLoadingMessage(
			tool.is_executing,
			tool._meta.SMSS_MCP_UI?.loadingMessage
				? [tool._meta.SMSS_MCP_UI.loadingMessage]
				: [],
		);

		// this will render the component whenever the sidebar model changes
		room.sidebar.counter;

		/**
		 * Constants
		 */
		const nodeId = `message-${message.id}-tool-${tool.id}`;

		// track if it is active in sidebar
		const isActiveInSidebar =
			room.sidebar.isOpen && !!room.sidebar.model.getNodeById(nodeId);

		// track if it is active inline
		const isActiveInline = room.isInlineToolOpen(nodeId);

		// TODO: if the plan is executing, only the execution step is enabled
		let isDisabled = false;
		if (room.mode === "executing") {
			isDisabled =
				room.plan?.step?.details.stepType !== "tool_call" ||
				room.plan?.step?.details.tool_name !== tool.name ||
				room.plan?.step?.details._meta.SMSS_PROJECT_ID !==
					tool._meta.SMSS_PROJECT_ID;
		}

		// icon
		let icon = null;
		if (tool.is_executing) {
			icon = <Loader2Icon className="animate-spin" />;
		} else if (tool.tool_status === "error") {
			icon = <AlertTriangleIcon />;
		} else if (tool.tool_status === "cancelled") {
			icon = <XCircleIcon />;
		} else if (tool.response) {
			icon = <CheckIcon />;
		} else {
			icon = <HammerIcon />;
		}

		/**
		 * Open tool in the default location based on SMSS_MCP_UI.displayLocation
		 */
		const openToolInDefaultLocation = () => {
			// Already open somewhere - do nothing
			if (isActiveInSidebar || isActiveInline) {
				return;
			}

			const toolConfig = {
				app: tool._meta.SMSS_PROJECT_ID,
				tool: {
					message: message.id,
					id: tool.id,
					name: tool.name,
					title: tool.title,
					parameters: tool.parameters,
					original_name: tool.original_name,
				},
			};

			if (
				tool._meta.SMSS_MCP_UI?.displayLocation === MCP_DISPLAY_HIDDEN
			) {
				//noop
			} else if (
				tool._meta.SMSS_MCP_UI?.displayLocation === MCP_DISPLAY_INLINE
			) {
				room.addInlineTool(nodeId, toolConfig);
			} else {
				// Default to sidebar
				room.addSidebarNode(nodeId, {
					type: "tab",
					name: tool.title,
					component: "room-tool",
					config: toolConfig,
					enableClose: true,
				});
			}
		};

		// Don't render if hidden
		if (tool._meta.SMSS_MCP_UI?.displayLocation === MCP_DISPLAY_HIDDEN) {
			return null;
		}

		return (
			<div className="flex flex-col gap-2">
				<div
					className={`group/toolcard flex w-full flex-row items-center gap-5 rounded-lg border border-border bg-primary-foreground p-4 text-left shadow-sm ${
						isDisabled
							? "cursor-not-allowed opacity-50"
							: `cursor-pointer hover:bg-accent ${isActiveInSidebar || isActiveInline ? "border-primary" : ""}`
					}`}
				>
					<button
						type="button"
						disabled={isDisabled}
						className="flex flex-1 flex-row items-center gap-5 text-left"
						onClick={() => openToolInDefaultLocation()}
					>
						<div className="flex items-center gap-2">
							<div
								className={`flex size-9 flex-col items-center justify-center overflow-hidden rounded p-2 ${
									tool.tool_status === "error" ||
									tool.tool_status === "cancelled"
										? "bg-destructive/10 text-destructive"
										: "bg-primary/10 text-primary"
								}`}
							>
								{icon}
							</div>
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
								{/* {tool.title} */}
								{tool.tool_status === "error"
									? "Failed to execute tool"
									: tool.tool_status === "cancelled"
										? "Tool execution cancelled"
										: tool.response
											? "Completed"
											: tool._meta.SMSS_MCP_EXECUTION ===
													"ask"
												? "Click to open"
												: tool.is_executing
													? toolExecutionMessage
													: "This tool is set to auto-execute"}
							</div>
						</div>
					</button>
					<div className="flex items-center gap-2">
						{!tool.response && (
							<Button
								type="button"
								size="sm"
								variant="outline"
								className="invisible hover:text-destructive group-hover/toolcard:visible"
								onClick={(e) => {
									e.stopPropagation();
									message.saveToolExecution(
										tool,
										TOOL_CANCELLATION_PROMPT,
										"cancelled",
									);
								}}
							>
								Cancel
							</Button>
						)}
					</div>
				</div>
			</div>
		);
	},
);
