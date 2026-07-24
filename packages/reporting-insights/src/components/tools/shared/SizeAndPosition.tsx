import {
	AlignCenterHorizontal,
	AlignCenterVertical,
	AlignEndHorizontal,
	AlignEndVertical,
	AlignStartHorizontal,
	AlignStartVertical,
} from "lucide-react";
import { Checkbox, Input, Select } from "@/components/ui";
import { ResetButton } from "./ResetButton";

export interface SizeConfig {
	width?: string;
	height?: string;
	align?: "start" | "center" | "end";
	valign?: "start" | "center" | "end";
	stretch?: boolean;
}

interface SizeAndPositionProps {
	value?: SizeConfig;
	onChange: (value: SizeConfig) => void;
	onReset: () => void;
}

type Unit = "%" | "px" | "vw" | "vh";

/** Split a CSS length string ('320px') into a number + unit for the editor inputs. */
function parseLen(s: string | undefined): { num: string; unit: Unit } {
	if (!s) return { num: "", unit: "%" };
	const m = /^(-?\d*\.?\d+)\s*(%|px|vw|vh)$/.exec(s.trim());
	if (!m) return { num: "", unit: "%" };
	return { num: m[1], unit: m[2] as Unit };
}

/**
 * Size & Position — controls how large the rendered visualization is *inside its
 * panel* and where it sits. Width/height are optional (blank = fill the panel);
 * alignment only has a visible effect when the content is smaller than the panel.
 * Does not touch the flexlayout panel/layout itself.
 */
export function SizeAndPosition({
	value,
	onChange,
	onReset,
}: SizeAndPositionProps) {
	const cur = value ?? {};
	const w = parseLen(cur.width);
	const h = parseLen(cur.height);

	const setWidth = (num: string, unit: Unit) =>
		onChange({
			...cur,
			width: num.trim() === "" ? undefined : `${num}${unit}`,
		});
	const setHeight = (num: string, unit: Unit) =>
		onChange({
			...cur,
			height: num.trim() === "" ? undefined : `${num}${unit}`,
		});

	const inputCls =
		"w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400";
	const unitCls =
		"px-2 py-1.5 text-sm border border-stone-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400";

	const alignBtn = (active: boolean) =>
		`flex-1 flex items-center justify-center py-1.5 rounded border transition-colors ${
			active
				? "border-indigo-400 bg-indigo-50 text-indigo-600"
				: "border-stone-200 text-stone-500 hover:bg-stone-50"
		}`;

	return (
		<div className="space-y-4">
			<p className="text-[11px] text-stone-400">
				Resize the visualization within its panel. Leave a field blank
				to fill the panel. The panel itself is unchanged — drag its
				edges in the layout to resize the panel.
			</p>

			<div className="grid grid-cols-2 gap-3">
				<div>
					<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
						Width
					</label>
					<div className="flex gap-1.5">
						<Input
							type="number"
							placeholder="Fill"
							value={w.num}
							onChange={(e) => setWidth(e.target.value, w.unit)}
							className={inputCls}
						/>
						<Select
							value={w.unit}
							onChange={(e) =>
								setWidth(w.num, e.target.value as Unit)
							}
							className={unitCls}
						>
							<option value="%">%</option>
							<option value="px">px</option>
							<option value="vw">vw</option>
						</Select>
					</div>
				</div>
				<div>
					<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
						Height
					</label>
					<div className="flex gap-1.5">
						<Input
							type="number"
							placeholder="Fill"
							value={h.num}
							onChange={(e) => setHeight(e.target.value, h.unit)}
							className={inputCls}
						/>
						<Select
							value={h.unit}
							onChange={(e) =>
								setHeight(h.num, e.target.value as Unit)
							}
							className={unitCls}
						>
							<option value="%">%</option>
							<option value="px">px</option>
							<option value="vh">vh</option>
						</Select>
					</div>
				</div>
			</div>

			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Horizontal alignment
				</label>
				<div className="flex gap-1.5">
					{(
						[
							["start", AlignStartVertical],
							["center", AlignCenterVertical],
							["end", AlignEndVertical],
						] as const
					).map(([a, Icon]) => (
						<button
							key={a}
							type="button"
							onClick={() => onChange({ ...cur, align: a })}
							className={alignBtn((cur.align ?? "start") === a)}
						>
							<Icon className="h-4 w-4" />
						</button>
					))}
				</div>
			</div>

			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Vertical alignment
				</label>
				<div className="flex gap-1.5">
					{(
						[
							["start", AlignStartHorizontal],
							["center", AlignCenterHorizontal],
							["end", AlignEndHorizontal],
						] as const
					).map(([a, Icon]) => (
						<button
							key={a}
							type="button"
							onClick={() => onChange({ ...cur, valign: a })}
							className={alignBtn((cur.valign ?? "start") === a)}
						>
							<Icon className="h-4 w-4" />
						</button>
					))}
				</div>
			</div>

			<label className="flex cursor-pointer items-start gap-2">
				<Checkbox
					type="checkbox"
					checked={!!cur.stretch}
					onChange={(e) =>
						onChange({
							...cur,
							stretch: e.target.checked || undefined,
						})
					}
					className="mt-0.5 h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500/30"
				/>
				<span className="text-stone-600 text-xs">
					<span className="font-semibold">Stretch to fill</span> —
					expand the visualization to fill the box, ignoring its
					natural shape (round charts become oval; the alignment
					options above are ignored).
				</span>
			</label>

			<div className="pt-1">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
