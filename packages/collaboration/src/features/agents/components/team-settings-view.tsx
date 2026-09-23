import { Checkbox, Muted, Small } from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { FormSection } from "@/features/agents/components/form-section";
import type { Agent, AgentFieldUpdater } from "@/types/agent";

export function TeamSettingsView({
	agent,
	agents,
	shownAgent,
	onUpdate,
}: {
	agent: Agent;
	agents: Agent[];
	shownAgent: Agent;
	onUpdate: AgentFieldUpdater;
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
						<Small className="block font-medium">
							{agent.name || "Your agent"}
						</Small>
						<Muted className="text-xs">Lead agent</Muted>
					</span>
				</div>
				<div>
					{agents
						.filter((person) => person.id !== agent.id)
						.map((person) => (
							<label
								key={person.id}
								htmlFor={`subagent-${person.id}`}
								className="flex cursor-pointer items-center gap-3 border-b py-4"
							>
								<Checkbox
									id={`subagent-${person.id}`}
									checked={agent.members.includes(person.id)}
									onCheckedChange={(checked) =>
										onUpdate({
											key: "members",
											value:
												checked === true
													? [
															...agent.members,
															person.id,
														]
													: agent.members.filter(
															(id) =>
																id !==
																person.id,
														),
										})
									}
								/>
								<AgentAvatar agent={person} size="sm" />
								<span>
									<Small className="block font-medium">
										{person.name}
									</Small>
									{person.description && (
										<Muted className="block text-xs">
											{person.description}
										</Muted>
									)}
								</span>
							</label>
						))}
				</div>
			</FormSection>
		</div>
	);
}
