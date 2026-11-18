import { useMemo } from "react";
import { Button } from "@semoss/ui/next";
import { getAutomaticColor, parseColor } from "../topic-color";
import "./topic-color-picker.css";

interface TopicColorPickerProps {
	/** Current color value (hex format or empty string for automatic) */
	value: string;
	/** Topic ID for previewing automatic color */
	topicId: string;
	/** Called when user changes the color */
	onChange: (color: string) => void;
	/** Label for the color input */
	label?: string;
	/** Whether the input is disabled */
	disabled?: boolean;
}

export function TopicColorPicker({
	value,
	topicId,
	onChange,
	label = "Color",
	disabled = false,
}: TopicColorPickerProps) {
	// Determine the display color: custom or automatic
	const displayColor = useMemo(() => {
		if (value?.trim()) {
			return value;
		}
		return getAutomaticColor(topicId);
	}, [value, topicId]);

	// Handle "Reset to automatic" button
	const handleReset = () => {
		onChange("");
	};

	const isUnset = !value || !value.trim();

	return (
		<div className="space-y-3">
			<label className="block font-medium text-foreground text-sm">
				{label}
				{isUnset && (
					<span className="ml-2 text-muted-foreground text-xs">
						(Automatic)
					</span>
				)}
				<div className="mt-3 flex flex-wrap items-center gap-3">
					{/* Color swatch input (round) */}
					<div className="flex items-center gap-2">
						<input
							type="color"
							value={displayColor}
							onChange={(e) =>
								onChange(parseColor(e.target.value) ?? "")
							}
							disabled={disabled}
							className="topic-color-swatch"
							aria-label="Color swatch picker"
							title="Click to pick a color"
						/>
					</div>

					{/* Selected color code display as text */}
					<div className="flex items-center gap-2">
						<span className="font-mono text-foreground text-sm">
							{displayColor}
						</span>
					</div>

					{/* Reset button */}
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={handleReset}
						disabled={disabled || isUnset}
						className="ml-auto"
						aria-label="Reset to automatic color"
					>
						Reset
					</Button>
				</div>
			</label>

			{/* Help text */}
			<div className="text-muted-foreground text-xs">
				{isUnset
					? "Using automatic color based on topic ID"
					: "Using custom color"}
			</div>
		</div>
	);
}
