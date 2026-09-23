import { Plus } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@semoss/ui/next";
import { useMain } from "@/app/main.context";
import { EmptyView } from "@/components/common/empty-view";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { AgentOverviewCard } from "@/features/agents/components/agent-overview-card";
import { agentNewPath } from "@/lib/workspace-paths";

/** Displays the user's agents as an operational team directory. */
export function AgentsOverviewPage() {
	const { agents, sessions, newRoom } = useMain();

	return (
		<div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-muted/40">
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

				{agents.length > 0 ? (
					<section
						aria-label="Your agent team"
						className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3"
					>
						{agents.map((agent) => (
							<AgentOverviewCard
								key={agent.id}
								agent={agent}
								agents={agents}
								sessions={sessions}
								onNewSession={newRoom}
							/>
						))}
					</section>
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
							Create an agent to define its purpose, capabilities,
							and operating instructions.
						</EmptyView>
					</div>
				)}
			</PageContainer>
		</div>
	);
}
