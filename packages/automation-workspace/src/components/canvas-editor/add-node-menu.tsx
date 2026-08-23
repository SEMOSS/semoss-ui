import {
	Bot,
	Braces,
	Database,
	FolderOpen,
	FunctionSquare,
	Network,
	Search,
	SlidersHorizontal,
	Sparkles,
	Variable,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@semoss/ui/next";
import { AUTOMATION_WORKFLOW_NODE_REGISTRY } from "../../domain/automation-workflow.constants";
import type {
	AutomationNodeCategory,
	AutomationWorkflowNodeType,
} from "../../domain/automation-workflow.types";
import { getWorkflowNodeDisplay } from "../../domain/automation-workflow-display";

interface AddNodeMenuProps {
	onSelect: (type: AutomationWorkflowNodeType) => void;
}

const CATEGORY_ORDER: readonly AutomationNodeCategory[] = [
	"trigger",
	"database",
	"model",
	"agent",
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
	agent: { label: "Agents", icon: Bot },
	storage: { label: "Storage", icon: FolderOpen },
	vector: { label: "Vector", icon: Network },
	function: { label: "Functions", icon: FunctionSquare },
	app: { label: "Apps", icon: Variable },
	control: { label: "Flow control", icon: SlidersHorizontal },
	developer: { label: "Developer", icon: Braces },
};

export function AddNodeMenu({ onSelect }: AddNodeMenuProps) {
	const [query, setQuery] = useState("");
	const normalizedQuery = query.trim().toLowerCase();
	const entriesByCategory = useMemo(
		() =>
			CATEGORY_ORDER.map((category) => ({
				category,
				entries: AUTOMATION_WORKFLOW_NODE_REGISTRY.filter(
					(node) =>
						node.category === category &&
						node.type !== "trigger.start" &&
						(!normalizedQuery ||
							`${node.label} ${node.description}`
								.toLowerCase()
								.includes(normalizedQuery)),
				),
			})),
		[normalizedQuery],
	);

	return (
		<div className="flex h-full min-h-0 flex-col p-5">
			<div className="mb-4">
				<div>
					<p className="font-medium text-sm">Add a workflow node</p>
					<p className="text-[11px] text-muted-foreground">
						Choose a typed node for this Python automation.
					</p>
				</div>
				<div className="relative mt-4">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
					<Input
						autoFocus
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search nodes"
						className="pl-9"
					/>
				</div>
			</div>
			<div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
				{entriesByCategory.map(({ category, entries }) => {
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
								{entries.map((node) => {
									const NodeIcon = getWorkflowNodeDisplay(
										node.type,
									).icon;
									return (
										<button
											key={node.type}
											type="button"
											onClick={() => onSelect(node.type)}
											className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary hover:bg-muted/40"
										>
											<span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
												<NodeIcon className="size-4" />
											</span>
											<span className="min-w-0 space-y-1">
												<span className="block font-medium text-sm">
													{node.label}
												</span>
												<span className="block text-[11px] text-muted-foreground">
													{node.description}
												</span>
											</span>
										</button>
									);
								})}
							</div>
						</section>
					);
				})}
			</div>
		</div>
	);
}
