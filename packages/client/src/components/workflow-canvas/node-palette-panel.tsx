import { Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import type { WorkflowNodeType } from "@/pages/workflow/workflow.types";
import { NODE_TYPE_META } from "@/pages/workflow/workflow.types";
import {
	NODE_COLORS,
	NODE_ICONS,
} from "../workflow-workspace/workflow-node-meta";

// Exclude `app` from the palette — merged into custom-pixel
const PALETTE_NODES = NODE_TYPE_META.filter(
	(m) => m.category !== "trigger" && m.type !== "app",
);

const CATEGORY_LABELS: Record<string, string> = {
	engine: "Actions",
	logic: "Logic",
};

const CATEGORY_ORDER = ["engine", "logic"] as const;

interface NodePalettePanelProps {
	onAdd: (type: WorkflowNodeType) => void;
}

export function NodePalettePanel({ onAdd }: NodePalettePanelProps) {
	return (
		<div className="flex h-full w-56 shrink-0 flex-col overflow-y-auto border-r bg-background p-3">
			<p className="mb-3 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
				Add Node
			</p>
			{CATEGORY_ORDER.map((category) => {
				const nodes = PALETTE_NODES.filter(
					(m) => m.category === category,
				);
				if (nodes.length === 0) return null;
				return (
					<div key={category} className="mb-2">
						<p className="mb-1 font-semibold text-[10px] text-muted-foreground/60 uppercase tracking-wider">
							{CATEGORY_LABELS[category]}
						</p>
						<div className="flex flex-col gap-0.5">
							{nodes.map((m) => {
								const Icon = NODE_ICONS[m.type];
								const color =
									NODE_COLORS[m.type] ?? "bg-slate-500";
								return (
									<Tooltip key={m.type} delayDuration={500}>
										<TooltipTrigger asChild>
											<button
												type="button"
												className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left hover:bg-accent"
												onClick={() => onAdd(m.type)}
											>
												<span
													className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded ${color}`}
												>
													<Icon className="h-3 w-3 text-white" />
												</span>
												<span className="min-w-0 flex-1">
													<span className="block truncate font-medium text-xs leading-tight">
														{m.label}
													</span>
													<span className="block text-[10px] text-muted-foreground leading-snug">
														{m.description}
													</span>
												</span>
											</button>
										</TooltipTrigger>
										<TooltipContent
											side="right"
											className="max-w-72 whitespace-pre-line text-xs leading-relaxed"
										>
											{m.tooltip}
										</TooltipContent>
									</Tooltip>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
}
