import { useId } from "react";
import { Field, FieldLabel, Input, Muted, Textarea } from "@semoss/ui/next";

type EmailArgument = "to" | "cc" | "bcc" | "subject" | "message";

const ADDRESS_FIELDS: { name: EmailArgument; label: string }[] = [
	{ name: "to", label: "To" },
	{ name: "cc", label: "Cc" },
	{ name: "bcc", label: "Bcc" },
];

// recipients may arrive as one comma separated value or as several
function text(value: unknown): string {
	if (Array.isArray(value))
		return value
			.filter((item): item is string => typeof item === "string")
			.join(", ");
	return typeof value === "string" ? value : "";
}

interface EmailToolFieldsProps {
	parameters: Record<string, unknown>;
	disabled: boolean;
	onChange: (next: Record<string, unknown>) => void;
}

/** The mail tool's arguments as an email: what is approved is what is shown here. */
export function EmailToolFields({
	parameters,
	disabled,
	onChange,
}: EmailToolFieldsProps) {
	const id = useId();
	const isHtml = parameters.html === true || parameters.html === "true";
	const update = (name: EmailArgument, value: string) => {
		const next = { ...parameters };
		// clearing an optional field leaves it out of the call
		if (value) next[name] = value;
		else delete next[name];
		onChange(next);
	};
	return (
		<div className="space-y-4">
			{ADDRESS_FIELDS.map(({ name, label }) => (
				<Field key={name}>
					<FieldLabel htmlFor={`${id}-${name}`}>{label}</FieldLabel>
					<Input
						id={`${id}-${name}`}
						type="text"
						inputMode="email"
						autoComplete="off"
						placeholder="name@example.com, ..."
						disabled={disabled}
						value={text(parameters[name])}
						onChange={(event) => update(name, event.target.value)}
					/>
				</Field>
			))}
			<Field>
				<FieldLabel htmlFor={`${id}-subject`}>Subject</FieldLabel>
				<Input
					id={`${id}-subject`}
					type="text"
					disabled={disabled}
					value={text(parameters.subject)}
					onChange={(event) => update("subject", event.target.value)}
				/>
			</Field>
			<Field>
				<FieldLabel htmlFor={`${id}-message`}>Message</FieldLabel>
				{isHtml && (
					<Muted className="text-xs">
						This email is HTML; edit its markup here.
					</Muted>
				)}
				<Textarea
					id={`${id}-message`}
					rows={14}
					disabled={disabled}
					className={isHtml ? "font-mono text-xs" : undefined}
					value={text(parameters.message)}
					onChange={(event) => update("message", event.target.value)}
				/>
			</Field>
		</div>
	);
}
