import { useRef } from "react";
import { Input } from "@/components/ui";

interface ColorPickerProps {
	label: string;
	value: string;
	onChange: (color: string) => void;
	defaultColor?: string;
}

export function ColorPicker({
	label,
	value,
	onChange,
	defaultColor = "#000000",
}: ColorPickerProps) {
	const colorInputRef = useRef<HTMLInputElement>(null);
	const displayColor = value || defaultColor;

	return (
		<div className="space-y-1.5">
			<label className="block font-semibold text-stone-600 text-xs">
				{label}
			</label>
			<div className="flex items-center gap-2">
				{/* Color swatch button */}
				<button
					type="button"
					onClick={() => colorInputRef.current?.click()}
					className="relative h-10 w-10 flex-shrink-0 cursor-pointer overflow-hidden rounded border-2 border-stone-200 transition-colors hover:border-stone-300"
					style={{ backgroundColor: displayColor }}
					title={`Current color: ${displayColor}`}
				>
					{/* Checkerboard pattern for transparency visualization */}
					<div
						className="absolute inset-0 opacity-20"
						style={{
							backgroundImage:
								"repeating-conic-gradient(#94a3b8 0% 25%, transparent 0% 50%) 50% / 8px 8px",
						}}
					/>
				</button>

				{/* Hex input */}
				<Input
					type="text"
					value={displayColor}
					onChange={(e) => {
						const val = e.target.value;
						// Allow # and hex characters
						if (/^#[0-9A-Fa-f]{0,6}$/.test(val) || val === "") {
							onChange(val);
						}
					}}
					placeholder="#000000"
					className="flex-1 rounded border border-stone-200 px-3 py-2 font-mono text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				/>

				{/* Hidden native color picker (triggered by swatch button) */}
				<input
					ref={colorInputRef}
					type="color"
					value={displayColor}
					onChange={(e) => onChange(e.target.value)}
					className="sr-only"
				/>
			</div>
		</div>
	);
}
