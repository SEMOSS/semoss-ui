import { SelectionList } from "@/features/agents/components/selection-list";
import type { Agent } from "@/types/agent";

type UpdateAgent = <Key extends keyof Agent>(
	key: Key,
	value: Agent[Key],
) => void;

export function CapabilitiesSettingsView({
	agent,
	skillOptions,
	onUpdate,
}: {
	agent: Agent;
	skillOptions: { name: string; detail: string }[];
	onUpdate: UpdateAgent;
}) {
	return (
		<div className="space-y-7">
			<div>
				<h2 className="font-semibold text-base">
					What {agent.name || "your agent"} can work with
				</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Sample resources · No live connections
				</p>
			</div>
			<SelectionList
				title="Databases"
				options={[
					{
						name: "Business warehouse",
						detail: "Sample financial and operational tables · Read only",
					},
					{
						name: "Customer database",
						detail: "Sample account records · Read only",
					},
				]}
				selected={agent.databases}
				onChange={(value) => onUpdate("databases", value)}
			/>
			<SelectionList
				title="Data products"
				options={[
					{
						name: "Quarterly performance",
						detail: "Curated revenue and delivery measures",
					},
					{
						name: "Market signals",
						detail: "Sector and competitor updates",
					},
				]}
				selected={agent.dataProducts}
				onChange={(value) => onUpdate("dataProducts", value)}
			/>
			<SelectionList
				title="Skills"
				options={skillOptions}
				selected={agent.skills}
				onChange={(value) => onUpdate("skills", value)}
			/>
		</div>
	);
}
