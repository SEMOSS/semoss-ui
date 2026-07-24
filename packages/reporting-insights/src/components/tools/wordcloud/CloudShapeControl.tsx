import { Select } from "@/components/ui";
import {
	DEFAULT_WORDCLOUD_STYLING,
	type WordCloudShape,
} from "@/types/dashboard";
import { ResetButton } from "../shared/ResetButton";

interface CloudShapeControlProps {
	value?: WordCloudShape;
	onChange: (value: WordCloudShape) => void;
	onReset: () => void;
}

const SHAPE_OPTIONS: { value: WordCloudShape; label: string }[] = [
	{ value: "rectangle", label: "Rectangle" },
	{ value: "circle", label: "Circle" },
	{ value: "ellipse", label: "Ellipse" },
	{ value: "triangle", label: "Triangle" },
	{ value: "diamond", label: "Diamond" },
	{ value: "pentagon", label: "Pentagon" },
	{ value: "star", label: "Star" },
	{ value: "heart", label: "Heart" },
];

/** Layout shape selector for the Word Cloud.
 *  Rectangle / Circle / Ellipse use d3-cloud's built-in spirals directly;
 *  the polygon shapes (Triangle / Diamond / Pentagon / Star / Heart) lay out
 *  into the bounding box and post-filter placements to the shape silhouette
 *  via a polygon mask in `getLayoutForShape`. */
export function CloudShapeControl({
	value,
	onChange,
	onReset,
}: CloudShapeControlProps) {
	const current = value ?? DEFAULT_WORDCLOUD_STYLING.shape;
	return (
		<div className="space-y-4">
			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Shape
				</label>
				<Select
					value={current}
					onChange={(e) => onChange(e.target.value as WordCloudShape)}
					className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				>
					{SHAPE_OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</Select>
				<p className="mt-1 text-stone-500 text-xs">
					Controls the silhouette the word cloud lays out into.
				</p>
			</div>

			<div className="flex justify-end pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
