import { Plus, Settings2 } from "lucide-react";
import { Button } from "@semoss/ui/next";
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
	onConfigure,
	onNewRoom,
}: {
	agent: Agent;
	agentId: string;
	session: Session;
	onConfigure: (id: string) => void;
	onNewRoom: (agentId?: string) => void;
}) {
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
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label={`Configure ${agent.name}`}
					onClick={() => onConfigure(agentId)}
				>
					<Settings2 />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label={`New room with ${agent.name}`}
					onClick={() => onNewRoom(agentId)}
				>
					<Plus />
				</Button>
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
