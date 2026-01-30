import {
	AlertTriangleIcon,
	CheckIcon,
	HammerIcon,
	XCircleIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { Button, Spinner } from "@semoss/ui/next";
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
			tool.status === "LOADING",
			tool.json._meta.SMSS_MCP_UI?.loadingMessage
				? [tool.json._meta.SMSS_MCP_UI.loadingMessage]
				: [],
		);

		// this will render the component whenever the sidebar model changes
		room.sidebar.counter;

		// TODO: if the plan is executing, only the execution step is enabled
		let isDisabled = false;
		if (room.mode === "executing") {
			isDisabled =
				room.plan?.step?.details.stepType !== "tool_call" ||
				room.plan?.step?.details.tool_name !== tool.json.name ||
				room.plan?.step?.details._meta.SMSS_PROJECT_ID !==
					tool.json._meta.SMSS_PROJECT_ID;
		}

		let isActive = false;
		if (tool.display === "sidebar" && tool.isOpen && room.sidebar.isOpen) {
			isActive = true;
		} else if (tool.display === "inline" && tool.isOpen) {
			isActive = true;
		}

		// icon
		let icon = null;
		if (tool.status === "LOADING") {
			icon = <Spinner />;
		} else if (tool.status === "ERROR") {
			icon = <AlertTriangleIcon />;
		} else if (tool.status === "CANCELLED") {
			icon = <XCircleIcon />;
		} else if (tool.response) {
			icon = <CheckIcon />;
		} else {
			icon = <HammerIcon />;
		}

		// Don't render if hidden
		if (tool.display === "hidden") {
			return null;
		}

		return (
			<div className="flex flex-col gap-2">
				<div
					className={`group/toolcard flex w-full flex-row items-center gap-5 rounded-lg border border-border bg-primary-foreground p-4 text-left shadow-sm ${
						isDisabled
							? "cursor-not-allowed opacity-50"
							: `cursor-pointer hover:bg-accent ${isActive ? "border-primary" : ""}`
					}`}
				>
					<button
						type="button"
						disabled={isDisabled}
						className="flex flex-1 flex-row items-center gap-5 text-left"
						onClick={() => tool.openTool()}
					>
						<div className="flex items-center gap-2">
							<div
								className={`flex size-9 flex-col items-center justify-center overflow-hidden rounded p-2 ${
									tool.status === "ERROR" ||
									tool.status === "CANCELLED"
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
								title={tool.json.title}
							>
								{tool.json.title}
							</div>
							<div
								className="truncate text-muted-foreground text-sm"
								title={tool.json.title}
							>
								{/* {tool.title} */}
								{tool.status === "ERROR"
									? "Failed to execute tool"
									: tool.status === "CANCELLED"
										? "Tool execution cancelled"
										: tool.response
											? "Completed"
											: tool.json._meta
														.SMSS_MCP_EXECUTION ===
													"ask"
												? "Click to open"
												: tool.status === "LOADING"
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
										"",
										"cancelled",
									);

									// close it
									tool.closeTool();
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
