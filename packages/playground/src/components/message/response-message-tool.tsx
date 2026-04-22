import { CheckIcon, CirclePause, HammerIcon, XCircleIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { Button, cn, Spinner } from "@semoss/ui/next";
import { useLoadingMessage } from "@/hooks";
import type { ResponseMessageStore, ToolStore } from "@/stores";
import { RoomInlineTool } from "../room";
import { ResponseMessageToolMenu } from "./response-message-tool-menu";

const getToolState = (
	tool: ToolStore,
	t: ReturnType<typeof useTranslation<"chat">>["t"],
	toolExecutionMessage: string,
) => {
	switch (tool.status) {
		case "ERROR":
		case "CANCELLED":
		case "PAUSED": {
			const config = {
				ERROR: {
					icon: <XCircleIcon className="size-5" />,
					badge: {
						text: t("tool.failed"),
						variant: "muted" as const,
					},
				},
				CANCELLED: {
					icon: <XCircleIcon className="size-5" />,
					badge: {
						text: t("tool.cancelled"),
						variant: "muted" as const,
					},
				},
				PAUSED: {
					icon: <CirclePause className="size-5" />,
					badge: {
						text: t("tool.paused"),
						variant: "muted" as const,
					},
				},
			} as const;

			return {
				...config[tool.status],
				iconClassName: "bg-muted text-muted-foreground",
				subtext: tool.json.description,
				canInteract: false,
				actionType: null,
				background: "bg-background" as const,
				showHoverAccent: false,
				showCancelInMenu: false,
			};
		}
		case "SUCCESS":
			return {
				icon: <CheckIcon className="size-5" />,
				iconClassName: "bg-primary/10 text-primary",
				subtext: tool.json.description,
				badge: null,
				canInteract: true,
				actionType: "menu" as const,
				background: "bg-sidebar" as const,
				showHoverAccent: false,
				showCancelInMenu: false,
			};
		case "LOADING":
			return {
				icon: <Spinner />,
				iconClassName: "bg-muted text-muted-foreground",
				subtext: toolExecutionMessage,
				badge: null,
				canInteract: false,
				actionType: "cancel" as const,
				background: "bg-background" as const,
				showHoverAccent: false,
				showCancelInMenu: false,
			};
		default:
			if (tool.json._meta.SMSS_MCP_EXECUTION === "ask") {
				return {
					icon: <HammerIcon className="size-5" />,
					iconClassName: "bg-primary/10 text-primary",
					subtext: tool.json.description,
					badge: null,
					canInteract: true,
					actionType: "menu" as const,
					background: "bg-background" as const,
					showHoverAccent: true,
					showCancelInMenu: true,
				};
			}
			// queued
			return {
				icon: <HammerIcon className="size-5" />,
				iconClassName: "bg-muted text-muted-foreground",
				subtext: t("tool.queued"),
				badge: null,
				canInteract: false,
				actionType: "cancel" as const,
				background: "bg-background" as const,
				showHoverAccent: false,
				showCancelInMenu: false,
			};
	}
};

interface ResponseMessageToolProps {
	/** Message to render */
	message: ResponseMessageStore;

	/** Tool to render */
	tool: ToolStore;

	/** Whether the tool is large */
	isLarge?: boolean;
}

export const ResponseMessageTool: React.FC<ResponseMessageToolProps> = observer(
	({ message, tool, isLarge }) => {
		const { t } = useTranslation("chat");
		const { room } = message;

		const { loadingMessage: toolExecutionMessage } = useLoadingMessage(
			tool.status === "LOADING",
			tool.json._meta.SMSS_MCP_UI?.loadingMessage
				? [tool.json._meta.SMSS_MCP_UI.loadingMessage]
				: [],
		);

		// TODO: if the plan is executing, only the execution step is enabled
		const isDisabled =
			room.mode === "executing" &&
			(room.plan?.step?.details.stepType !== "tool_call" ||
				room.plan?.step?.details.tool_name !== tool.json.name ||
				room.plan?.step?.details._meta.SMSS_PROJECT_ID !==
					tool.json._meta.SMSS_PROJECT_ID);

		const isActive =
			tool.isOpen &&
			(tool.display === "sidebar" ? room.sidebar.isOpen : true);

		const toolState = getToolState(tool, t, toolExecutionMessage);

		const isButtonDisabled = isDisabled || !toolState.canInteract;

		// Don't render if hidden
		if (tool.display === "hidden") {
			return null;
		}

		// askUser tools: show Q&A inline when answered, hide when still pending
		if (tool.json.original_name === "askUser") {
			if (tool.status !== "SUCCESS") {
				return null;
			}

			const args = (tool.json.arguments as Record<string, unknown>) ?? {};
			const questions = Array.isArray(args.questions)
				? args.questions
						.map((q) => {
							if (typeof q === "string") {
								return q.trim();
							}

							if (typeof q === "object" && q !== null) {
								const candidate = q as { question?: unknown };
								return typeof candidate.question === "string"
									? candidate.question.trim()
									: "";
							}

							return "";
						})
						.filter(Boolean)
				: [];
			const fallbackQuestion =
				typeof args.question === "string"
					? args.question
					: "Follow-up question";
			const questionText =
				questions.length > 0 ? questions.join("\n") : fallbackQuestion;
			const answer =
				(tool.parameters as Record<string, unknown>)?.user_response ??
				tool.response ??
				"";

			let answerText = String(answer);
			let hasStructuredQaPairs = false;
			try {
				const parsed = JSON.parse(answerText) as unknown;
				if (Array.isArray(parsed)) {
					const formatted = parsed
						.map((item, idx) => {
							if (
								typeof item === "object" &&
								item !== null &&
								"question" in item &&
								"answer" in item
							) {
								const qa = item as {
									question?: unknown;
									answer?: unknown;
								};
								const q = String(qa.question ?? "").trim();
								const a = String(qa.answer ?? "").trim();
								return `${idx + 1}. ${q}: ${a}`;
							}
							return "";
						})
						.filter(Boolean)
						.join("\n");

					if (formatted) {
						hasStructuredQaPairs = true;
						answerText = formatted;
					}
				}
			} catch {
				// Keep the raw answer for backward compatibility.
			}

			return (
				<div className="flex flex-col gap-1 rounded-lg border border-border bg-primary-foreground px-4 py-3">
					{!hasStructuredQaPairs && (
						<p className="whitespace-pre-wrap text-muted-foreground text-sm">
							{questionText}
						</p>
					)}
					<p className="whitespace-pre-wrap font-medium text-sm">
						{answerText}
					</p>
				</div>
			);
		}

		const handleCancel = (e: React.MouseEvent) => {
			e.stopPropagation();
			message.saveToolExecution(tool, "", "cancelled", {});
			tool.closeTool();
		};

		const handleClick = () => {
			if (tool.isOpen) {
				if (tool.display === "inline") {
					tool.closeTool();
				} else {
					tool.openTool("sidebar");
				}
			} else {
				tool.openTool();
			}
		};

		if (!isLarge) {
			return (
				<div
					className={cn(
						"flex flex-col rounded-lg border border-border bg-sidebar",
						isDisabled && "opacity-50",
						!isDisabled && isActive && "border-primary",
					)}
				>
					<div className="flex items-center">
						<button
							type="button"
							disabled={isButtonDisabled}
							className={cn(
								"flex min-w-0 flex-1 items-center gap-3 p-2 text-left",
								!toolState.actionType && "pr-0",
								isButtonDisabled && "cursor-default",
							)}
							onClick={handleClick}
						>
							<div className="flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground">
								{toolState.icon}
							</div>
							<div className="-ml-1.5 flex min-w-0 flex-1 items-center gap-2">
								<span
									className="truncate text-muted-foreground text-sm"
									title={tool.json.title}
								>
									{tool.json.title}
								</span>
								{tool.status === "LOADING" &&
									toolExecutionMessage && (
										<span className="shrink-0 text-muted-foreground text-sm italic">
											{toolExecutionMessage}
										</span>
									)}
								{tool.status === "INITIAL" &&
									toolState.subtext && (
										<span className="shrink-0 text-muted-foreground text-sm italic">
											{toolState.subtext}
										</span>
									)}
							</div>
						</button>

						{toolState.actionType === "cancel" && (
							<button
								type="button"
								className="flex shrink-0 cursor-pointer items-center self-stretch rounded-r-lg px-4.5 text-muted-foreground text-sm hover:bg-accent"
								onClick={handleCancel}
							>
								{t("tool.cancel")}
							</button>
						)}
						{toolState.badge && (
							<span
								className={cn(
									"shrink-0 pr-3 text-sm",
									toolState.badge.variant === "muted" &&
										"text-muted-foreground",
								)}
							>
								{toolState.badge.text}
							</span>
						)}
						{toolState.actionType === "menu" && (
							<ResponseMessageToolMenu
								message={message}
								tool={tool}
								isFullButton
								showCancelInMenu={toolState.showCancelInMenu}
							/>
						)}
					</div>

					{/* MCP UI Area */}
					{tool.isOpen && tool.display === "inline" && (
						<div className="p-2 pt-0">
							<RoomInlineTool
								room={room}
								message={message}
								tool={tool}
							/>
						</div>
					)}
				</div>
			);
		}

		return (
			<div
				className={cn(
					"flex flex-col rounded-lg border border-border",
					isDisabled && "opacity-50",
					toolState.background,
					!isDisabled && isActive && "border-primary",
					!isDisabled &&
						toolState.showHoverAccent &&
						"hover:bg-accent",
				)}
			>
				{/* Top section: button + actions */}
				<div className="flex items-center">
					<button
						type="button"
						disabled={isButtonDisabled}
						className={cn(
							"flex min-w-0 flex-1 items-center gap-3 p-2 text-left",
							!toolState.actionType && "pr-0",
							isButtonDisabled && "cursor-default",
						)}
						onClick={handleClick}
					>
						<div
							className={cn(
								"flex size-9 shrink-0 items-center justify-center rounded-sm",
								toolState.iconClassName,
							)}
						>
							{toolState.icon}
						</div>
						<div className="flex min-w-0 flex-1 flex-col">
							<span
								className="truncate font-medium text-foreground text-sm"
								title={tool.json.title}
							>
								{tool.json.title}
							</span>
							{toolState.subtext && (
								<span
									className="truncate text-muted-foreground text-sm"
									title={toolState.subtext}
								>
									{toolState.subtext}
								</span>
							)}
						</div>
					</button>

					{/* Right-side actions */}
					{toolState.actionType === "cancel" && (
						<Button
							type="button"
							size="sm"
							variant="secondary"
							className="mr-2 shrink-0"
							onClick={handleCancel}
						>
							{t("tool.cancel")}
						</Button>
					)}
					{toolState.badge && (
						<span
							className={cn(
								"shrink-0 pr-3 font-medium text-sm",
								toolState.badge.variant === "muted" &&
									"text-muted-foreground",
							)}
						>
							{toolState.badge.text}
						</span>
					)}
					{toolState.actionType === "menu" && (
						<ResponseMessageToolMenu
							message={message}
							tool={tool}
							showCancelInMenu={toolState.showCancelInMenu}
						/>
					)}
				</div>

				{/* MCP UI Area */}
				{tool.isOpen && tool.display === "inline" && (
					<div className="p-2 pt-0">
						<RoomInlineTool
							room={room}
							message={message}
							tool={tool}
						/>
					</div>
				)}
			</div>
		);
	},
);
