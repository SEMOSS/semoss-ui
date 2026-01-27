import * as React from "react";
import { Button } from "@semoss/ui/next";

type ChipsInputProps = {
	id?: string;
	value: string[];
	onChange: (next: string[]) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	inputProps?: Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		"value" | "onChange" | "disabled" | "placeholder"
	>;
};

export function ChipsInput({
	id,
	value,
	onChange,
	placeholder = 'Type and press "Enter"',
	disabled,
	className,
	inputProps,
}: ChipsInputProps) {
	const [input, setInput] = React.useState("");

	const addChip = (raw: string) => {
		const chip = raw.trim();
		if (!chip) return;
		if (value.some((v) => v.toLowerCase() === chip.toLowerCase())) {
			setInput("");
			return;
		}
		onChange([...value, chip]);
		setInput("");
	};

	const removeChip = (chip: string) =>
		onChange(value.filter((v) => v !== chip));

	return (
		<div
			className={
				"flex min-h-10 w-full flex-wrap items-center gap-2 rounded-md border px-3 py-2" +
				(disabled
					? "cursor-not-allowed opacity-50"
					: "focus-within:ring-2") +
				(className ?? "")
			}
		>
			{value.map((chip) => (
				<span
					key={chip}
					className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-sm"
				>
					<span className="break-all">{chip}</span>
					<Button
						type="button"
						disabled={disabled}
						onClick={() => removeChip(chip)}
						aria-label={`Remove ${chip}`}
						className="h-5 w-5 min-w-0 rounded-full p-0 leading-none"
					>
						×
					</Button>
				</span>
			))}

			<input
				{...inputProps}
				id={id}
				value={input}
				disabled={disabled}
				placeholder={value.length ? "" : placeholder}
				onChange={(e) => setInput(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === ",") {
						e.preventDefault();
						addChip(input);
					} else if (
						e.key === "Backspace" &&
						!input &&
						value.length
					) {
						onChange(value.slice(0, -1));
					}
				}}
				onBlur={() => addChip(input)}
				className={
					"h-7 min-w-[140px] flex-1 border-0 bg-transparent p-0 outline-none" +
					(inputProps?.className ?? "")
				}
			/>
		</div>
	);
}
