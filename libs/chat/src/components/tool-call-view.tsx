import {
	CheckIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	MoreHorizontalIcon,
	PanelRightCloseIcon,
	XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@semoss/ui";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Spinner,
} from "@semoss/ui/next";

export type ToolCallStatus = "running" | "success" | "error";

/** Whether the tool row opens its result in a sidebar or expands it inline. */
type ViewMode = "sidebar" | "inline";

export interface ToolCallViewProps {
	toolName: string;
	/**
	 * Real state, not invented — derived by MessageBubble from whether a
	 * matching tool_result part exists yet (and its status). See
	 * docs/chat-components/PLAN.md.
	 */
	status?: ToolCallStatus;
	/**
	 * The call's arguments — always shown when expanded, matching
	 * playground's real generic tool view (tools-server-view.tsx), which
	 * always renders a Parameters panel regardless of status. While a call
	 * is still running, this is `{}` in our data model (arguments only
	 * arrive with the final structured result, never reconstructed from
	 * streamed deltas) — an honest reflection of current data, not a bug.
	 */
	arguments?: Record<string, unknown>;
	/**
	 * The matching tool_result's output — shown only once resolved
	 * (status !== "running"), matching playground's "Result only once
	 * SUCCESS" rule (generalized here to any resolved status, since an
	 * error result is just as worth showing as a success one).
	 */
	output?: string;
	/** Optional callback to open this tool in a sidebar details panel. */
	onOpenInSidebar?: () => void;
	className?: string;
}

const ICON_BADGE_CLASSNAME: Record<ToolCallStatus, string> = {
	running: "bg-muted text-muted-foreground",
	success: "bg-primary/10 text-primary",
	error: "bg-destructive/10 text-destructive",
};

const LABEL: Record<ToolCallStatus, (toolName: string) => string> = {
	running: (toolName) => `Running ${toolName}...`,
	success: (toolName) => `Ran ${toolName}`,
	error: (toolName) => `${toolName} failed`,
};

/**
 * Renders inline within a message (see MessageBubble) wherever a
 * tool_call part appears. Matches playground's tool-call card treatment
 * (border-border, rounded-lg, bg-background — see
 * response-message-tool-streaming.tsx/response-message-tool.tsx).
 *
 * When an `onOpenInSidebar` callback is provided the row defaults to
 * "sidebar" mode — clicking the row or the "Open in sidebar" menu item
 * fires the callback. The three-dot menu lets the user switch to "inline"
 * mode, which restores the expand/collapse behaviour. Without a sidebar
 * callback the component is always in inline mode.
 */
export function ToolCallView({
	toolName,
	status = "running",
	arguments: toolArguments,
	output,
	onOpenInSidebar,
	className,
}: ToolCallViewProps) {
	// When a sidebar callback exists, default to sidebar mode so clicking
	// the row opens the sidebar. Without a callback, always inline.
	const [viewMode, setViewMode] = useState<ViewMode>(() =>
		onOpenInSidebar ? "sidebar" : "inline",
	);
	const [isOpen, setIsOpen] = useState(false);
	const label = LABEL[status](toolName);

	const handleMainClick = () => {
		if (viewMode === "sidebar" && onOpenInSidebar) {
			onOpenInSidebar();
		} else {
			setIsOpen((v) => !v);
		}
	};

	return (
		<div
			data-slot="tool-call-view"
			data-status={status}
			className={cn(
				"flex w-full flex-col overflow-hidden rounded-lg border border-border bg-background text-sm",
				className,
			)}
		>
			<div className="flex items-center gap-1 pe-1">
				<button
					type="button"
					onClick={handleMainClick}
					aria-label={
						viewMode === "sidebar" && onOpenInSidebar
							? `Open ${toolName} in sidebar`
							: undefined
					}
					aria-expanded={viewMode === "inline" ? isOpen : undefined}
					className="flex flex-1 items-center gap-2 px-3 py-2 text-start"
				>
					<span
						className={cn(
							"flex size-6 shrink-0 items-center justify-center rounded-sm",
							ICON_BADGE_CLASSNAME[status],
						)}
					>
						{status === "running" ? (
							<Spinner className="size-3.5" />
						) : null}
						{status === "success" ? (
							<CheckIcon className="size-3.5" />
						) : null}
						{status === "error" ? (
							<XCircleIcon className="size-3.5" />
						) : null}
					</span>
					<output className="text-muted-foreground">{label}</output>
					{viewMode === "inline" ? (
						<ChevronDownIcon
							className={cn(
								"ms-auto size-4 shrink-0 text-muted-foreground transition-transform",
								isOpen && "rotate-180",
							)}
						/>
					) : (
						<PanelRightCloseIcon className="ms-auto size-4 shrink-0 text-muted-foreground" />
					)}
				</button>
				{onOpenInSidebar && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label={`${toolName} options`}
							>
								<MoreHorizontalIcon className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={onOpenInSidebar}>
								<PanelRightCloseIcon className="size-4" />
								Open in sidebar
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							{viewMode === "sidebar" ? (
								<DropdownMenuItem
									onClick={() => {
										setViewMode("inline");
										setIsOpen(true);
									}}
								>
									<ChevronDownIcon className="size-4" />
									View inline
								</DropdownMenuItem>
							) : (
								<>
									<DropdownMenuItem
										onClick={() => setIsOpen((v) => !v)}
									>
										{isOpen ? (
											<ChevronUpIcon className="size-4" />
										) : (
											<ChevronDownIcon className="size-4" />
										)}
										{isOpen ? "Collapse" : "Expand"}
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => {
											setViewMode("sidebar");
											setIsOpen(false);
										}}
									>
										<PanelRightCloseIcon className="size-4" />
										Back to sidebar view
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
			{viewMode === "inline" && isOpen && (
				<div className="flex flex-col gap-2 border-border border-t px-3 py-2">
					<div>
						<div className="mb-1 text-muted-foreground text-xs">
							Parameters
						</div>
						<pre className="overflow-x-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">
							{JSON.stringify(toolArguments ?? {}, null, 2)}
						</pre>
					</div>
					{output !== undefined && (
						<div>
							<div className="mb-1 text-muted-foreground text-xs">
								Result
							</div>
							<pre className="overflow-x-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">
								{output}
							</pre>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
