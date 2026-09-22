import { ChevronRight } from "lucide-react";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { SourceLabel } from "@/components/common/source-label";
import { StatusLabel } from "@/components/common/status-label";
import type { ActivityRow } from "../types/activity";
import { formatUpdatedAt } from "../utils/format-updated-at";

export function ActivityList({
	rows,
	onOpen,
}: {
	rows: readonly ActivityRow[];
	onOpen: (sessionId: string) => void;
}) {
	return (
		<div className="divide-y">
			{rows.map((row) => (
				<button
					key={row.session.id}
					type="button"
					onClick={() => onOpen(row.session.id)}
					className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-accent/50 sm:grid-cols-[auto_minmax(0,1fr)_minmax(10rem,auto)_auto_auto]"
				>
					<span className="flex items-center gap-2">
						{row.session.unread ? (
							<span className="block size-1.5 rounded-full bg-destructive" />
						) : (
							<span className="size-1.5" aria-hidden="true" />
						)}
						{row.agent && (
							<AgentAvatar agent={row.agent} size="sm" />
						)}
					</span>
					<span className="min-w-0">
						<span className="wrap-break-word block font-semibold text-sm group-hover:text-link">
							{row.session.title}
						</span>
						<span className="wrap-break-word mt-1 line-clamp-2 text-muted-foreground text-xs leading-5">
							{row.session.preview ||
								`Latest activity from ${row.agentName}`}
						</span>
					</span>
					<span className="col-start-2 row-start-2 flex min-w-0 flex-wrap items-center gap-2 sm:col-start-auto sm:row-start-auto sm:block">
						<StatusLabel status={row.session.status} />
						<span className="sm:mt-1 sm:block">
							<SourceLabel origin={row.session.origin} />
						</span>
					</span>
					<time
						dateTime={row.session.updatedAt}
						className="col-start-2 row-start-3 text-muted-foreground text-xs tabular-nums sm:col-start-auto sm:row-start-auto"
					>
						{formatUpdatedAt(row)}
					</time>
					<ChevronRight
						className="col-start-3 row-span-3 size-4 text-muted-foreground sm:col-start-auto sm:row-span-1"
						aria-hidden="true"
					/>
				</button>
			))}
		</div>
	);
}
