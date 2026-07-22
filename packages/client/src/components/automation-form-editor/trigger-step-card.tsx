import { ChevronDown, ChevronRight, Zap } from "lucide-react";
import type {
	AutomationNode,
	EngineOption,
	TriggerConfig,
} from "@/pages/automation/automation.types";
import { TRIGGER_MODE_OPTIONS, TriggerForm } from "./forms/trigger-form";

interface TriggerStepCardProps {
	step: AutomationNode;
	isExpanded: boolean;
	enginesByType: Record<string, EngineOption[]>;
	appId: string;
	onToggle: () => void;
	onUpdate: (step: AutomationNode) => void;
	onScheduleActivate: (
		cron: string,
		timezone: string,
		recipe: string,
	) => Promise<string | null>;
	onScheduleDeactivate: (jobId: string) => Promise<void>;
	onGenerateWebhookSecret: () => Promise<string | null>;
}

export function TriggerStepCard({
	step,
	isExpanded,
	enginesByType,
	appId,
	onToggle,
	onUpdate,
	onScheduleActivate,
	onScheduleDeactivate,
	onGenerateWebhookSecret,
}: TriggerStepCardProps) {
	const config = step.config as TriggerConfig;
	const modeLabel =
		TRIGGER_MODE_OPTIONS.find((o) => o.value === config.mode)?.label ??
		"Manual";

	const handleChange = (updated: TriggerConfig) =>
		onUpdate({ ...step, config: updated });

	return (
		<div className="rounded-2xl border bg-card shadow-sm ring-1 ring-primary/20">
			{/* header */}
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:text-foreground"
			>
				<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-[11px] text-primary">
					<Zap className="h-4 w-4" />
				</span>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<span className="font-medium text-sm">
							{step.label}
						</span>
						<span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] text-primary">
							{modeLabel}
						</span>
						<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
							non-deleteable
						</span>
					</div>
					<div className="mt-0.5 text-[11px] text-muted-foreground">
						Trigger · defines how this automation starts
					</div>
				</div>
				{isExpanded ? (
					<ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
				) : (
					<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
				)}
			</button>

			{/* body */}
			{isExpanded && (
				<div className="border-t px-4 pt-3 pb-4">
					<TriggerForm
						config={config}
						appId={appId}
						engines={enginesByType}
						onChange={handleChange}
						onScheduleActivate={onScheduleActivate}
						onScheduleDeactivate={onScheduleDeactivate}
						onGenerateWebhookSecret={onGenerateWebhookSecret}
					/>
				</div>
			)}
		</div>
	);
}
