import { Input } from "@semoss/ui/next";

export interface colorPickerProps {
	value: string;
	onChange: (value: string) => void;
}

export function ColorPickerWithSwatch({ value, onChange }: colorPickerProps) {
	return (
		<div className="relative w-full">
			{/* biome-ignore lint/suspicious/noCommentText: original comment text */}
			{/* biome-ignore lint/suspicious/noCommentText: original comment text */}
			// biome-ignore lint/suspicious/noCommentText: original comment text
			// biome-ignore lint/suspicious/noCommentText: JSX comment in text
			node
			{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
			<Input
				id="color-input"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full pr-10"
			/>
			<div className="-translate-y-1/2 absolute top-1/2 right-2 flex items-center">
				<div className="relative h-6 w-6">
					<input
						type="color"
						value={value}
						onChange={(e) => onChange(e.target.value)}
						className="absolute inset-0 h-6 w-6 cursor-pointer opacity-0"
					/>
					<div
						className="h-6 w-6 rounded border border-[#ccc]"
						style={{ backgroundColor: value }}
					/>
				</div>
			</div>
		</div>
	);
}
