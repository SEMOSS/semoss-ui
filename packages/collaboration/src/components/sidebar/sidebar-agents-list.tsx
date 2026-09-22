import { Pin, Plus, Search } from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router";
import {
	Button,
	cn,
	Input,
	Spinner,
	useInfiniteScroll,
	useSidebar,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";

const PAGE_SIZE = 20;

/** The sidebar's searchable, pinned-first, incrementally-loaded agent list. */
export function SidebarAgentsList({
	agents,
	sessions,
	agentId,
}: {
	agents: Agent[];
	sessions: Session[];
	agentId?: string;
}) {
	const [query, setQuery] = useState("");
	// Pin state is local-only: no reactor round-trips it yet (see room-header's
	// session pin, which has the same gap for rooms).
	const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
	const { setOpen, setOpenMobile } = useSidebar();

	const filtered = agents.filter((agent) =>
		agent.name
			.toLocaleLowerCase()
			.includes(query.trim().toLocaleLowerCase()),
	);
	const sorted = [...filtered].sort((a, b) => {
		const aPinned = pinnedIds.has(a.id) ? 1 : 0;
		const bPinned = pinnedIds.has(b.id) ? 1 : 0;
		return bPinned - aPinned;
	});
	const visibleAgents = sorted.slice(0, visibleCount);

	const showMoreAgents = useCallback(() => {
		setVisibleCount((count) => Math.min(count + PAGE_SIZE, sorted.length));
	}, [sorted.length]);

	const { setScroll } = useInfiniteScroll({
		disabled: visibleCount >= sorted.length,
		onNext: showMoreAgents,
	});

	function togglePinned(id: string) {
		setPinnedIds((previous) => {
			const next = new Set(previous);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}

	function handleAgentSelect() {
		setOpen(false);
		setOpenMobile(false);
	}

	return (
		<div className="mt-8 min-h-0 w-full">
			<div className="mb-3 flex items-center justify-between px-3">
				<span className="font-medium text-muted-foreground text-xs">
					Your agents
				</span>
				<Button
					aria-label="Create agent"
					variant="ghost"
					size="icon-sm"
					asChild
				>
					<Link to="/agents/new">
						<Plus />
					</Link>
				</Button>
			</div>
			<div className="relative mb-2 w-full">
				<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 size-3.5 text-muted-foreground" />
				<Input
					value={query}
					onChange={(event) => {
						setQuery(event.target.value);
						setVisibleCount(PAGE_SIZE);
					}}
					aria-label="Search agents"
					placeholder="Search agents"
					className="w-full pl-8"
				/>
			</div>
			<div
				ref={setScroll}
				data-slot="sidebar-agent-list"
				className="max-h-65 overflow-y-auto"
			>
				{visibleAgents.map((agent) => {
					const pinned = pinnedIds.has(agent.id);
					return (
						<div
							key={agent.id}
							className={cn(
								"flex h-13 w-full items-center gap-2.5 rounded-md px-2.5 transition-colors hover:bg-accent",
								agentId === agent.id && "bg-accent text-link",
							)}
						>
							<Link
								to={`/agents/${encodeURIComponent(agent.id)}`}
								onClick={handleAgentSelect}
								aria-current={
									agentId === agent.id ? "page" : undefined
								}
								className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
							>
								<AgentAvatar agent={agent} size="sm" />
								<span className="min-w-0 flex-1">
									<strong className="block truncate font-medium text-xs">
										{agent.name}
									</strong>
									<span className="block truncate text-muted-foreground text-xs">
										{agent.role}
									</span>
								</span>
								{sessions.some(
									(session) =>
										session.agentId === agent.id &&
										session.status === "In progress",
								) && (
									<Spinner
										className="size-3.5 shrink-0 text-chart-3 motion-reduce:animate-none"
										aria-label={`${agent.name} is working`}
									/>
								)}
								{sessions.filter(
									(session) =>
										session.agentId === agent.id &&
										session.unread,
								).length > 0 && (
									<span className="rounded-full bg-destructive/10 px-1.5 font-medium text-destructive text-xs leading-4">
										{
											sessions.filter(
												(session) =>
													session.agentId ===
														agent.id &&
													session.unread,
											).length
										}
									</span>
								)}
							</Link>
							<Button
								aria-label={
									pinned
										? `Unpin ${agent.name}`
										: `Pin ${agent.name}`
								}
								variant="ghost"
								size="icon-sm"
								className={
									pinned
										? "text-link"
										: "text-muted-foreground"
								}
								onClick={() => togglePinned(agent.id)}
							>
								<Pin className={cn(pinned && "fill-accent")} />
							</Button>
						</div>
					);
				})}
			</div>
		</div>
	);
}
