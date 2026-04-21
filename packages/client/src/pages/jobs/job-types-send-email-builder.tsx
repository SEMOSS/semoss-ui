import { useState } from "react";
import { Input, Label, Textarea } from "@semoss/ui/next";
import type { JobBuilder } from "./job.types";

const TagInput = (props: {
	label: string;
	values: string[];
	onChange: (vals: string[]) => void;
	placeholder?: string;
}) => {
	const { label, values, onChange, placeholder } = props;
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
						values.length === 0
							? (placeholder ?? "Type and press Enter")
							: ""
					}
				/>
			</div>
		</div>
	);
};

const TextField = (props: {
	label: string;
	value: string;
	onChange: (val: string) => void;
	type?: string;
	multiline?: boolean;
	rows?: number;
}) => (
	<div className="flex flex-col gap-1">
		<Label className="text-xs">{props.label}</Label>
		{props.multiline ? (
			<Textarea
				value={props.value}
				onChange={(e) => props.onChange(e.target.value)}
				rows={props.rows ?? 3}
			/>
		) : (
			<Input
				type={props.type ?? "text"}
				value={props.value}
				onChange={(e) => props.onChange(e.target.value)}
			/>
		)}
	</div>
);

export const JobTypesSendEmailBuilder = (props: {
	builder: JobBuilder;
	setBuilderField: (field: string, value: string | string[]) => void;
}) => {
	const { builder, setBuilderField } = props;
	return (
		<div className="flex w-full flex-col gap-4">
			<TagInput
				label="Tags"
				values={(builder.tags as string[]) ?? []}
				onChange={(vals) => setBuilderField("tags", vals)}
			/>
			<TextField
				label="SMTP Host"
				value={builder.smtpHost}
				onChange={(val) => setBuilderField("smtpHost", val)}
			/>
			<TextField
				label="SMTP Port"
				value={builder.smtpPort}
				onChange={(val) => setBuilderField("smtpPort", val)}
			/>
			<TextField
				label="Subject"
				value={builder.subject}
				onChange={(val) => setBuilderField("subject", val)}
			/>
			<TagInput
				label="To"
				values={(builder.to as string[]) ?? []}
				onChange={(vals) => setBuilderField("to", vals)}
				placeholder="Add email and press Enter"
			/>
			<TagInput
				label="CC"
				values={(builder.cc as string[]) ?? []}
				onChange={(vals) => setBuilderField("cc", vals)}
				placeholder="Add email and press Enter"
			/>
			<TagInput
				label="BCC"
				values={(builder.bcc as string[]) ?? []}
				onChange={(vals) => setBuilderField("bcc", vals)}
				placeholder="Add email and press Enter"
			/>
			<TextField
				label="From"
				value={builder.from}
				onChange={(val) => setBuilderField("from", val)}
			/>
			<TextField
				label="Message"
				value={builder.message}
				onChange={(val) => setBuilderField("message", val)}
				multiline
				rows={3}
			/>
			<TextField
				label="User Name"
				value={builder.username}
				onChange={(val) => setBuilderField("username", val)}
			/>
			<TextField
				label="Password"
				value={builder.password}
				onChange={(val) => setBuilderField("password", val)}
				type="password"
			/>
		</div>
	);
};
