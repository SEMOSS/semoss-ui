import { useId } from "react";
import {
	Field,
	FieldLabel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { CatalogTypeIcon } from "@/components/shared/catalog-type-icon";
import { ALL_GRANT_TYPES, type GrantTypeOption } from "./grant-types";

/** Props for {@link GrantTypeSelect}. */
export interface GrantTypeSelectProps {
	/** The field's label */
	label: string;
	/** The types offered after All Types */
	options: readonly GrantTypeOption[];
	/** The type chosen, or ALL for every type */
	value: string;
	/** Called with the type chosen, or ALL */
	onChange: (value: string) => void;
	/** Whether the select is disabled */
	disabled?: boolean;
	/** Classes for the field, such as its width */
	className?: string;
}

/**
 * A labeled choice of a project or engine type: All Types, then each type,
 * each with its icon, the chosen one shown in the trigger too. It narrows a
 * picker or filters a list.
 */
export const GrantTypeSelect = ({
	label,
	options,
	value,
	onChange,
	disabled = false,
	className,
}: GrantTypeSelectProps) => {
	const fieldId = useId();
	const chosen = options.find((option) => option.value === value);
	return (
		<Field className={className}>
			<FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
			<Select value={value} disabled={disabled} onValueChange={onChange}>
				<SelectTrigger id={fieldId} className="w-full">
					<SelectValue>
						<span className="flex min-w-0 items-center gap-2">
							<CatalogTypeIcon
								type={chosen ? chosen.value : ALL_GRANT_TYPES}
							/>
							<span className="truncate">
								{chosen ? chosen.label : "All Types"}
							</span>
						</span>
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL_GRANT_TYPES}>
						<span className="flex items-center gap-2">
							<CatalogTypeIcon type={ALL_GRANT_TYPES} />
							All Types
						</span>
					</SelectItem>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							<span className="flex items-center gap-2">
								<CatalogTypeIcon type={option.value} />
								{option.label}
							</span>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</Field>
	);
};
