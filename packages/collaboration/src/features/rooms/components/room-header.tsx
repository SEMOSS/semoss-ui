import { PanelRightClose, PanelRightOpen, Settings2 } from "lucide-react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { SourceLabel } from "@/components/common/source-label";
import { StatusLabel } from "@/components/common/status-label";
import { RuntimeAgentAvatar } from "@/features/agents/components/runtime-agent-avatar";
import type { Agent } from "@/features/agents/types/agent";
import type { Session } from "@/types/session";

/** The active session's title bar, actions, and source/status row. */
export function RoomHeader({
	agent,
	agentId,
	session,
	isToolWorkbenchOpen,
	showToolWorkbench = true,
	onToggleToolWorkbench,
	onConfigure,
}: {
	agent: Agent;
	agentId: string;
	session: Session;
	isToolWorkbenchOpen: boolean;
	showToolWorkbench?: boolean;
	onToggleToolWorkbench: () => void;
	onConfigure: (id: string) => void;
}) {
	const toolWorkbenchLabel = isToolWorkbenchOpen
		? "Close workbench"
		: "Open workbench";

	return (
		<>
			<header className="flex min-h-17 shrink-0 items-center gap-3 border-b px-4 py-3 lg:px-5">
				<RuntimeAgentAvatar agent={agent} size="sm" />
				<div className="min-w-0 flex-1">
					<h2 className="truncate font-semibold text-sm">
						{agent.name}
						<span className="ml-2 font-normal text-muted-foreground text-xs">
							AI agent
						</span>
					</h2>
					<p className="mt-0.5 truncate text-muted-foreground text-xs">
						{session.title}
					</p>
				</div>

				<Tooltip>
					<TooltipTrigger>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={`Configure ${agent.name}`}
							onClick={() => onConfigure(agentId)}
						>
							<Settings2 />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{" "}
						{`Configure ${agent.name}`}{" "}
					</TooltipContent>
				</Tooltip>

				{showToolWorkbench && (
					<Tooltip>
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
			<div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-5 py-2.5">
				<span
					className="flex items-center gap-2 text-xs"
					aria-live="polite"
				>
					<SourceLabel origin={session.origin} />
					<span className="text-muted-foreground">·</span>
					<StatusLabel status={session.status} />
				</span>
			</div>
		</>
	);
}
