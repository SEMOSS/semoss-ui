import {
	DEFAULT_WORLDMAP_STYLING,
	type WorldMapStyling,
} from "@/types/dashboard";
import { ResetButton } from "../shared/ResetButton";

type MarkerSizeValue = Pick<
	WorldMapStyling,
	"markerSize" | "markerSizeMin" | "markerSizeMax"
>;

interface MarkerSizeControlProps {
	value?: MarkerSizeValue;
	onChange: (value: MarkerSizeValue) => void;
	onReset: () => void;
	/** When true, the user has configured a Size column. The baseline `markerSize`
	 *  slider is disabled (it's only used as a fallback when no Size column exists).
	 *  When false, the min/max sliders are disabled (they only matter when scaling
	 *  marker radii from a Size column). */
	hasSizeColumn?: boolean;
}

/** Marker-size sliders for World Map.
 *  `markerSize` is the baseline radius used when no Size column drives sizing;
 *  `markerSizeMin` / `markerSizeMax` clamp the linear scale when a Size column
 *  IS configured. The unused slider for the current state is disabled. */
export function MarkerSizeControl({
	value,
	onChange,
	onReset,
	hasSizeColumn = false,
}: MarkerSizeControlProps) {
	const v: Required<MarkerSizeValue> = {
		markerSize: value?.markerSize ?? DEFAULT_WORLDMAP_STYLING.markerSize,
		markerSizeMin:
			value?.markerSizeMin ?? DEFAULT_WORLDMAP_STYLING.markerSizeMin,
		markerSizeMax:
			value?.markerSizeMax ?? DEFAULT_WORLDMAP_STYLING.markerSizeMax,
	};

	const update = <K extends keyof MarkerSizeValue>(
		field: K,
		val: MarkerSizeValue[K],
	) => {
		onChange({ ...v, [field]: val });
	};

	// Tailwind reusable styles for the disabled state
	const disabledLabelCls = "text-stone-400";
	const sliderDisabledCls = "opacity-40 cursor-not-allowed";

	return (
		<div className="space-y-4">
			{/* Baseline radius — used when no Size column is configured */}
			<div>
				<label
					className={`mb-1.5 block font-semibold text-xs ${
						hasSizeColumn ? disabledLabelCls : "text-stone-600"
					}`}
				>
					Marker Size{" "}
					<span className="font-normal text-stone-400">
						({v.markerSize}px)
					</span>
				</label>
				<input
					type="range"
					min={3}
					max={30}
					value={v.markerSize}
					disabled={hasSizeColumn}
					onChange={(e) =>
						update("markerSize", Number(e.target.value))
					}
					className={`w-full accent-indigo-500 ${hasSizeColumn ? sliderDisabledCls : ""}`}
				/>
				<p className="mt-1 text-stone-500 text-xs">
					{hasSizeColumn
						? "Disabled — a Size column is configured, so markers scale by value (see Min/Max)."
						: "Used when no Size column is configured."}
				</p>
			</div>

			{/* Min radius (when Size column drives sizing) */}
			<div>
				<label
					className={`mb-1.5 block font-semibold text-xs ${
						hasSizeColumn ? "text-stone-600" : disabledLabelCls
					}`}
				>
					Min Marker Size{" "}
					<span className="font-normal text-stone-400">
						({v.markerSizeMin}px)
					</span>
				</label>
				<input
					type="range"
					min={2}
					max={Math.max(2, v.markerSizeMax - 1)}
					value={v.markerSizeMin}
					disabled={!hasSizeColumn}
					onChange={(e) =>
						update("markerSizeMin", Number(e.target.value))
					}
					className={`w-full accent-indigo-500 ${!hasSizeColumn ? sliderDisabledCls : ""}`}
				/>
			</div>

			{/* Max radius (when Size column drives sizing) */}
			<div>
				<label
					className={`mb-1.5 block font-semibold text-xs ${
						hasSizeColumn ? "text-stone-600" : disabledLabelCls
					}`}
				>
					Max Marker Size{" "}
					<span className="font-normal text-stone-400">
						({v.markerSizeMax}px)
					</span>
				</label>
				<input
					type="range"
					min={Math.min(40, v.markerSizeMin + 1)}
					max={40}
					value={v.markerSizeMax}
					disabled={!hasSizeColumn}
					onChange={(e) =>
						update("markerSizeMax", Number(e.target.value))
					}
					className={`w-full accent-indigo-500 ${!hasSizeColumn ? sliderDisabledCls : ""}`}
				/>
				<p className="mt-1 text-stone-500 text-xs">
					{hasSizeColumn
						? "Min/Max scale markers based on the Size column values."
						: "Disabled — drop a column into the Size zone to enable."}
				</p>
			</div>

			<div className="flex justify-end pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
