import {
	Bot,
	BrainCircuit,
	Code2,
	Cog,
	Diamond,
	FileOutput,
	Hash,
	Lock,
	Package,
} from "lucide-react";
import { useCallback } from "react";
import type { PaletteEntry } from "@/types/workflow";
import {
	FUTURE_STEP_TYPES,
	PALETTE_ENTRIES,
	STEP_CATEGORIES,
} from "@/types/workflow";

// ─── Icon mapping ────────────────────────────────────────────────
const STEP_ICONS: Record<string, React.ReactNode> = {
	LLM_ASK: <Bot className="h-4 w-4" />,
	LLM_AGENT: <BrainCircuit className="h-4 w-4" />,
	RUN_TOOL: <Cog className="h-4 w-4" />,
	USE_APP: <Package className="h-4 w-4" />,
	RUN_PIXEL: <Code2 className="h-4 w-4" />,
	CONDITION: <Diamond className="h-4 w-4" />,
	STATIC: <Hash className="h-4 w-4" />,
	OUTPUT: <FileOutput className="h-4 w-4" />,
};

// ─── Palette Item ────────────────────────────────────────────────
function PaletteItem({ entry }: { entry: PaletteEntry }) {
	const handleDragStart = useCallback(
		(event: React.DragEvent) => {
			event.dataTransfer.setData(
				"application/workflow-step-type",
				entry.stepType,
			);
			if (entry.variant) {
				event.dataTransfer.setData(
					"application/workflow-step-variant",
					entry.variant,
				);
			}
			event.dataTransfer.effectAllowed = "move";
		},
		[entry],
	);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: draggable palette items use drag-and-drop, not click
		<div
			draggable
			onDragStart={handleDragStart}
			className="flex cursor-grab items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 transition-colors hover:border-blue-300 hover:bg-blue-50 active:cursor-grabbing"
		>
			<span className="text-gray-600">
				{STEP_ICONS[entry.key] ?? STEP_ICONS[entry.stepType]}
			</span>
			<span className="font-medium text-gray-700 text-sm">
				{entry.label}
			</span>
		</div>
	);
}

// ─── Disabled Future Item ────────────────────────────────────────
function FuturePaletteItem({ label }: { label: string }) {
	return (
		<div className="flex cursor-not-allowed items-center gap-2 rounded-md border border-gray-200 border-dashed bg-gray-50 px-3 py-2 opacity-50">
			<Lock className="h-4 w-4 text-gray-400" />
			<span className="text-gray-400 text-sm">{label}</span>
			<span className="ml-auto text-[10px] text-gray-400">Soon</span>
		</div>
	);
}

// ─── Step Palette ────────────────────────────────────────────────
export function StepPalette() {
	return (
		<div className="flex h-full flex-col gap-4 overflow-y-auto border-gray-200 border-r bg-gray-50 p-3">
			<div className="px-1 font-semibold text-gray-500 text-xs uppercase tracking-wider">
				Steps
			</div>

			{STEP_CATEGORIES.map((category) => {
				const entries = PALETTE_ENTRIES[category.label] ?? [];
				return (
					<div key={category.label} className="flex flex-col gap-1.5">
						<div className="px-1 font-semibold text-[11px] text-gray-400 uppercase tracking-wide">
							{category.label}
						</div>
						{entries.map((entry) => (
							<PaletteItem key={entry.key} entry={entry} />
						))}
					</div>
				);
			})}

			{/* Future step types */}
			<div className="flex flex-col gap-1.5">
				<div className="px-1 font-semibold text-[11px] text-gray-400 uppercase tracking-wide">
					Coming Soon
				</div>
				{FUTURE_STEP_TYPES.map((ft) => (
					<FuturePaletteItem key={ft} label={ft.replace(/_/g, " ")} />
				))}
			</div>
		</div>
	);
}
