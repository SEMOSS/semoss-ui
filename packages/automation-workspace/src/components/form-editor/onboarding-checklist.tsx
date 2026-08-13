import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AutomationNode } from "../../domain/automation.types";

interface OnboardingChecklistProps {
	appId: string;
	description: string;
	steps: AutomationNode[];
	isDirty: boolean;
	hasAttemptedRun: boolean;
}

const DISMISSED_KEY = (appId: string) =>
	`automation-checklist-dismissed-${appId}`;

export function OnboardingChecklist({
	appId,
	description,
	steps,
	isDirty,
	hasAttemptedRun,
}: OnboardingChecklistProps) {
	const [dismissed, setDismissed] = useState(
		() => localStorage.getItem(DISMISSED_KEY(appId)) === "true",
	);

	const nonTriggerSteps = steps.filter((s) => s.type !== "trigger");

	const items = useMemo(() => {
		const cfg = (s: AutomationNode) =>
			s.config as unknown as Record<string, unknown>;
		const hasEngine = nonTriggerSteps.some(
			(s) => cfg(s).engineId != null && cfg(s).engineId !== "",
		);
		return [
			{
				label: "Give your automation a name",
				done: description.trim().length > 0,
			},
			{
				label: "Add your first step",
				done: nonTriggerSteps.length > 0,
			},
			{
				label: "Connect a data source or AI",
				done: hasEngine,
			},
			{
				label: "Save your automation",
				done: !isDirty && nonTriggerSteps.length > 0,
			},
			{
				label: "Run it for the first time",
				done: hasAttemptedRun,
			},
		];
	}, [description, nonTriggerSteps, isDirty, hasAttemptedRun]);

	const completedCount = items.filter((i) => i.done).length;
	const allDone = completedCount === items.length;

	useEffect(() => {
		if (allDone && !dismissed) {
			localStorage.setItem(DISMISSED_KEY(appId), "true");
			setDismissed(true);
		}
	}, [allDone, appId, dismissed]);

	const dismiss = () => {
		localStorage.setItem(DISMISSED_KEY(appId), "true");
		setDismissed(true);
	};

	if (dismissed) {
		return (
			<div className="flex items-center gap-2 rounded-xl border bg-emerald-500/5 px-4 py-2.5 text-emerald-700 text-xs">
				<Check className="h-3.5 w-3.5" />
				Setup complete
			</div>
		);
	}

	return (
		<div className="rounded-2xl border bg-card px-5 py-4 shadow-sm">
			<div className="mb-3 flex items-center justify-between gap-2">
				<div>
					<p className="font-medium text-sm">Getting started</p>
					<p className="text-[11px] text-muted-foreground">
						{completedCount} of {items.length} complete
					</p>
				</div>
				<button
					type="button"
					onClick={dismiss}
					className="shrink-0 text-muted-foreground text-xs hover:text-foreground"
				>
					Dismiss
				</button>
			</div>
			<div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-primary transition-all duration-500"
					style={{
						width: `${(completedCount / items.length) * 100}%`,
					}}
				/>
			</div>
			<div className="space-y-2">
				{items.map((item) => (
					<div key={item.label} className="flex items-center gap-2.5">
						<span
							className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
								item.done
									? "border-emerald-500 bg-emerald-500 text-white"
									: "border-muted-foreground/30"
							}`}
						>
							{item.done && <Check className="h-2.5 w-2.5" />}
						</span>
						<span
							className={`text-[12px] ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}
						>
							{item.label}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
