import { FormSelect, FormSelectItem } from "@semoss/ui/next";
import { getLevelLabel } from "@/features/bulk-access-management/permission-batch";
import { GRANT_LEVELS } from "./grant-levels";

/** Props for {@link GrantLevelSelect}. */
export interface GrantLevelSelectProps {
	/** Who gets the level and what each level allows there */
	description: string;
	/** Whether the select is disabled, while the form is submitted */
	disabled?: boolean;
}

/**
 * The Permission field of an Add dialog's form, its `level`: Read-Only or
 * Editor, with what each allows in its description. Use it inside a `Form`.
 */
export const GrantLevelSelect = ({
	description,
	disabled = false,
}: GrantLevelSelectProps) => (
	<FormSelect
		name="level"
		label="Permission"
		description={description}
		disabled={disabled}
		triggerClassName="w-full sm:w-56"
	>
		{GRANT_LEVELS.map((level) => (
			<FormSelectItem key={level} value={level}>
				{getLevelLabel(level)}
			</FormSelectItem>
		))}
	</FormSelect>
);
