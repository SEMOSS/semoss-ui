import { useId } from "react";
import { Input, Switch } from "@semoss/ui/next";
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
	const depthId = useId();
	const concurrencyId = useId();
	const spawnId = useId();
	return (
		<div className="space-y-7">
			<FormSection
				title={`${agent.name || "Your agent"}'s team`}
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
			<FormSection title="Delegation limits">
				<div className="grid gap-5 sm:grid-cols-2">
					<div className="space-y-2">
						<label
							htmlFor={depthId}
							className="font-medium text-sm"
						>
							Maximum spawn level
						</label>
						<Input
							id={depthId}
							type="number"
							min={0}
							value={agent.depth}
							onChange={(event) => {
								const depth = Math.max(
									0,
									Math.floor(Number(event.target.value)),
								);
								onUpdate("depth", depth);
								onUpdate("spawn", depth > 1);
							}}
						/>
						<p className="text-muted-foreground text-xs">
							0 disables delegation. 1 allows only the lead to
							delegate.
						</p>
					</div>
					<div className="space-y-2">
						<label
							htmlFor={concurrencyId}
							className="font-medium text-sm"
						>
							Maximum helpers per run
						</label>
						<Input
							id={concurrencyId}
							type="number"
							min={0}
							value={agent.concurrency}
							onChange={(event) =>
								onUpdate(
									"concurrency",
									Math.max(
										0,
										Math.floor(Number(event.target.value)),
									),
								)
							}
						/>
						<p className="text-muted-foreground text-xs">
							Total helpers across the run, including nested
							helpers.
						</p>
					</div>
				</div>
				<label
					htmlFor={spawnId}
					className="mt-6 flex items-center justify-between gap-4"
				>
					<span>
						<strong className="block font-medium text-sm">
							Allow helpers to spawn subagents
						</strong>
						<span className="mt-1 block text-muted-foreground text-xs">
							Enables a spawn level of at least 2. Turning this
							off caps the level at 1.
						</span>
					</span>
					<Switch
						id={spawnId}
						checked={agent.spawn}
						onCheckedChange={(checked) => {
							onUpdate("spawn", checked);
							onUpdate(
								"depth",
								checked
									? Math.max(agent.depth, 2)
									: Math.min(agent.depth, 1),
							);
						}}
					/>
				</label>
			</FormSection>
		</div>
	);
}
