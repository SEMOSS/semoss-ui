import {
	CheckIcon,
	ChevronsLeftRightIcon,
	ChevronsRightLeftIcon,
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

		// Don't render if hidden
		if (tool.display === "hidden") {
			return null;
		}

		// Determine display variant
		type Variant =
			| "complete"
			| "ready"
			| "loading"
			| "error"
			| "queued"
			| "cancelled";
		let variant: Variant;
		if (tool.status === "ERROR") {
			variant = "error";
		} else if (tool.status === "CANCELLED") {
			variant = "cancelled";
		} else if (tool.status === "SUCCESS" || tool.response) {
			variant = "complete";
		} else if (tool.status === "LOADING") {
			variant = "loading";
		} else if (tool.json._meta.SMSS_MCP_EXECUTION === "ask") {
			variant = "ready";
		} else {
			variant = "queued";
		}

		// Subtext line beneath the tool title
		const subtext =
			variant === "loading"
				? toolExecutionMessage
				: variant === "queued"
					? t("tool.queued")
					: tool.json.description;

		// Icon
		let icon: React.ReactNode;
		if (variant === "loading") {
			icon = <Spinner />;
		} else if (variant === "complete") {
			icon = <CheckIcon className="size-5" />;
		} else if (variant === "cancelled") {
			icon = <XCircleIcon className="size-5" />;
		} else {
			icon = <HammerIcon className="size-5" />;
		}

		const isPrimaryIcon = variant === "complete" || variant === "ready";
		const isDimmed = variant === "error" || variant === "cancelled";

		// Error and cancelled tools are never interactive, independent of visual state
		const isButtonDisabled =
			isDisabled || variant === "error" || variant === "cancelled";

		return (
			<div
				className={cn(
					"flex flex-col rounded-lg border border-border",
					isDisabled && "opacity-50",
					variant === "complete" ? "bg-sidebar" : "bg-background",
					!isDisabled && isActive && "border-primary",
					!isDisabled && variant === "ready" && "hover:bg-accent",
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
							isButtonDisabled
								? "cursor-not-allowed"
								: "cursor-pointer",
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
								isPrimaryIcon
									? "bg-primary/10 text-primary"
									: "bg-muted text-muted-foreground",
								isDimmed && "opacity-50",
							)}
						>
							{icon}
						</div>
						<div
							className={cn(
								"flex min-w-0 flex-1 flex-col",
								isDimmed && "opacity-50",
							)}
						>
							<span
								className={cn(
									"truncate font-medium text-foreground text-sm",
									variant === "loading" &&
										"animate-text-shimmer",
								)}
								title={tool.json.title}
							>
								{tool.json.title}
							</span>
							{subtext && (
								<span
									className={cn(
										"truncate text-muted-foreground text-sm",
										variant === "loading" &&
											"animate-text-shimmer",
									)}
									title={subtext}
								>
									{subtext}
								</span>
							)}
						</div>
					</button>

					{/* Right-side actions */}
					{(variant === "loading" || variant === "queued") && (
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
					{variant === "error" && (
						<div className="flex shrink-0 items-center gap-2 rounded-md bg-destructive/10 px-3 py-1.5 font-medium text-destructive text-sm">
							<XCircleIcon className="size-4" />
							{t("tool.failed")}
						</div>
					)}
					{variant === "cancelled" && (
						<div className="flex shrink-0 items-center gap-2 rounded-md bg-muted px-3 py-1.5 font-medium text-muted-foreground text-sm">
							<XCircleIcon className="size-4" />
							{t("tool.cancelled")}
						</div>
					)}
					{(variant === "ready" || variant === "complete") && (
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
								{variant === "ready" && (
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
