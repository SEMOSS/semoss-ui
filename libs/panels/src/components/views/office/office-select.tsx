import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@semoss/ui/next";

interface OfficeSelectProps {
	label: string;
	value: string | null;
	options: readonly { value: string; label: string }[];
	disabled?: boolean;
	onChange: (value: string) => unknown;
}

/** A named editor select that can represent mixed and document-specific values. */
export const OfficeSelect = ({
	label,
	value,
	options,
	disabled,
	onChange,
}: OfficeSelectProps) => {
	const items =
		value && !options.some((option) => option.value === value)
			? [{ value, label: value }, ...options]
			: options;
	const handleChange = async (value: string): Promise<void> => {
		try {
			await onChange(value);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error));
		}
	};
	return (
		<Select
			value={value ?? ""}
			onValueChange={(value) => void handleChange(value)}
			disabled={disabled}
		>
			<SelectTrigger size="sm" aria-label={label} className="max-w-48">
				<SelectValue placeholder={`${label}: mixed`} />
			</SelectTrigger>
			<SelectContent>
				{items.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};
