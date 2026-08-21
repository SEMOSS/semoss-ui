import {
	DEFAULT_WORLDMAP_STYLING,
	type WorldMapLayer,
	type WorldMapStyling,
} from "@/types/dashboard";
import { ResetButton } from "../shared/ResetButton";

const LAYER_OPTIONS: { value: WorldMapLayer; label: string }[] = [
	{ value: "streets", label: "Streets" },
	{ value: "openstreet", label: "Open Street" },
	{ value: "satellite-esri", label: "Satellite (ESRI)" },
	{ value: "streets-esri", label: "Streets (ESRI)" },
	{ value: "light", label: "Light" },
	{ value: "city-lights", label: "City Lights" },
	{ value: "dark", label: "Dark" },
	{ value: "topographic", label: "Topographic" },
	{ value: "no-label", label: "No Label" },
	{ value: "none", label: "None" },
];

interface MapLayerControlProps {
	value?: WorldMapStyling["mapLayer"];
	onChange: (layer: WorldMapLayer) => void;
	onReset: () => void;
}

export function MapLayerControl({
	value,
	onChange,
	onReset,
}: MapLayerControlProps) {
	const current = value ?? DEFAULT_WORLDMAP_STYLING.mapLayer;

	return (
		<div className="space-y-3">
			<div className="grid grid-cols-1 gap-1">
				{LAYER_OPTIONS.map(({ value: layerValue, label }) => (
					<button
						key={layerValue}
						onClick={() => onChange(layerValue)}
						className={`w-full rounded-md px-3 py-2 text-left font-medium text-xs transition-colors ${
							current === layerValue
								? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-300"
								: "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
						}`}
					>
						{label}
					</button>
				))}
			</div>
			<div className="flex justify-end pt-1">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
