import { Code2 } from "lucide-react";
import { useState } from "react";
import {
	NODE_TYPE_META,
	type NodeTypeMeta,
} from "@/pages/workflow/workflow.types";
import { NODE_ICONS } from "../workflow-node-meta";

const CATEGORY_LABELS: Record<NodeTypeMeta["category"], string> = {
	trigger: "Trigger",
	engine: "Engines & Apps",
	logic: "Logic",
	utility: "Utility",
};

function PaletteItem({ meta }: { meta: NodeTypeMeta }) {
	const Icon = NODE_ICONS[meta.type] ?? Code2;

	const onDragStart = (e: React.DragEvent) => {
		e.dataTransfer.setData("application/workflow-node-type", meta.type);
		e.dataTransfer.effectAllowed = "copy";
	};

	return (
		<div
			draggable
			role="option"
			aria-selected={false}
			tabIndex={0}
			onDragStart={onDragStart}
			className="flex cursor-grab items-center gap-2.5 rounded-md border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent active:cursor-grabbing"
			title={meta.description}
		>
			<Icon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
			<span className="font-medium text-xs">{meta.label}</span>
		</div>
	);
}

export function NodePalette() {
	const [search, setSearch] = useState("");

	const filtered = NODE_TYPE_META.filter(
		(m) =>
			!search ||
			m.label.toLowerCase().includes(search.toLowerCase()) ||
			m.description.toLowerCase().includes(search.toLowerCase()),
	);

	const categories = (
		["trigger", "engine", "logic", "utility"] as const
	).filter((c) => filtered.some((m) => m.category === c));

	return (
		<div className="flex h-full flex-col gap-3 overflow-y-auto border-r bg-muted/20 p-3">
			<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
				Nodes
			</p>
			<input
				type="text"
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				placeholder="Search…"
				className="h-7 rounded-md border border-border bg-background px-2.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
			/>
			<div className="flex flex-col gap-4">
				{categories.map((cat) => (
					<div key={cat}>
						<p className="mb-1.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
							{CATEGORY_LABELS[cat]}
						</p>
						<div className="flex flex-col gap-1">
							{filtered
								.filter((m) => m.category === cat)
								.map((m) => (
									<PaletteItem key={m.type} meta={m} />
								))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
