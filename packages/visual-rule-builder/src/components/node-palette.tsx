import type { Node } from "@xyflow/react";
import {
	BarChart3,
	CheckCircle,
	GitBranch,
	GitCompare,
	GitMerge,
	Lightbulb,
} from "lucide-react";

interface NodePaletteProps {
	onAddNode: (node: Node) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
	const handleAddDataField = () => {
		const newNode: Node = {
			id: `node-${Date.now()}`,
			type: "value",
			position: { x: 400, y: 200 },
			data: { label: "field_name" },
		};
		onAddNode(newNode);
	};

	const handleAddCondition = () => {
		const newNode: Node = {
			id: `node-${Date.now()}`,
			type: "operator",
			position: { x: 400, y: 200 },
			data: { label: "==" },
		};
		onAddNode(newNode);
	};

	const handleAddAndLogic = () => {
		const newNode: Node = {
			id: `node-${Date.now()}`,
			type: "operator",
			position: { x: 400, y: 200 },
			data: { label: "AND" },
		};
		onAddNode(newNode);
	};

	const handleAddOrLogic = () => {
		const newNode: Node = {
			id: `node-${Date.now()}`,
			type: "operator",
			position: { x: 400, y: 200 },
			data: { label: "OR" },
		};
		onAddNode(newNode);
	};

	const handleAddResult = () => {
		const newNode: Node = {
			id: `node-${Date.now()}`,
			type: "result",
			position: { x: 400, y: 200 },
			data: { label: "Return\nvalue" },
		};
		onAddNode(newNode);
	};

	return (
		<div className="flex h-full w-60 flex-col border-r bg-background">
			<div className="p-4">
				<h2 className="mb-4 font-semibold text-sm">Add Nodes</h2>
				<div className="space-y-2">
					<button
						type="button"
						onClick={handleAddDataField}
						className="flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent"
					>
						<BarChart3 className="mt-0.5 h-5 w-5 text-green-600" />
						<div>
							<div className="font-medium text-sm">
								Data Field
							</div>
							<div className="text-muted-foreground text-xs">
								Read a field from data
							</div>
						</div>
					</button>

					<button
						type="button"
						onClick={handleAddCondition}
						className="flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent"
					>
						<GitCompare className="mt-0.5 h-5 w-5 text-blue-600" />
						<div>
							<div className="font-medium text-sm">Condition</div>
							<div className="text-muted-foreground text-xs">
								Compare values
							</div>
						</div>
					</button>

					<button
						type="button"
						onClick={handleAddAndLogic}
						className="flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent"
					>
						<GitMerge className="mt-0.5 h-5 w-5 text-blue-600" />
						<div>
							<div className="font-medium text-sm">AND Logic</div>
							<div className="text-muted-foreground text-xs">
								All conditions true
							</div>
						</div>
					</button>

					<button
						type="button"
						onClick={handleAddOrLogic}
						className="flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent"
					>
						<GitBranch className="mt-0.5 h-5 w-5 text-blue-600" />
						<div>
							<div className="font-medium text-sm">OR Logic</div>
							<div className="text-muted-foreground text-xs">
								Any condition true
							</div>
						</div>
					</button>

					<button
						type="button"
						onClick={handleAddResult}
						className="flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent"
					>
						<CheckCircle className="mt-0.5 h-5 w-5 text-purple-600" />
						<div>
							<div className="font-medium text-sm">Result</div>
							<div className="text-muted-foreground text-xs">
								Output value
							</div>
						</div>
					</button>
				</div>
			</div>

			<div className="mt-auto border-t bg-muted/30 p-4">
				<div className="mb-2 flex items-center gap-2">
					<Lightbulb className="h-4 w-4 text-yellow-600" />
					<h3 className="font-medium text-sm">Quick Tips</h3>
				</div>
				<ul className="space-y-1 text-muted-foreground text-xs">
					<li>• Connect operators to values</li>
					<li>• Connect results to show outcomes</li>
					<li>• Green edges = true branch</li>
					<li>• Orange edges = else branch</li>
					<li>• Double-click nodes to edit</li>
				</ul>
			</div>
		</div>
	);
}
