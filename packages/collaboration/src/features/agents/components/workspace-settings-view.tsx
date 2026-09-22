import { Check } from "lucide-react";
import { cn } from "@semoss/ui/next";
import { FormSection } from "@/features/agents/components/form-section";
import type { Agent, WorkspaceView } from "@/types/agent";

type UpdateAgent = <Key extends keyof Agent>(
	key: Key,
	value: Agent[Key],
) => void;
export function WorkspaceSettingsView({
	agent,
	onUpdate,
}: {
	agent: Agent;
	onUpdate: UpdateAgent;
}) {
	return (
		<div className="space-y-7">
			<FormSection
				title="A workspace that fits the work"
				description="The content view that opens alongside this agent's conversation."
			>
				<div className="grid gap-4 sm:grid-cols-3">
					{(
						[
							"Conversation",
							"Travel itinerary",
							"Executive brief",
						] as WorkspaceView[]
					).map((workspace) => (
						<button
							type="button"
							key={workspace}
							onClick={() => onUpdate("workspace", workspace)}
							aria-pressed={agent.workspace === workspace}
							className={cn(
								"rounded-lg border p-4 text-left transition-colors",
								agent.workspace === workspace
									? "border-primary bg-accent/40"
									: "hover:border-input",
							)}
						>
							<span className="mb-4 flex h-25 gap-1.5 rounded-md border bg-background p-2">
								<span className="w-4 rounded-sm bg-secondary" />
								<span className="flex flex-1 flex-col gap-1.5 py-1">
									<span className="h-1.5 w-3/4 rounded-sm bg-border" />
									<span className="h-1.5 w-full rounded-sm bg-secondary" />
									<span className="mt-1 h-5 rounded-sm border bg-muted" />
									<span className="h-5 rounded-sm border bg-muted" />
								</span>
								{workspace !== "Conversation" && (
									<span
										className={cn(
											"w-8 rounded-sm",
											workspace === "Travel itinerary"
												? "bg-chart-2/10"
												: "bg-accent",
										)}
									/>
								)}
							</span>
							<span className="flex items-start justify-between gap-2 font-medium text-sm">
								{workspace}
								{agent.workspace === workspace && (
									<Check className="size-4 shrink-0 text-primary" />
								)}
							</span>
						</button>
					))}
				</div>
			</FormSection>
		</div>
	);
}
