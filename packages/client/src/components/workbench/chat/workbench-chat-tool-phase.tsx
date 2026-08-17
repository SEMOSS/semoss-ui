import {
	CheckCircle2Icon,
	ChevronRightIcon,
	CircleAlertIcon,
	Loader2Icon,
	OctagonXIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	Code,
	CodeContainer,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	Markdown,
} from "@semoss/ui/next";
import type { BuildTool } from "@/stores/workbench";
import { formatMs, formatToolArgs } from "./workbench-chat-format";
import {
	displayToolName,
	isCompleteStatus,
	isToolActive,
	isToolFailure,
	phaseTitle,
} from "./workbench-chat-tools";

interface StatusDotProps {
	/** Tool or phase status (e.g. "COMPLETED", "FAILED", "INPUT_REQUIRED") */
	status: string;

	/** Forces the spinner regardless of status while work is in flight */
	active?: boolean;
}

/**
 * Small status indicator shared by the phase header and tool rows: a spinner
 * while active, a success-colored check on completion, a destructive octagon
 * on failure/cancel, a primary alert icon when input is required, and a
 * neutral dot otherwise. Colors come from the design-system tokens.
 *
 * @name StatusDot
 * @param status - Tool or phase status string.
 * @param active - Forces the spinner while work is in flight.
 * @return The status icon for the given state.
 */
const StatusDot = ({ status, active }: StatusDotProps) => {
	if (active) {
		return (
			<Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
		);
	}
	if (isCompleteStatus(status)) {
		return <CheckCircle2Icon className="size-3.5 text-success" />;
	}
	if (["FAILED", "CANCELLED"].includes(status.toUpperCase())) {
		return <OctagonXIcon className="size-3.5 text-destructive" />;
	}
	if (status.toUpperCase() === "INPUT_REQUIRED") {
		return <CircleAlertIcon className="size-3.5 text-primary" />;
	}
	return <span className="size-2 rounded-full bg-muted-foreground" />;
};

interface ToolRowProps {
	/** The tool invocation to display */
	tool: BuildTool;
}

/**
 * One tool invocation row: status, name, argument summary, duration, and a
 * collapsible details section with the syntax-highlighted JSON input,
 * markdown output, and any error. Auto-opens when the tool fails or requires
 * input.
 *
 * @name ToolRow
 * @param tool - The tool invocation to display.
 * @return The collapsible tool row.
 */
const ToolRow = ({ tool }: ToolRowProps) => {
	const failure = isToolFailure(tool);
	const active = isToolActive(tool);
	const inputRequired = tool.status.toUpperCase() === "INPUT_REQUIRED";
	const hasDetails = Boolean(tool.arguments || tool.output || tool.error);
	const argsSummary = formatToolArgs(tool.arguments);
	const [open, setOpen] = useState(failure || inputRequired);

	useEffect(() => {
		if (failure || inputRequired) setOpen(true);
	}, [failure, inputRequired]);

	return (
		<Collapsible open={open && hasDetails} onOpenChange={setOpen}>
			<CollapsibleTrigger
				disabled={!hasDetails}
				className={cn(
					"flex w-full items-center gap-2 py-1 text-left text-xs",
					hasDetails && "cursor-pointer",
				)}
			>
				<span className="flex size-4 shrink-0 items-center justify-center">
					<StatusDot status={tool.status} active={active} />
				</span>
				<span className="shrink-0 font-medium">
					{displayToolName(tool)}
				</span>
				<span className="min-w-0 flex-1 truncate text-muted-foreground">
					{argsSummary}
				</span>
				{tool.durationMs != null && tool.durationMs >= 1000 ? (
					<span className="shrink-0 text-muted-foreground">
						{formatMs(tool.durationMs)}
					</span>
				) : null}
				{hasDetails ? (
					<ChevronRightIcon
						className={cn(
							"size-3.5 shrink-0 text-muted-foreground transition-transform",
							open && "rotate-90",
						)}
					/>
				) : null}
			</CollapsibleTrigger>
			{hasDetails ? (
				<CollapsibleContent>
					<div className="flex flex-col gap-2 py-1 pl-6">
						{tool.arguments ? (
							<div>
								<p className="mb-1 font-medium text-muted-foreground text-xs">
									Input
								</p>
								<CodeContainer className="max-h-64 overflow-x-auto overflow-y-auto rounded-md bg-muted p-2 font-mono">
									<Code
										code={JSON.stringify(
											tool.arguments,
											null,
											2,
										)}
										language="json"
										className="text-xs"
									/>
								</CodeContainer>
							</div>
						) : null}
						{tool.output ? (
							<div>
								<p className="mb-1 font-medium text-muted-foreground text-xs">
									Output
								</p>
								<div className="max-h-[360px] overflow-y-auto text-xs">
									<Markdown>{tool.output}</Markdown>
								</div>
							</div>
						) : null}
						{tool.error ? (
							<p className="text-destructive text-xs">
								{tool.error}
							</p>
						) : null}
					</div>
				</CollapsibleContent>
			) : null}
		</Collapsible>
	);
};

interface WorkbenchChatToolPhaseProps {
	/** The consecutive tool invocations grouped into this phase */
	tools: BuildTool[];
}

/**
 * Card grouping a consecutive run of tool calls into a titled phase
 * ("Exploring the workspace"). Auto-opens while any tool is active, failed,
 * or needs input; auto-collapses when the phase completes unless the user
 * toggled it manually. Expands to the individual tool rows.
 *
 * @name WorkbenchChatToolPhase
 * @param tools - The consecutive tool invocations grouped into this phase.
 * @return The collapsible tool-phase card.
 */
export const WorkbenchChatToolPhase = ({
	tools,
}: WorkbenchChatToolPhaseProps) => {
	const active = tools.some(isToolActive);
	const failure = tools.some(isToolFailure);
	const inputRequired = tools.some(
		(tool) => tool.status.toUpperCase() === "INPUT_REQUIRED",
	);
	const attention = failure || inputRequired;
	const [open, setOpen] = useState(active || attention);
	const userToggledRef = useRef(false);

	useEffect(() => {
		if (userToggledRef.current) return;
		setOpen(active || attention);
	}, [active, attention]);

	const status = failure
		? "FAILED"
		: inputRequired
			? "INPUT_REQUIRED"
			: active
				? "RUNNING"
				: "COMPLETED";

	return (
		<Collapsible
			open={open}
			onOpenChange={(next) => {
				userToggledRef.current = true;
				setOpen(next);
			}}
			className="rounded-lg border border-border bg-card"
		>
			<CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm">
				<StatusDot status={status} active={active} />
				<span className="min-w-0 truncate font-medium">
					{phaseTitle(tools)}
				</span>
				<span className="shrink-0 text-muted-foreground text-xs">
					{tools.length} {tools.length === 1 ? "tool" : "tools"}
				</span>
				<ChevronRightIcon
					className={cn(
						"ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform",
						open && "rotate-90",
					)}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="flex flex-col gap-1 border-border border-t px-3 py-2">
					{tools.map((tool) => (
						<ToolRow key={tool.id} tool={tool} />
					))}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
};
