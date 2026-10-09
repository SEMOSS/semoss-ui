import { useId } from "react";
import { Small, ToggleGroup, ToggleGroupItem } from "@semoss/ui/next";

export type InputMode = "form" | "json";

interface InputModeToggleProps {
	/** Current presentation used to edit the shared value. */
	value: InputMode;
	/** Changes only how the shared value is presented. */
	onValueChange: (value: InputMode) => void;
	/** Prevents switching to the form when the JSON cannot be represented safely. */
	formDisabled?: boolean;
}

/** Switches one node value between guided fields and its raw JSON representation. */
export function InputModeToggle({
	value,
	onValueChange,
	formDisabled = false,
}: InputModeToggleProps) {
	const labelId = useId();

	return (
		<div className="flex flex-wrap items-center justify-between gap-2">
			<Small id={labelId} className="font-medium text-foreground">
				Input format
			</Small>
			<ToggleGroup
				type="single"
				variant="outline"
				size="sm"
				value={value}
				aria-labelledby={labelId}
				onValueChange={(nextValue) => {
					if (nextValue === "form" || nextValue === "json") {
						onValueChange(nextValue);
					}
				}}
			>
				<ToggleGroupItem value="form" disabled={formDisabled}>
					Form
				</ToggleGroupItem>
				<ToggleGroupItem value="json">JSON</ToggleGroupItem>
			</ToggleGroup>
		</div>
	);
}
