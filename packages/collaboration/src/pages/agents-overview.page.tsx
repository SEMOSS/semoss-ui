import { ArrowRight, Plus } from "lucide-react";
import { Link } from "react-router";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	useSidebar,
} from "@semoss/ui/next";
import { useMain } from "@/app/main.context";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { EmptyView } from "@/components/common/empty-view";
import { agentNewPath, agentPath } from "@/lib/workspace-paths";

export function AgentsOverviewPage() {
	const { agents, sessions } = useMain();
	const { isMobile, setOpenMobile } = useSidebar();

	function handleAgentSelect() {
		if (isMobile) setOpenMobile(false);
	}

	return (
		<div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background">
			<header>
				<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-6 lg:px-8">
					<div className="min-w-0">
						<h1 className="font-semibold text-2xl leading-8">
							Agents
						</h1>
						<p className="mt-1 text-muted-foreground text-sm">
							Review responsibilities, capabilities, and current
							activity.
						</p>
					</div>
					<Button asChild>
						<Link to={agentNewPath()}>
							<Plus aria-hidden="true" />
							Add agent
						</Link>
					</Button>
				</div>
			</header>

			<div className="mx-auto max-w-6xl px-5 py-7 lg:px-8">
				{agents.length ? (
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						{agents.map((agent) => {
							const agentSessions = sessions.filter(
								(session) => session.agentId === agent.id,
							);
							const activeCount = agentSessions.filter(
								(session) => session.status === "In progress",
							).length;
							const reviewCount = agentSessions.filter(
								(session) => session.status === "Your review",
							).length;

							return (
								<Link
									key={agent.id}
									to={agentPath(agent.id)}
									onClick={handleAgentSelect}
									aria-label={`Open ${agent.name}`}
									className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								>
									<Card className="h-full transition-colors hover:bg-accent/40">
										<CardHeader className="grid-cols-[auto_1fr_auto] items-center gap-x-3">
											<AgentAvatar
												agent={agent}
												size="md"
											/>
											<div className="min-w-0">
												<CardTitle className="truncate">
													{agent.name}
												</CardTitle>
												<p className="truncate text-muted-foreground text-sm">
													{agent.role}
												</p>
											</div>
											<ArrowRight
												className="size-4 text-muted-foreground"
												aria-hidden="true"
											/>
										</CardHeader>
										<CardContent className="flex flex-1 flex-col gap-4">
											<div className="flex flex-wrap gap-1.5">
												<Badge variant="secondary">
													{agent.type}
												</Badge>
												<Badge variant="outline">
													{agent.workspace}
												</Badge>
											</div>
											<p className="line-clamp-3 text-muted-foreground text-sm leading-5">
												{agent.instructions}
											</p>
											{agent.skills.length > 0 && (
												<p className="text-muted-foreground text-xs">
													<span className="font-medium text-foreground">
														Skills:
													</span>{" "}
													{agent.skills.join(", ")}
												</p>
											)}
											<div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-muted-foreground text-xs">
												<span>
													{agentSessions.length}{" "}
													{agentSessions.length === 1
														? "session"
														: "sessions"}
												</span>
												<span>
													{activeCount} working
												</span>
												<span>
													{reviewCount}{" "}
													{reviewCount === 1
														? "needs"
														: "need"}{" "}
													review
												</span>
											</div>
										</CardContent>
									</Card>
								</Link>
							);
						})}
					</div>
				) : (
					<EmptyView
						title="No agents yet"
						action={
							<Button>
								<Link to={agentNewPath()}>
									<Plus aria-hidden="true" />
									Add agent
								</Link>
							</Button>
						}
					>
						Add an agent to define its role, capabilities, and
						workspace.
					</EmptyView>
				)}
			</div>
		</div>
	);
}
