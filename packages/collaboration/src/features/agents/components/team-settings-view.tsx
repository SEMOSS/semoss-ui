import { AgentAvatar } from "@/components/common/agent-avatar";
import { FormSection } from "@/features/agents/components/form-section";
import type { Agent } from "@/types/agent";

type UpdateAgent = <Key extends keyof Agent>(
	key: Key,
	value: Agent[Key],
) => void;
export function TeamSettingsView({
	agent,
	agents,
	shownAgent,
	onUpdate,
}: {
	agent: Agent;
	agents: Agent[];
	shownAgent: Agent;
	onUpdate: UpdateAgent;
}) {
	return (
		<div className="space-y-7">
			<FormSection
				title={`${agent.name || "Your agent"}'s subagents`}
				description="Optional specialists this agent can delegate to."
			>
				<div className="mb-5 flex items-center gap-3 border-b pb-5">
					<AgentAvatar agent={shownAgent} />
					<span>
						<strong className="block font-medium text-sm">
							{agent.name || "Your agent"}
						</strong>
						<span className="text-muted-foreground text-xs">
							Lead agent
						</span>
					</span>
				</div>
				<div>
					{agents
						.filter((person) => person.id !== agent.id)
						.map((person) => (
							<label
								key={person.id}
								className="flex cursor-pointer items-center gap-3 border-b py-4"
							>
								<input
									className="size-4 accent-primary"
									type="checkbox"
									checked={agent.members.includes(person.id)}
									onChange={(event) =>
										onUpdate(
											"members",
											event.target.checked
												? [...agent.members, person.id]
												: agent.members.filter(
														(id) =>
															id !== person.id,
													),
										)
									}
								/>
								<AgentAvatar agent={person} size="sm" />
								<span>
									<strong className="block font-medium text-sm">
										{person.name}
									</strong>
									<span className="block text-muted-foreground text-xs">
										{person.role}
									</span>
								</span>
							</label>
						))}
				</div>
			</FormSection>
		</div>
	);
}
