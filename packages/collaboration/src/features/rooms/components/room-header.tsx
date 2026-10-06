import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { type ReactNode, useContext } from "react";
import {
	Button,
	H2,
	P,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import { CollaborationNavigationControlContext } from "@/features/collaboration/components/collaboration-navigation-control.context";

/** The active session's title bar, actions, and source/status row. */
export function RoomHeader({
	agent,
	title,
	isToolWorkbenchOpen,
	showToolWorkbench = true,
	onToggleToolWorkbench,
	actions,
	showNavigationControl = true,
}: {
	agent: AgentConfiguration;
	title: string;
	isToolWorkbenchOpen: boolean;
	showToolWorkbench?: boolean;
	onToggleToolWorkbench: () => void;
	/** Contextual thread actions; agent editing belongs in agent settings. */
	actions?: ReactNode;
	/** Only the visible conversation header hosts the workspace navigation action. */
	showNavigationControl?: boolean;
}) {
	const navigationControl = useContext(CollaborationNavigationControlContext);
	const toolWorkbenchLabel = isToolWorkbenchOpen
		? "Close workbench"
		: "Open workbench";

	return (
		<header className="flex min-h-17 shrink-0 items-center gap-3 border-b px-4 py-3 lg:px-5">
			{showNavigationControl && navigationControl}
			<AgentAvatar agent={agent} size="sm" />
			<div className="min-w-0 flex-1">
				<H2 className="truncate font-medium text-sm">
					{agent.name}
					<span className="ml-2 font-normal text-muted-foreground text-xs">
						AI agent
					</span>
				</H2>
				<P
					className="mt-0.5 truncate text-muted-foreground text-xs"
					title={title}
				>
					{title}
				</P>
			</div>
			{actions}

			{showToolWorkbench && (
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
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
		</header>
	);
}
