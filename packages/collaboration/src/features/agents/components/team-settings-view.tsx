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
				title={
					agent.type === "Team"
						? `${agent.name || "Your agent"}'s team`
						: "Specialist helpers"
				}
				description={
					agent.type === "Team"
						? "One lead, a shared goal, and the right specialists."
						: "Optional specialists this individual agent can delegate to."
				}
			>
				<div className="mb-5 flex items-center gap-3 border-b pb-5">
					<AgentAvatar agent={shownAgent} />
					<span>
						<strong className="block font-medium text-sm">
							{agent.name || "Your agent"}
						</strong>
						<span className="text-muted-foreground text-xs">
							{agent.type === "Team" ? "Team lead" : "Lead agent"}
						</span>
					</span>
				</div>
				<div>
					{agents
						.filter(
							(person) =>
								person.id !== agent.id &&
								person.type !== "Team",
						)
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
							max={5}
							value={agent.depth}
							onChange={(event) =>
								onUpdate(
									"depth",
									Math.max(
										0,
										Math.min(
											5,
											Math.floor(
												Number(event.target.value),
											),
										),
									),
								)
							}
						/>
						<p className="text-muted-foreground text-xs">
							0 disables delegation. Preview range: 0-5.
						</p>
					</div>
					<div className="space-y-2">
						<label
							htmlFor={concurrencyId}
							className="font-medium text-sm"
						>
							Concurrent helpers
						</label>
						<Input
							id={concurrencyId}
							type="number"
							min={1}
							max={8}
							value={agent.concurrency}
							onChange={(event) =>
								onUpdate(
									"concurrency",
									Math.max(
										1,
										Math.min(
											8,
											Math.floor(
												Number(event.target.value),
											),
										),
									),
								)
							}
						/>
						<p className="text-muted-foreground text-xs">
							Preview range: 1-8.
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
							Within the delegation depth configured above.
						</span>
					</span>
					<Switch
						id={spawnId}
						checked={agent.spawn}
						onCheckedChange={(checked) =>
							onUpdate("spawn", checked)
						}
					/>
				</label>
			</FormSection>
		</div>
	);
}
