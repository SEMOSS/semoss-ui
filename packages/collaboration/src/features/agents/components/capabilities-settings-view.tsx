import {
	Alert,
	AlertDescription,
	Button,
	H2,
	P,
	Spinner,
} from "@semoss/ui/next";
import { SelectionList } from "@/features/agents/components/selection-list";
import type { Agent } from "@/types/agent";

type UpdateAgent = <Key extends keyof Agent>(
	key: Key,
	value: Agent[Key],
) => void;

export function CapabilitiesSettingsView({
	agent,
	skillOptions,
	isLoadingSkills,
	skillsError,
	onRetrySkills,
	onUpdate,
}: {
	agent: Agent;
	skillOptions: { name: string; detail: string; value: string }[];
	isLoadingSkills: boolean;
	skillsError: Error | null;
	onRetrySkills?: () => void;
	onUpdate: UpdateAgent;
}) {
	return (
		<div className="space-y-7">
			<div>
				<H2 className="font-medium text-base">
					What {agent.name || "your agent"} can work with
				</H2>
				<P className="mt-1 text-muted-foreground">
					Databases and data products are sample resources. Skills are
					loaded from your catalog.
				</P>
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
			{isLoadingSkills && (
				<Spinner aria-label="Loading available skills" />
			)}
			{skillsError && (
				<Alert variant="destructive">
					<AlertDescription>
						Could not load available skills. {skillsError.message}
					</AlertDescription>
					{onRetrySkills && (
						<Button
							type="button"
							variant="outline"
							onClick={onRetrySkills}
						>
							Try again
						</Button>
					)}
				</Alert>
			)}
			{!isLoadingSkills && !skillsError && skillOptions.length === 0 && (
				<P className="text-muted-foreground">
					No skills are available.
				</P>
			)}
			<SelectionList
				title="Skills"
				options={skillOptions}
				selected={agent.skillIds ?? []}
				onChange={(ids) => {
					onUpdate("skillIds", ids);
					onUpdate(
						"skills",
						skillOptions
							.filter((option) => ids.includes(option.value))
							.map((option) => option.name),
					);
				}}
			/>
		</div>
	);
}
