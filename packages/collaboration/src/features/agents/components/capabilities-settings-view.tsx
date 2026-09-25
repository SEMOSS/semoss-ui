import { BookOpen, Sparkles, Wrench } from "lucide-react";
import { type MCPConfig, splitMcpByType } from "@semoss/shared";
import { H2, P } from "@semoss/ui/next";
import type { Agent, AgentFieldUpdater } from "@/types/agent";
import { CapabilityPicker } from "./capability-picker";
import { CapabilitySection } from "./capability-section";

/** Summarize the agent's capabilities and browse each catalog only when adding. */
export function CapabilitiesSettingsView({
	agent,
	disabled,
	skillOptions,
	isLoadingSkills,
	skillsError,
	onRetrySkills,
	onUpdate,
}: {
	agent: Agent;
	disabled?: boolean;
	skillOptions: { name: string; detail: string; value: string }[];
	isLoadingSkills: boolean;
	skillsError: Error | null;
	onRetrySkills?: () => void;
	onUpdate: AgentFieldUpdater;
}) {
	const { knowledge, toolbox } = splitMcpByType(agent.mcp);
	const skills: MCPConfig[] = agent.skills.map((skill) => ({
		id: skill.id,
		name:
			skillOptions.find((option) => option.value === skill.id)?.name ??
			skill.name,
		type: "PROJECT",
	}));
	function updateSkills(values: MCPConfig[]): void {
		onUpdate({
			key: "skills",
			value: values.map(({ id, name }) => ({ id, name })),
		});
	}

	return (
		<div className="space-y-6">
			<div className="pb-2">
				<H2 className="font-medium text-base">
					What {agent.name || "your agent"} can work with
				</H2>
				<P className="mt-1 text-muted-foreground text-sm">
					Give your agent context, tools, and skills for the work
					ahead.
				</P>
			</div>
			<CapabilitySection
				title="Knowledge"
				description="Sources your agent can reference."
				emptyText="No knowledge added yet."
				icon={BookOpen}
				items={knowledge}
				disabled={disabled}
				onRemove={(id) =>
					onUpdate({
						key: "mcp",
						value: agent.mcp.filter(
							(resource) => resource.id !== id,
						),
					})
				}
			>
				<CapabilityPicker
					kind="KNOWLEDGE"
					values={knowledge}
					disabled={disabled}
					onChange={(value) =>
						onUpdate({ key: "mcp", value: [...value, ...toolbox] })
					}
				/>
			</CapabilitySection>
			<CapabilitySection
				title="Toolboxes"
				description="Tools your agent can use to take action."
				emptyText="No toolboxes added yet."
				icon={Wrench}
				items={toolbox}
				disabled={disabled}
				onRemove={(id) =>
					onUpdate({
						key: "mcp",
						value: agent.mcp.filter(
							(resource) => resource.id !== id,
						),
					})
				}
			>
				<CapabilityPicker
					kind="TOOLBOX"
					values={toolbox}
					disabled={disabled}
					onChange={(value) =>
						onUpdate({
							key: "mcp",
							value: [...knowledge, ...value],
						})
					}
				/>
			</CapabilitySection>
			<CapabilitySection
				title="Skills"
				description="Reusable instructions for familiar tasks."
				emptyText="No skills added yet."
				icon={Sparkles}
				items={skills}
				disabled={disabled}
				onRemove={(id) =>
					updateSkills(skills.filter((skill) => skill.id !== id))
				}
			>
				<CapabilityPicker
					kind="SKILL"
					values={skills}
					disabled={disabled}
					onChange={updateSkills}
					skills={{
						options: skillOptions,
						isLoading: isLoadingSkills,
						error: skillsError,
						refresh: onRetrySkills,
					}}
				/>
			</CapabilitySection>
		</div>
	);
}
