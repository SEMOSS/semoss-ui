import { Button } from "@semoss/ui/next";
import type { AutomationNode } from "../../../domain/automation.types";
import { getDisplayMeta } from "../../../domain/automation-display";

export interface ValidationIssue {
	step: AutomationNode;
	issues: string[];
}

/** Props for the validation dock tab. */
interface ValidationTabProps {
	issues: ValidationIssue[];
	onSelectStep: (stepId: string) => void;
}

export function ValidationTab({ issues, onSelectStep }: ValidationTabProps) {
	return (
		<div className="h-full overflow-y-auto p-4">
			<div className="mx-auto max-w-2xl">
				<div className="overflow-hidden rounded-xl border bg-card">
					<div className="border-b px-4 py-3">
						<p className="font-semibold text-sm">
							Missing configuration
						</p>
					</div>
					<div className="divide-y">
						{issues.map(({ step, issues: stepIssues }) => (
							<div key={step.id} className="px-4 py-3">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="font-medium text-xs">
											{step.label ||
												getDisplayMeta(step.type).label}
										</p>
										<ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
											{stepIssues.map((issue) => (
												<li key={issue}>{issue}</li>
											))}
										</ul>
									</div>
									<Button
										size="sm"
										variant="outline"
										className="h-7 shrink-0 text-[11px]"
										onClick={() => onSelectStep(step.id)}
									>
										Open
									</Button>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
