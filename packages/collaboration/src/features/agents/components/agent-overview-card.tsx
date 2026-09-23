import {
	ArrowRight,
	Plus,
	RefreshCw,
	Settings,
	Sparkles,
	Users,
} from "lucide-react";
import { useId } from "react";
import { Link } from "react-router";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	Card,
	CardContent,
	H4,
	P,
	Separator,
	Skeleton,
	Small,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { useAgentDetail } from "@/features/agents/api/use-agent-detail";
import { agentFromWorkspace } from "@/features/agents/utils/agent-from-workspace";
import { selectMostRecentRoom } from "@/features/rooms/utils/select-most-recent-room";
import { agentSettingsPath, sessionsPath } from "@/lib/workspace-paths";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";

interface AgentOverviewCardProps {
	agent: Agent;
	agents: Agent[];
	sessions: Session[];
	onNewSession: (agentId: string) => void;
}

/** Summarizes one agent's team, capabilities, and session activity. */
export function AgentOverviewCard({
	agent,
	agents,
	sessions,
	onNewSession,
}: AgentOverviewCardProps) {
	const headingId = useId();
	const detailQuery = useAgentDetail(agent.id);
	const shownAgent = detailQuery.agent
		? agentFromWorkspace(detailQuery.agent)
		: agent;
	const agentSessions = sessions.filter(
		(session) => session.agentId === agent.id,
	);
	const latestSession = selectMostRecentRoom(sessions, agent.id);
	const visibleSkills = shownAgent.skills.slice(0, 2);
	const hiddenSkillCount = Math.max(
		shownAgent.skills.length - visibleSkills.length,
		0,
	);
	const teamMembers = shownAgent.members
		.map((memberId) =>
			agents.find((candidate) => candidate.id === memberId),
		)
		.filter((candidate): candidate is Agent => candidate !== undefined);
	const visibleTeamMembers = teamMembers.slice(0, 4);
	const hiddenTeamMemberCount = Math.max(
		shownAgent.members.length - visibleTeamMembers.length,
		0,
	);
	const isTeamAgent = shownAgent.members.length > 0;
	const teamMemberLabel = teamMembers.length
		? `Team members: ${teamMembers.map((member) => member.name).join(", ")}`
		: `${shownAgent.members.length} subagents`;
	const triggerCount = detailQuery.agent?.config_json?.hooks?.length ?? 0;

	return (
		<article aria-labelledby={headingId} className="min-w-0">
			<Card
				className="h-full gap-0 rounded-xl shadow-sm"
				aria-busy={detailQuery.isLoading}
			>
				<CardContent className="flex h-full min-w-0 flex-col gap-5 px-6">
					<div className="flex items-start justify-between gap-4">
						<AgentAvatar
							agent={shownAgent}
							size="lg"
							shape="rounded"
						/>
						{detailQuery.isLoading ? (
							<Skeleton className="h-6 w-24" />
						) : (
							<Badge
								variant="secondary"
								className={
									isTeamAgent
										? "bg-primary/10 text-primary"
										: "text-muted-foreground"
								}
							>
								{isTeamAgent ? (
									<Users aria-hidden="true" />
								) : (
									<Sparkles aria-hidden="true" />
								)}
								{isTeamAgent ? "Team agent" : "Individual"}
							</Badge>
						)}
					</div>

					<div className="min-w-0">
						<H4
							id={headingId}
							className="flex min-w-0 flex-wrap items-baseline gap-1 text-lg"
						>
							<span>{shownAgent.name}</span>
							{shownAgent.description && (
								<span className="font-normal text-muted-foreground text-sm">
									/ {shownAgent.description}
								</span>
							)}
						</H4>
						{detailQuery.isLoading ? (
							<div className="mt-2 space-y-2">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-4/5" />
								<output className="sr-only">
									Loading {agent.name} details
								</output>
							</div>
						) : detailQuery.error ? (
							<Alert variant="destructive" className="mt-3">
								<RefreshCw aria-hidden="true" />
								<AlertTitle>Details unavailable</AlertTitle>
								<AlertDescription>
									<P className="text-sm">
										{detailQuery.error.message}
									</P>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={detailQuery.refresh}
									>
										Try again
									</Button>
								</AlertDescription>
							</Alert>
						) : (
							<P className="mt-1 line-clamp-2 min-h-10 text-muted-foreground text-sm">
								{shownAgent.instructions ||
									"No operating instructions yet."}
							</P>
						)}
					</div>

					{detailQuery.isLoading ? (
						<div className="mt-auto space-y-4">
							<Skeleton className="h-6 w-32" />
							<Skeleton className="h-4 w-16" />
							<div className="flex gap-2">
								<Skeleton className="h-6 w-28" />
								<Skeleton className="h-6 w-24" />
							</div>
							<Skeleton className="h-4 w-56" />
						</div>
					) : detailQuery.error ? (
						<div className="mt-auto" />
					) : (
						<div className="mt-auto space-y-4">
							<div className="flex min-h-6 items-center justify-between gap-3">
								{latestSession ? (
									<Badge
										variant="secondary"
										className="max-w-48 bg-primary/10 text-primary"
									>
										<span className="truncate">
											{latestSession.title}
										</span>
									</Badge>
								) : (
									<span />
								)}
								{isTeamAgent && (
									<div
										role="img"
										aria-label={teamMemberLabel}
										className="-space-x-2 flex shrink-0"
									>
										{visibleTeamMembers.map((member) => (
											<span
												key={member.id}
												className="rounded-lg ring-2 ring-card"
											>
												<AgentAvatar
													agent={member}
													size="xs"
													shape="rounded"
												/>
											</span>
										))}
										{hiddenTeamMemberCount > 0 && (
											<span className="flex size-6 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs ring-2 ring-card">
												+{hiddenTeamMemberCount}
											</span>
										)}
									</div>
								)}
							</div>

							<div className="space-y-2">
								<Small className="text-muted-foreground text-xs uppercase tracking-widest">
									Skills
								</Small>
								<div className="flex min-h-6 flex-wrap gap-2">
									{visibleSkills.length > 0 ? (
										<>
											{visibleSkills.map((skill) => (
												<Badge
													key={skill.id}
													variant="secondary"
													className="max-w-48 bg-primary/10 text-primary"
												>
													<Sparkles aria-hidden="true" />
													<span className="truncate">
														{skill.name}
													</span>
												</Badge>
											))}
											{hiddenSkillCount > 0 && (
												<Badge variant="outline">
													+{hiddenSkillCount}
												</Badge>
											)}
										</>
									) : (
										<span className="text-muted-foreground text-xs">
											No skills assigned
										</span>
									)}
								</div>
							</div>

							<div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
								<span>{shownAgent.mcp.length} tools</span>
								<span>{shownAgent.skills.length} skills</span>
								<span>{triggerCount} triggers</span>
								<span>{agentSessions.length} rooms</span>
							</div>
						</div>
					)}

					<Separator />
					<div className="grid gap-2 sm:grid-cols-2">
						<Button asChild variant="outline" className="min-h-11">
							<Link to={agentSettingsPath(agent.id)}>
								<Settings aria-hidden="true" />
								Configure
							</Link>
						</Button>
						<Button
							type="button"
							variant="secondary"
							className="min-h-11 bg-primary/10 text-primary hover:bg-primary/20"
							onClick={() => onNewSession(agent.id)}
						>
							<Plus aria-hidden="true" />
							Session
						</Button>
					</div>
					<Button asChild variant="ghost" className="min-h-11">
						<Link to={sessionsPath(agent.id)}>
							View sessions
							<ArrowRight aria-hidden="true" />
						</Link>
					</Button>
				</CardContent>
			</Card>
		</article>
	);
}
