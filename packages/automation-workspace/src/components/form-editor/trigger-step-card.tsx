import { ChevronDown, ChevronRight, Zap } from "lucide-react";
import { Field, FieldLabel, Textarea } from "@semoss/ui/next";
import type { AutomationNode } from "../../domain/automation.types";
import { AiSuggestButton } from "./ai-suggest-button";
import { TriggerForm } from "./forms/trigger-form";

interface TriggerStepCardProps {
	step: AutomationNode;
	isExpanded: boolean;
	appId: string;
	description: string;
	onDescriptionChange: (v: string) => void;
	/** When provided, shows a Suggest button next to the Description label. */
	onSuggestDescription?: () => void;
	suggestingDescription?: boolean;
	onToggle: () => void;
	devMode: boolean;
	onDevModeChange: (v: boolean) => void;
}

export function TriggerStepCard({
	step,
	isExpanded,
	appId,
	description,
	onDescriptionChange,
	onSuggestDescription,
	suggestingDescription = false,
	onToggle,
	devMode,
	onDevModeChange,
}: TriggerStepCardProps) {
	return (
		<div
			data-tour="trigger-card"
			className="rounded-2xl border bg-card shadow-sm ring-1 ring-primary/20"
		>
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
						{devMode && (
							<span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] text-amber-700 dark:text-amber-400">
								Dev mode
							</span>
						)}
					</div>
					<div className="mt-0.5 truncate text-[11px] text-muted-foreground">
						{description.trim()
							? description.trim()
							: "Add a description of what this automation does"}
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
				<div className="space-y-4 border-t px-4 pt-4 pb-4">
					<Field>
						<div className="flex items-center justify-between">
							<FieldLabel className="text-xs">
								Description
							</FieldLabel>
							{onSuggestDescription && (
								<AiSuggestButton
									onClick={onSuggestDescription}
									loading={suggestingDescription}
									title="Suggest a description based on your automation steps"
								/>
							)}
						</div>
						<Textarea
							value={description}
							onChange={(e) =>
								onDescriptionChange(e.target.value)
							}
							placeholder="What does this automation do? e.g. Queries open claims and sends a daily summary email"
							rows={3}
							className="resize-none overflow-y-auto text-sm"
						/>
					</Field>
					<TriggerForm appId={appId} />
					<div className="flex items-center justify-between border-t pt-3">
						<div>
							<p className="font-medium text-xs">
								Developer mode
							</p>
							<p className="text-[11px] text-muted-foreground">
								Show advanced fields like pixel previews and
								output variable names
							</p>
						</div>
						<button
							type="button"
							onClick={() => onDevModeChange(!devMode)}
							className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none ${
								devMode
									? "bg-amber-500"
									: "bg-muted-foreground/30"
							}`}
							role="switch"
							aria-checked={devMode}
							aria-label="Toggle developer mode"
						>
							<span
								className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
									devMode ? "translate-x-4" : "translate-x-0"
								}`}
							/>
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
