import { CheckIcon, ChevronDownIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import { Spinner } from "@semoss/ui/next";
import { cn } from "../lib/utils";

export type ToolCallStatus = "running" | "success" | "error";

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
 * response-message-tool-streaming.tsx/response-message-tool.tsx), and is
 * clickable to expand Parameters/Result, matching playground's real
 * generic tool view (tools-server-view.tsx) — not its fullscreen/sidebar/
 * custom-MCP-UI machinery, which is playground's own room-shell
 * integration, out of scope for a component library.
 */
export function ToolCallView({
	toolName,
	status = "running",
	arguments: toolArguments,
	output,
	className,
}: ToolCallViewProps) {
	const [isOpen, setIsOpen] = useState(false);
	const label = LABEL[status](toolName);

	return (
		<div
			data-slot="tool-call-view"
			data-status={status}
			className={cn(
				"mr-auto flex flex-col overflow-hidden rounded-lg border border-border bg-background text-sm",
				className,
			)}
		>
			<button
				type="button"
				onClick={() => setIsOpen((value) => !value)}
				aria-expanded={isOpen}
				className="flex items-center gap-2 px-3 py-2 text-start"
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
				<ChevronDownIcon
					className={cn(
						"ms-auto size-4 shrink-0 text-muted-foreground transition-transform",
						isOpen && "rotate-180",
					)}
				/>
			</button>
			{isOpen && (
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
