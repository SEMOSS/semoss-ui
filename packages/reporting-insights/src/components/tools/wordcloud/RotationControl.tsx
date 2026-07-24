import { Input } from "@/components/ui";
import {
	DEFAULT_WORDCLOUD_STYLING,
	type WordCloudStyling,
} from "@/types/dashboard";
import { ResetButton } from "../shared/ResetButton";

type RotationValue = Pick<
	WordCloudStyling,
	"rotationMin" | "rotationMax" | "rotationStep"
>;

interface RotationControlProps {
	value?: RotationValue;
	onChange: (value: RotationValue) => void;
	onReset: () => void;
}

const MIN_ANGLE = -90;
const MAX_ANGLE = 90;
const MIN_STEP = 1;
const MAX_STEP = 90;

/** Rotation min / max / step controls for the Word Cloud.
 *  Angles are clamped so `min <= max`. Step controls how many discrete angles
 *  are sampled within the range (deterministic per-word selection happens in
 *  the visualization component). */
export function RotationControl({
	value,
	onChange,
	onReset,
}: RotationControlProps) {
	const v: Required<RotationValue> = {
		rotationMin:
			value?.rotationMin ?? DEFAULT_WORDCLOUD_STYLING.rotationMin,
		rotationMax:
			value?.rotationMax ?? DEFAULT_WORDCLOUD_STYLING.rotationMax,
		rotationStep:
			value?.rotationStep ?? DEFAULT_WORDCLOUD_STYLING.rotationStep,
	};

	const updateMin = (next: number) => {
		const clamped = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, next));
		onChange({
			...v,
			rotationMin: clamped,
			rotationMax: Math.max(clamped, v.rotationMax),
		});
	};
	const updateMax = (next: number) => {
		const clamped = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, next));
		onChange({
			...v,
			rotationMax: clamped,
			rotationMin: Math.min(clamped, v.rotationMin),
		});
	};
	const updateStep = (next: number) => {
		const clamped = Math.max(MIN_STEP, Math.min(MAX_STEP, next));
		onChange({ ...v, rotationStep: clamped });
	};

	return (
		<div className="space-y-4">
			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Rotation Min{" "}
					<span className="font-normal text-stone-400">
						({v.rotationMin}°)
					</span>
				</label>
				<input
					type="range"
					min={MIN_ANGLE}
					max={MAX_ANGLE}
					value={v.rotationMin}
					onChange={(e) => updateMin(Number(e.target.value))}
					className="w-full accent-indigo-500"
				/>
			</div>

			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Rotation Max{" "}
					<span className="font-normal text-stone-400">
						({v.rotationMax}°)
					</span>
				</label>
				<input
					type="range"
					min={MIN_ANGLE}
					max={MAX_ANGLE}
					value={v.rotationMax}
					onChange={(e) => updateMax(Number(e.target.value))}
					className="w-full accent-indigo-500"
				/>
			</div>

			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Step{" "}
					<span className="font-normal text-stone-400">
						({v.rotationStep}°)
					</span>
				</label>
				<Input
					type="number"
					min={MIN_STEP}
					max={MAX_STEP}
					value={v.rotationStep}
					onChange={(e) =>
						updateStep(Number(e.target.value) || MIN_STEP)
					}
					className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				/>
				<p className="mt-1 text-stone-500 text-xs">
					Discrete angles between Min and Max are sampled at this step
					(e.g. 0°, 30°, 60°, 90°).
				</p>
			</div>

			<div className="flex justify-end pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
