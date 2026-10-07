import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { type ReactNode, useContext } from "react";
import { createPortal } from "react-dom";
import {
	Button,
	H1,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import { CollaborationHeaderContext } from "@/features/collaboration/components/collaboration-header.context";

interface RoomHeaderProps {
	/** The agent assigned to this conversation. */
	agent: AgentConfiguration;
	/** The conversation title, available in full from its details popover. */
	title: string;
	isToolWorkbenchOpen: boolean;
	showToolWorkbench?: boolean;
	/** Stable focus destination for an automatically opened room workbench. */
	workbenchTriggerId?: string;
	onToggleToolWorkbench: () => void;
	/** Contextual thread actions retain their owning workflows. */
	actions?: ReactNode;
}

/** Compose room identity and actions into the shell without moving their state. */
export function RoomHeader({
	agent,
	title,
	isToolWorkbenchOpen,
	showToolWorkbench = true,
	workbenchTriggerId,
	onToggleToolWorkbench,
	actions,
}: RoomHeaderProps) {
	const headerControls = useContext(CollaborationHeaderContext);
	const conversationTitle = title.trim() || "Untitled conversation";
	const toolWorkbenchLabel = isToolWorkbenchOpen
		? "Close workbench"
		: "Open workbench";
	const controls = (
		<>
			<Popover>
				<H1 className="min-w-0 flex-1 font-medium text-sm">
					<PopoverTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							className="h-11 w-full min-w-0 justify-start gap-2 px-1 text-left font-normal"
							aria-label={`Conversation details: ${conversationTitle}`}
						>
							<AgentAvatar agent={agent} size="xs" />
							<span className="truncate font-medium text-sm">
								{conversationTitle}
							</span>
						</Button>
					</PopoverTrigger>
				</H1>
				<PopoverContent
					align="start"
					aria-label="Conversation details"
					className="space-y-2 motion-reduce:animate-none"
				>
					<P className="break-words font-medium text-sm">
						{conversationTitle}
					</P>
					<P className="break-words text-muted-foreground text-sm">
						{agent.name} · AI agent
					</P>
				</PopoverContent>
			</Popover>
			<div className="flex shrink-0 items-center gap-1">
				{actions}
				{showToolWorkbench && (
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								id={workbenchTriggerId}
								type="button"
								variant="ghost"
								size="icon-sm"
								className="pointer-coarse:size-11 shrink-0 text-muted-foreground"
								aria-label={toolWorkbenchLabel}
								aria-expanded={isToolWorkbenchOpen}
								onClick={onToggleToolWorkbench}
							>
								{isToolWorkbenchOpen ? (
									<PanelRightClose aria-hidden="true" />
								) : (
									<PanelRightOpen aria-hidden="true" />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent>{toolWorkbenchLabel}</TooltipContent>
					</Tooltip>
				)}
			</div>
		</>
	);
	if (headerControls) return createPortal(controls, headerControls);
	if (headerControls === null) return null;
	return (
		<header className="flex h-14 shrink-0 items-center gap-2 @sm/conversation:px-4 px-3">
			{controls}
		</header>
	);
}
