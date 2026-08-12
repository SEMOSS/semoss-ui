import { useState } from "react";
import { Input } from "@/components/ui";
/**
 * Shared X / Y axis settings editor used by Multi-Line, Bar, and Line charts.
 *
 * Renders inputs for axis title, font size, axis gap, label visibility,
 * value rotation, tick visibility, and (for multi-line) flip-axis. Each
 * field is optional so consumers can hide rows that don't apply.
 *
 * `defaultTitle` (when provided) is shown as the input's placeholder so the
 * user can see what the chart will render when no explicit title is set.
 * The chart itself is responsible for falling back to the same default at
 * render time.
 */
import type { AxisConfig } from "@/types/dashboard";
import { ResetButton } from "./ResetButton";

// Allows the user to clear a number input entirely while editing; commits on blur.
function DraftNumberInput({
	value,
	onCommit,
	min,
	max,
}: {
	value: number;
	onCommit: (n: number) => void;
	min?: number;
	max?: number;
}) {
	const [draft, setDraft] = useState<string | null>(null);
	return (
		<input
			type="number"
			min={min}
			max={max}
			value={draft ?? value}
			className="w-full rounded border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
			onChange={(e) => setDraft(e.target.value)}
			onBlur={(e) => {
				setDraft(null);
				const n = parseFloat(e.target.value);
				onCommit(Number.isNaN(n) ? 0 : n);
			}}
		/>
	);
}

interface AxisSettingsProps {
	axis: "x" | "y";
	value: AxisConfig | undefined;
	onChange: (updates: Partial<AxisConfig>) => void;
	/** Optional: include the Flip Axis toggle (default false). Multi-line uses it. */
	showFlipAxis?: boolean;
	/** Default axis title shown as the input placeholder. */
	defaultTitle?: string;
	/**
	 * Optional: when provided, shows a "Reset to Default" button that
	 * clears every field on this axis back to undefined (so the chart
	 * uses its computed defaults).
	 */
	onReset?: () => void;
}

export function AxisSettings({
	axis,
	value,
	onChange,
	showFlipAxis = false,
	defaultTitle,
	onReset,
}: AxisSettingsProps) {
	const cfg = value ?? {};
	const _axis = axis; // currently unused — retained for future axis-specific defaults
	void _axis;

	return (
		<div className="flex flex-col gap-3 px-1 py-1">
			<div>
				<label className="mb-1 block font-semibold text-stone-600 text-xs">
					Axis Title
				</label>
				<Input
					type="text"
					value={cfg.title ?? ""}
					onChange={(e) =>
						onChange({ title: e.target.value || undefined })
					}
					className="w-full rounded border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
					placeholder={defaultTitle ?? "Axis label..."}
				/>
			</div>
			<div>
				<label className="mb-1 block font-semibold text-stone-600 text-xs">
					Font Size
				</label>
				<DraftNumberInput
					value={cfg.fontSize ?? 11}
					min={8}
					max={20}
					onCommit={(n) => onChange({ fontSize: n })}
				/>
			</div>
			<div>
				<label className="mb-1 block font-semibold text-stone-600 text-xs">
					Axis Gap
				</label>
				<DraftNumberInput
					value={cfg.axisGap ?? 0}
					onCommit={(n) => onChange({ axisGap: n })}
				/>
			</div>
			<div className="flex items-center justify-between">
				<span className="text-stone-600 text-xs">Show Labels</span>
				<button
					type="button"
					onClick={() =>
						onChange({ showLabels: !(cfg.showLabels !== false) })
					}
					className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
						cfg.showLabels !== false
							? "bg-indigo-500"
							: "bg-stone-300"
					}`}
				>
					<span
						className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
							cfg.showLabels !== false
								? "translate-x-[18px]"
								: "translate-x-[2px]"
						}`}
					/>
				</button>
			</div>
			<div>
				<label className="mb-1 block font-semibold text-stone-600 text-xs">
					Rotate Values (°)
				</label>
				<DraftNumberInput
					value={cfg.rotateValues ?? 0}
					min={-90}
					max={90}
					onCommit={(n) => onChange({ rotateValues: n })}
				/>
			</div>
			<div className="flex items-center justify-between">
				<span className="text-stone-600 text-xs">Show Line Ticks</span>
				<button
					type="button"
					onClick={() =>
						onChange({ showTicks: !(cfg.showTicks !== false) })
					}
					className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
						cfg.showTicks !== false
							? "bg-indigo-500"
							: "bg-stone-300"
					}`}
				>
					<span
						className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
							cfg.showTicks !== false
								? "translate-x-[18px]"
								: "translate-x-[2px]"
						}`}
					/>
				</button>
			</div>
			{showFlipAxis && (
				<div className="flex items-center justify-between">
					<span className="text-stone-600 text-xs">Flip Axis</span>
					<button
						type="button"
						onClick={() => onChange({ flipAxis: !cfg.flipAxis })}
						className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
							cfg.flipAxis ? "bg-indigo-500" : "bg-stone-300"
						}`}
					>
						<span
							className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
								cfg.flipAxis
									? "translate-x-[18px]"
									: "translate-x-[2px]"
							}`}
						/>
					</button>
				</div>
			)}
			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Title Placement
				</label>
				<div className="flex overflow-hidden rounded border border-stone-200 text-xs">
					{(["start", "center", "end"] as const).map((opt) => (
						<button
							key={opt}
							type="button"
							onClick={() =>
								onChange({
									titleAlign:
										opt === "center" ? undefined : opt,
								})
							}
							className={`flex-1 py-1 capitalize transition-colors ${
								(cfg.titleAlign ?? "center") === opt
									? "bg-indigo-500 font-medium text-white"
									: "bg-white text-stone-600 hover:bg-stone-50"
							}`}
						>
							{opt}
						</button>
					))}
				</div>
			</div>
			<div>
				<label className="mb-1 block font-semibold text-stone-600 text-xs">
					Title Offset (px)
				</label>
				<DraftNumberInput
					value={cfg.titleOffset ?? (axis === "x" ? 3 : 0)}
					onCommit={(n) => onChange({ titleOffset: n })}
				/>
			</div>
			{onReset && (
				<div className="pt-1">
					<ResetButton onReset={onReset} />
				</div>
			)}
		</div>
	);
}
