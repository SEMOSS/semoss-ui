import {
	Field,
	FieldDescription,
	FieldLabel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

/**
 * Radix Select rejects empty item values, so the nullable columns need a
 * sentinel for their "Not set" option.
 */
export const VALUE_NONE = "__none__";

interface EngineProviderFieldProps {
	/** Field label, also used in the placeholder */
	label: string;

	/** Help text under the select */
	description: string;

	/** The provider chosen, or "" when none is set */
	value: string;

	/** Providers offered, in order */
	options: string[];

	/** Formats a provider for display */
	format: (value: string) => string;

	/** Called with the provider chosen, or "" for Not set */
	onChange: (value: string) => void;

	/** Test id of the select trigger */
	testId: string;
}

/**
 * Select for one of the nullable provider columns. Both are free to be unset,
 * so "Not set" is always offered alongside the curated list.
 */
export const EngineProviderField = ({
	label,
	description,
	value,
	options,
	format,
	onChange,
	testId,
}: EngineProviderFieldProps) => (
	<Field>
		<FieldLabel>{label}</FieldLabel>
		<Select
			value={value !== "" ? value : VALUE_NONE}
			onValueChange={(next) => onChange(next === VALUE_NONE ? "" : next)}
		>
			<SelectTrigger className="w-full" data-testid={testId}>
				<SelectValue placeholder={`Select a ${label.toLowerCase()}`} />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value={VALUE_NONE}>Not set</SelectItem>
				{options.map((option) => (
					<SelectItem key={option} value={option}>
						{format(option)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
		<FieldDescription>{description}</FieldDescription>
	</Field>
);
