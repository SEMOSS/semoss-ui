import { Plus, Search } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { Link } from "react-router";
import {
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Spinner,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { useMain } from "@/app/main.context";
import { EmptyView } from "@/components/common/empty-view";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { agentListKey } from "@/features/agents/api/refresh-keys";
import { useAgentDirectory } from "@/features/agents/api/use-agent-directory";
import { AgentOverviewCard } from "@/features/agents/components/agent-overview-card";
import { agentNewPath } from "@/lib/workspace-paths";

/** Displays the user's agents as an operational team directory. */
export function AgentsOverviewPage() {
	const { agents: workspaceAgents, keys, sessions, newRoom } = useMain();
	const searchId = useId();
	const searchRef = useRef<HTMLInputElement>(null);
	const [search, setSearch] = useState("");
	const searchTerm = useDebouncedValue(search).trim();
	const directory = useAgentDirectory(searchTerm, keys[agentListKey] ?? 0);
	const hasAgents = directory.agents.length > 0;
	const isLoadingMore =
		directory.isLoading && !directory.isRefreshing && hasAgents;
	const cardAgents =
		workspaceAgents.length > 0 ? workspaceAgents : directory.agents;
	const handleLoadMore = useCallback(() => {
		if (!directory.isLoading && directory.hasMore) directory.next();
	}, [directory.hasMore, directory.isLoading, directory.next]);
	const { setScroll } = useInfiniteScroll({
		disabled:
			directory.isLoading || directory.isRefreshing || !directory.hasMore,
		triggerOnMount: false,
		onNext: handleLoadMore,
	});

	function handleClearSearch(): void {
		setSearch("");
		queueMicrotask(() => searchRef.current?.focus());
	}

	return (
		<div
			ref={setScroll}
			className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-muted/40"
		>
			<PageContainer className="flex flex-col gap-6">
				<PageHeader
					eyebrow="Good people. Exceptional capabilities."
					title="Meet your team."
					description="Give each agent a purpose, the right resources, and room to do good work."
					action={
						<Button asChild size="sm">
							<Link to={agentNewPath()}>
								<Plus aria-hidden="true" />
								Create agent
							</Link>
						</Button>
					}
				/>

				<div className="w-full sm:max-w-sm">
					<label htmlFor={searchId} className="sr-only">
						Search agents
					</label>
					<InputGroup>
						<InputGroupAddon>
							<Search aria-hidden="true" />
						</InputGroupAddon>
						<InputGroupInput
							ref={searchRef}
							id={searchId}
							type="search"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search agents by name or ID"
							autoComplete="off"
						/>
					</InputGroup>
				</div>

				<output
					className="text-muted-foreground text-sm"
					aria-live="polite"
				>
					{directory.error && directory.isRefreshing
						? "Could not load agents"
						: directory.isRefreshing
							? "Loading agents"
							: `${directory.agents.length} ${directory.agents.length === 1 ? "agent" : "agents"} shown`}
				</output>

				<section
					aria-label="Your agent team"
					aria-busy={directory.isLoading || directory.isRefreshing}
				>
					{directory.error &&
					(directory.isRefreshing || !hasAgents) ? (
						<div className="min-h-48 rounded-xl border bg-card shadow-sm">
							<EmptyView
								title="Could not load agents"
								action={
									<Button
										type="button"
										variant="outline"
										onClick={directory.reset}
									>
										Try again
									</Button>
								}
							>
								{directory.error.message}
							</EmptyView>
						</div>
					) : directory.isRefreshing ? (
						<div className="flex min-h-48 items-center justify-center rounded-xl border bg-card p-6 shadow-sm">
							<Spinner aria-hidden="true" />
						</div>
					) : hasAgents ? (
						<div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
							{directory.agents.map((agent) => (
								<AgentOverviewCard
									key={agent.id}
									agent={agent}
									agents={cardAgents}
									sessions={sessions}
									onNewSession={newRoom}
								/>
							))}
						</div>
					) : searchTerm ? (
						<div className="min-h-48 rounded-xl border bg-card shadow-sm">
							<EmptyView
								title="No matching agents"
								action={
									<Button
										type="button"
										variant="outline"
										onClick={handleClearSearch}
									>
										Clear search
									</Button>
								}
							>
								Try another name or ID.
							</EmptyView>
						</div>
					) : (
						<div className="min-h-72 rounded-xl border bg-card shadow-sm">
							<EmptyView
								title="No agents yet"
								action={
									<Button asChild className="min-h-11">
										<Link to={agentNewPath()}>
											<Plus aria-hidden="true" />
											Create agent
										</Link>
									</Button>
								}
							>
								Create an agent to define its purpose,
								capabilities, and operating instructions.
							</EmptyView>
						</div>
					)}

					{hasAgents && directory.error ? (
						<div
							role="alert"
							className="mt-4 flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-sm sm:flex-row sm:justify-center"
						>
							<span>Could not load more agents.</span>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={directory.reset}
							>
								Try again
							</Button>
						</div>
					) : isLoadingMore ? (
						<output className="mt-4 flex items-center justify-center gap-2 p-4 text-muted-foreground text-sm">
							<Spinner aria-hidden="true" />
							Loading more agents
						</output>
					) : directory.hasMore ? (
						<div className="mt-4 flex justify-center p-4">
							<Button
								type="button"
								variant="outline"
								onClick={handleLoadMore}
							>
								Load more agents
							</Button>
						</div>
					) : null}
				</section>
			</PageContainer>
		</div>
	);
}
