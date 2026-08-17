import {
	Braces,
	Database,
	FolderOpen,
	FunctionSquare,
	Network,
	SlidersHorizontal,
	Sparkles,
	Variable,
} from "lucide-react";
import { AUTOMATION_WORKFLOW_NODE_REGISTRY } from "../../domain/automation-workflow.constants";
import type {
	AutomationNodeCategory,
	AutomationWorkflowNodeType,
} from "../../domain/automation-workflow.types";

interface AddNodeMenuProps {
	onSelect: (type: AutomationWorkflowNodeType) => void;
}

const CATEGORY_ORDER: readonly AutomationNodeCategory[] = [
	"trigger",
	"database",
	"model",
	"storage",
	"vector",
	"function",
	"app",
	"control",
	"developer",
];

const CATEGORY_META: Record<
	AutomationNodeCategory,
	{ label: string; icon: typeof Database }
> = {
	trigger: { label: "Trigger", icon: Braces },
	database: { label: "Database", icon: Database },
	model: { label: "AI models", icon: Sparkles },
	storage: { label: "Storage", icon: FolderOpen },
	vector: { label: "Vector", icon: Network },
	function: { label: "Functions", icon: FunctionSquare },
	app: { label: "Apps", icon: Variable },
	control: { label: "Flow control", icon: SlidersHorizontal },
	developer: { label: "Developer", icon: Braces },
};

export function AddNodeMenu({ onSelect }: AddNodeMenuProps) {
	return (
		<div className="flex h-full min-h-0 flex-col p-5">
			<div className="mb-4">
				<div>
					<p className="font-medium text-sm">Add a workflow node</p>
					<p className="text-[11px] text-muted-foreground">
						Choose a typed node for this Python automation.
					</p>
				</div>
			</div>
			<div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
				{CATEGORY_ORDER.map((category) => {
					const entries = AUTOMATION_WORKFLOW_NODE_REGISTRY.filter(
						(node) => node.category === category,
					);
					if (entries.length === 0) return null;
					const Icon = CATEGORY_META[category].icon;
					return (
						<section key={category}>
							<div className="mb-2 flex items-center gap-2 text-muted-foreground">
								<Icon className="size-3.5" />
								<p className="font-medium text-[11px] uppercase tracking-wide">
									{CATEGORY_META[category].label}
								</p>
							</div>
							<div className="space-y-2">
								{entries.map((node) => (
									<button
										key={node.type}
										type="button"
										onClick={() => onSelect(node.type)}
										disabled={node.type === "trigger.start"}
										className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
									>
										<span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
											<Icon className="size-4" />
										</span>
										<span className="min-w-0 space-y-1">
											<span className="block font-medium text-sm">
												{node.label}
											</span>
											<span className="block text-[11px] text-muted-foreground">
												{node.type === "trigger.start"
													? "Added automatically to every workflow."
													: node.description}
											</span>
										</span>
									</button>
								))}
							</div>
						</section>
					);
				})}
			</div>
		</div>
	);
}
