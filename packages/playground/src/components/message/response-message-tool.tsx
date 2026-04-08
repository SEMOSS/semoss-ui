import {
	CheckIcon,
	ChevronsLeftRightIcon,
	ChevronsRightLeftIcon,
	CirclePause,
	HammerIcon,
	MoreHorizontalIcon,
	PanelRightCloseIcon,
	PanelRightOpenIcon,
	TvMinimalIcon,
	XCircleIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Spinner,
} from "@semoss/ui/next";
import { useLoadingMessage } from "@/hooks";
import type { ResponseMessageStore, ToolStore } from "@/stores";
import { RoomInlineTool } from "../room";

interface ResponseMessageToolProps {
	/** Message to render */
	message: ResponseMessageStore;

	/** Tool to render */
	tool: ToolStore;

	/** Whether the tool is large when closed */
	isLarge?: boolean;
}

export const ResponseMessageTool: React.FC<ResponseMessageToolProps> = observer(
	({ message, tool }) => {
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

		// Determine tool state and derive all display properties from it
		const toolState = (() => {
			switch (tool.status) {
				case "ERROR":
					return {
						icon: <HammerIcon className="size-5" />,
						iconClassName:
							"bg-muted text-muted-foreground opacity-50",
						subtext: tool.json.description,
						badge: {
							text: t("tool.failed"),
							icon: <XCircleIcon className="size-4" />,
							variant: "destructive" as const,
						},
						canInteract: false,
						actionType: null,
						background: "bg-background" as const,
						showHoverAccent: false,
						showCancelInMenu: false,
					};
				case "CANCELLED":
					return {
						icon: <XCircleIcon className="size-5" />,
						iconClassName:
							"bg-muted text-muted-foreground opacity-50",
						subtext: tool.json.description,
						badge: {
							text: t("tool.cancelled"),
							icon: <XCircleIcon className="size-4" />,
							variant: "muted" as const,
						},
						canInteract: false,
						actionType: null,
						background: "bg-background" as const,
						showHoverAccent: false,
						showCancelInMenu: false,
					};
				case "PAUSED":
					return {
						icon: <CirclePause className="size-5" />,
						iconClassName:
							"bg-muted text-muted-foreground opacity-50",
						subtext: tool.json.description,
						badge: {
							text: t("tool.paused"),
							icon: <CirclePause className="size-4" />,
							variant: "muted" as const,
						},
						canInteract: false,
						actionType: null,
						background: "bg-background" as const,
						showHoverAccent: false,
						showCancelInMenu: false,
					};
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
					} else {
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
			}
		})();

		const isButtonDisabled = isDisabled || !toolState.canInteract;

		// Don't render if hidden
		if (tool.display === "hidden") {
			return null;
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
				<div className="flex items-center gap-3 pr-2">
					{/* Clickable section: icon + text */}
					<button
						type="button"
						disabled={isButtonDisabled}
						className={cn(
							"flex min-w-0 flex-1 items-center gap-3 p-2 pr-0 text-left",
							isButtonDisabled && "cursor-default",
						)}
						onClick={() => {
							if (tool.isOpen) {
								if (tool.display === "inline") {
									// Clicks when inline should close
									tool.closeTool();
								} else {
									// if it's open in the sidebar, we want to move it to the front
									tool.openTool("sidebar");
								}
							} else {
								tool.openTool();
							}
						}}
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
							className="shrink-0"
							onClick={(e) => {
								e.stopPropagation();
								message.saveToolExecution(
									tool,
									"",
									"cancelled",
									{},
								);
								tool.closeTool();
							}}
						>
							{t("tool.cancel")}
						</Button>
					)}
					{toolState.badge && (
						<div
							className={cn(
								"flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 font-medium text-sm",
								toolState.badge.variant === "destructive" &&
									"bg-destructive/10 text-destructive",
								toolState.badge.variant === "muted" &&
									"bg-muted text-muted-foreground",
							)}
						>
							{toolState.badge.icon}
							{toolState.badge.text}
						</div>
					)}
					{toolState.actionType === "menu" && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									type="button"
									size="icon"
									variant="ghost"
									className="shrink-0"
									onClick={(e) => e.stopPropagation()}
								>
									<MoreHorizontalIcon className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() => {
										if (
											tool.isOpen &&
											tool.display === "inline"
										) {
											tool.closeTool();
										} else {
											tool.openTool("inline");
										}
									}}
								>
									{tool.isOpen &&
									tool.display === "inline" ? (
										<ChevronsRightLeftIcon />
									) : (
										<ChevronsLeftRightIcon />
									)}
									{tool.isOpen && tool.display === "inline"
										? t("tool.collapse")
										: t("tool.openInline")}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										tool.openTool("inline");
										tool.setIsExpanded(true);
									}}
								>
									<TvMinimalIcon />
									{t("tool.expand")}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										if (
											tool.isOpen &&
											tool.display === "sidebar"
										) {
											tool.closeTool();
										} else {
											tool.openTool("sidebar");
										}
									}}
								>
									{tool.isOpen &&
									tool.display === "sidebar" ? (
										<PanelRightOpenIcon />
									) : (
										<PanelRightCloseIcon />
									)}
									{tool.isOpen && tool.display === "sidebar"
										? t("tool.closeInSidebar")
										: t("tool.openInSidebar")}
								</DropdownMenuItem>
								{toolState.showCancelInMenu && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											variant="destructive"
											onClick={() => {
												message.saveToolExecution(
													tool,
													"",
													"cancelled",
													{},
												);
												tool.closeTool();
											}}
										>
											<XCircleIcon />
											{t("tool.cancel")}
										</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
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
