import { X } from "lucide-react";
import { Button } from "@semoss/ui/next";
import type { AutomationNodeType } from "../../domain/automation.types";
import { STEP_TYPES } from "../../domain/automation-display";

interface AddNodeMenuProps {
	onSelect: (type: AutomationNodeType) => void;
	onClose: () => void;
}

export function AddNodeMenu({ onSelect, onClose }: AddNodeMenuProps) {
	return (
		<div className="rounded-2xl border bg-card p-5 shadow-sm">
			<div className="mb-4 flex items-center justify-between gap-3">
				<div>
					<p className="font-medium text-sm">Choose step type</p>
					<p className="text-[11px] text-muted-foreground">
						Select a step to add to the automation.
					</p>
				</div>
				<Button
					size="sm"
					variant="ghost"
					className="h-8 w-8 p-0"
					onClick={onClose}
					aria-label="Close"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
			<div className="grid gap-3 md:grid-cols-2">
				{STEP_TYPES.map((stepType) => {
					const Icon = stepType.icon;
					return (
						<button
							key={stepType.type}
							type="button"
							onClick={() => onSelect(stepType.type)}
							className="flex items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:border-primary hover:bg-muted/40"
						>
							<span
								className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted ${stepType.color}`}
							>
								<Icon className="h-5 w-5" />
							</span>
							<span className="space-y-1">
								<span className="block font-medium text-sm">
									{stepType.label}
								</span>
								<span className="block text-[11px] text-muted-foreground">
									{stepType.description}
								</span>
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
