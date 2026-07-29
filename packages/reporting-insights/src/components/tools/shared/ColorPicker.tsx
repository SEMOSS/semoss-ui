import { Check, PaintBucket, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui";

interface ColorPickerProps {
	label: string;
	value: string;
	onChange: (color: string) => void;
	defaultColor?: string;
}

const isValidHex = (s: string) => /^#[0-9A-Fa-f]{6}$/.test(s);

export function ColorPicker({
	label,
	value,
	onChange,
	defaultColor = "#000000",
}: ColorPickerProps) {
	const confirmed = value || defaultColor;
	const [inputVal, setInputVal] = useState(confirmed);
	const [open, setOpen] = useState(false);

	// Sync when the external value changes while the picker is closed (e.g. on reset)
	useEffect(() => {
		if (!open) setInputVal(confirmed);
	}, [confirmed, open]);

	const previewColor = isValidHex(inputVal) ? inputVal : confirmed;

	const openPicker = () => {
		setInputVal(confirmed);
		setOpen(true);
	};

	const confirm = () => {
		if (isValidHex(inputVal)) onChange(inputVal);
		else setInputVal(confirmed);
		setOpen(false);
	};

	const cancel = () => {
		setInputVal(confirmed);
		setOpen(false);
	};

	return (
		<div className="space-y-1.5">
			<label className="block font-semibold text-stone-600 text-xs">
				{label}
			</label>

			{/* Input row */}
			<div className="flex items-center gap-2">
				{/* Confirmed color swatch */}
				<div
					className="h-7 w-7 flex-shrink-0 rounded border border-stone-200"
					style={{ backgroundColor: confirmed }}
				/>
				<Input
					type="text"
					value={inputVal}
					onFocus={() => {
						if (!open) openPicker();
					}}
					onChange={(e) => {
						setInputVal(e.target.value);
						if (!open) setOpen(true);
					}}
					placeholder="#000000"
					className="flex-1 rounded border border-stone-200 px-3 py-2 font-mono text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				/>
				<button
					type="button"
					onClick={() => (open ? cancel() : openPicker())}
					className="rounded border border-stone-200 p-2 transition-colors hover:bg-stone-50"
				>
					<PaintBucket className="h-4 w-4 text-stone-600" />
				</button>
			</div>

			{/* Picker panel — same layout as the ColorPalette single-color flow */}
			{open && (
				<div className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
					<Input
						type="color"
						value={previewColor}
						onChange={(e) => setInputVal(e.target.value)}
						className="h-32 w-full cursor-pointer rounded"
					/>
					<div className="mt-3 flex justify-end gap-2">
						<button
							type="button"
							onClick={cancel}
							className="p-1 text-stone-400 hover:text-stone-600"
						>
							<X className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={confirm}
							disabled={!isValidHex(inputVal)}
							className="p-1 text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
						>
							<Check className="h-4 w-4" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
