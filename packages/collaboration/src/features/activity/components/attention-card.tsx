import { ArrowRight } from "lucide-react";
import { Button } from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { SourceLabel } from "@/components/common/source-label";
import type { ActivityRow } from "../types/activity";

export function AttentionCard({
	row,
	onOpen,
}: {
	row: ActivityRow;
	onOpen: (sessionId: string) => void;
}) {
	return (
		<article className="flex min-h-56 flex-col rounded-lg border bg-card p-4 text-card-foreground">
			<div className="flex items-start justify-between gap-3">
				<div className="flex min-w-0 items-center gap-2.5">
					{row.agent && <AgentAvatar agent={row.agent} size="sm" />}
					<div className="min-w-0">
						<p className="truncate font-semibold text-sm">
							{row.agentName}
						</p>
						{row.agent?.description && (
							<p className="truncate text-muted-foreground text-xs">
								{row.agent.description}
							</p>
						)}
					</div>
				</div>
				<span className="shrink-0 rounded-sm bg-warning/10 px-2 py-1 font-medium text-warning text-xs">
					{row.session.status === "Your review"
						? "Your turn"
						: "New update"}
				</span>
			</div>
			<h3 className="wrap-break-word mt-5 font-semibold text-base leading-6">
				{row.session.title}
			</h3>
			<p className="wrap-break-word mt-2 line-clamp-3 text-muted-foreground text-sm leading-5">
				{row.session.preview ||
					"Open this session to review the latest update."}
			</p>
			<div className="mt-auto flex items-end justify-between gap-3 pt-5">
				<SourceLabel origin={row.session.origin} />
				<Button
					variant="secondary"
					size="sm"
					onClick={() => onOpen(row.session.id)}
				>
					{row.session.status === "Your review"
						? "Review"
						: "View update"}
					<ArrowRight aria-hidden="true" />
				</Button>
			</div>
		</article>
	);
}
