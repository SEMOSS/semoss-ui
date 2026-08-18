import type { AutomationNode } from "../../domain/automation.types";
import { AUTOMATION_TEMPLATES } from "../../domain/automation-templates";

export interface TemplateGalleryProps {
	onSelectTemplate: (nodes: AutomationNode[], description: string) => void;
	onStartBlank: () => void;
}

export function TemplateGallery({
	onSelectTemplate,
	onStartBlank,
}: TemplateGalleryProps) {
	return (
		<div className="rounded-2xl border bg-card px-6 py-6 shadow-sm">
			<div className="mb-5">
				<p className="font-semibold text-base">Automation templates</p>
				<p className="mt-0.5 text-muted-foreground text-xs">
					Start from a tested workflow. Applying a template replaces
					the current canvas.
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
			</div>
			<button
				type="button"
				onClick={onStartBlank}
				className="mt-4 w-full text-center text-muted-foreground text-sm hover:text-foreground hover:underline"
			>
				Continue without a template
			</button>
		</div>
	);
}
