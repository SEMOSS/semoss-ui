import {
	AlertTriangleIcon,
	CheckIcon,
	CirclePause,
	HammerIcon,
	XCircleIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { Button, cn, Spinner } from "@semoss/ui/next";
import { useLoadingMessage } from "@/hooks";
import type { ResponseMessageStore, ToolStore } from "@/stores";

// Styled component replaced with Tailwind classes inline
interface ResponseMessageToolProps {
	/** Message to render */
	message: ResponseMessageStore;

	/** Tool to render */
	tool: ToolStore;
}

export const ResponseMessageTool: React.FC<ResponseMessageToolProps> = observer(
	({ message, tool }) => {
		const { t } = useTranslation("chat");
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
		} else if (tool.status === "PAUSED") {
			icon = <CirclePause />;
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
					className={`group/toolcard flex w-full flex-row items-center gap-2 rounded-md border border-border px-3 py-2 text-left ${
						isDisabled
							? "opacity-50"
							: `hover:bg-accent ${isActive ? "border-primary" : ""}`
					}`}
				>
					<button
						type="button"
						disabled={isDisabled}
						className={cn(
							"flex flex-1 flex-row items-center gap-2 text-left",
							isDisabled
								? "cursor-not-allowed"
								: "cursor-pointer",
						)}
						onClick={() => tool.openTool()}
					>
						<div
							className={`flex size-6 flex-col items-center justify-center overflow-hidden rounded p-1 ${
								tool.status === "ERROR"
									? "bg-destructive/10 text-destructive"
									: tool.status === "CANCELLED" ||
											tool.status === "PAUSED"
										? "bg-muted text-muted-foreground"
										: "bg-primary/10 text-primary"
							}`}
						>
							{icon}
						</div>
						<div
							className="flex-1 truncate font-medium text-foreground text-sm"
							title={tool.json.title}
						>
							{tool.json.title}
						</div>
					</button>
					<div className="flex flex-row items-center gap-2">
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
										{},
									);

									// close it
									tool.closeTool();
								}}
							>
								{t("tool.cancel")}
							</Button>
						)}
						<div
							className="truncate text-muted-foreground text-xs"
							title={tool.json.title}
						>
							{tool.status === "ERROR"
								? t("tool.failed")
								: tool.status === "CANCELLED"
									? t("tool.cancelled")
									: tool.status === "PAUSED"
										? t("tool.paused")
										: tool.response
											? t("tool.completed")
											: tool.json._meta
														.SMSS_MCP_EXECUTION ===
													"ask"
												? t("tool.ready")
												: tool.status === "LOADING"
													? toolExecutionMessage
													: t("tool.autoExecute")}
						</div>
					</div>
				</div>
			</div>
		);
	},
);
