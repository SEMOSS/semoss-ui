import { useState } from "react";
import { Label, Textarea } from "@semoss/ui/next";
import type { JobBuilder } from "./job.types";

const TagInput = (props: {
	label: string;
	values: string[];
	onChange: (vals: string[]) => void;
}) => {
	const { label, values, onChange } = props;
	const [input, setInput] = useState("");

	const addTag = (val: string) => {
		const trimmed = val.trim().replace(/,$/, "");
		if (trimmed && !values.includes(trimmed)) {
			onChange([...values, trimmed]);
		}
		setInput("");
	};

	const removeTag = (tag: string) => {
		onChange(values.filter((v) => v !== tag));
	};

	return (
		<div className="flex flex-col gap-1">
			<Label className="text-xs">{label}</Label>
			<div className="flex min-h-9 flex-wrap gap-1 rounded-md border px-2 py-1 focus-within:ring-1 focus-within:ring-ring">
				{values.map((tag) => (
					<span
						key={tag}
						className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs"
					>
						{tag}
						<button
							type="button"
							className="text-muted-foreground hover:text-foreground"
							onClick={() => removeTag(tag)}
						>
							×
						</button>
					</span>
				))}
				<input
					className="min-w-[80px] flex-1 bg-transparent text-sm outline-none"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === ",") {
							e.preventDefault();
							addTag(input);
						} else if (
							e.key === "Backspace" &&
							!input &&
							values.length > 0
						) {
							onChange(values.slice(0, -1));
						}
					}}
					onBlur={() => input && addTag(input)}
					placeholder={
						values.length === 0 ? "Type and press Enter" : ""
					}
				/>
			</div>
		</div>
	);
};

export const JobTypesCustomJobBuilder = (props: {
	builder: JobBuilder;
	setBuilderField: (field: string, value: string | string[]) => void;
}) => {
	const { builder, setBuilderField } = props;
	return (
		<div className="flex w-full flex-col gap-4">
			<div className="flex flex-col gap-1">
				<Label className="text-xs">Pixel</Label>
				<Textarea
					value={builder.pixel}
					onChange={(e) => setBuilderField("pixel", e.target.value)}
					rows={3}
				/>
			</div>
			<TagInput
				label="Tags"
				values={(builder.tags as string[]) ?? []}
				onChange={(vals) => setBuilderField("tags", vals)}
			/>
		</div>
	);
};
