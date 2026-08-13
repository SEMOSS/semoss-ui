import { Sparkles } from "lucide-react";
import type { AutomationNode } from "../../domain/automation.types";
import { AUTOMATION_TEMPLATES } from "../../domain/automation-templates";

export interface TemplateGalleryProps {
	onSelectTemplate: (nodes: AutomationNode[], description: string) => void;
	onStartBlank: () => void;
	/** Opens the AI chat panel for conversational automation building */
	onBuildWithAi: () => void;
}

export function TemplateGallery({
	onSelectTemplate,
	onStartBlank,
	onBuildWithAi,
}: TemplateGalleryProps) {
	return (
		<div className="rounded-2xl border bg-card px-6 py-6 shadow-sm">
			<div className="mb-5 text-center">
				<p className="font-semibold text-base">
					How would you like to start?
				</p>
				<p className="mt-0.5 text-muted-foreground text-xs">
					Pick a template or describe your automation in plain
					language.
				</p>
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				{AUTOMATION_TEMPLATES.map((template) => (
					<button
						key={template.id}
						type="button"
						onClick={() =>
							onSelectTemplate(
								template.makeNodes(),
								template.automationDescription,
							)
						}
						className="flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-colors hover:border-primary hover:bg-muted/40"
					>
						<span className="font-medium text-sm">
							{template.name}
						</span>
						<span className="text-[11px] text-muted-foreground leading-relaxed">
							{template.description}
						</span>
					</button>
				))}
				<button
					type="button"
					onClick={onBuildWithAi}
					className="flex flex-col gap-1.5 rounded-xl border border-primary/30 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10"
				>
					<span className="flex items-center gap-1.5 font-medium text-primary text-sm">
						<Sparkles className="h-3.5 w-3.5" />
						Build with AI
					</span>
					<span className="text-[11px] text-muted-foreground leading-relaxed">
						Describe what you need and AI will draft a workflow.
					</span>
				</button>
			</div>
			<button
				type="button"
				onClick={onStartBlank}
				className="mt-4 w-full text-center text-muted-foreground text-sm hover:text-foreground hover:underline"
			>
				Start blank
			</button>
		</div>
	);
}
