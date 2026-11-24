import type { AccessLevel } from "@semoss/sdk";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { getLevelLabel } from "@/features/bulk-access-management/permission-batch";
import {
	GRANT_LEVELS,
	type GrantTargetType,
	isGrantLevel,
	summarizeGrantLevel,
} from "./grant-levels";

/** Props for {@link GrantLevelCell}. */
export interface GrantLevelCellProps {
	/** What gives the permission, which decides what the level allows */
	resourceType: GrantTargetType;
	/** The level to show */
	level: AccessLevel;
	/**
	 * Called with the level picked; without it the level is text. A level a
	 * grantee is never given is always text.
	 */
	onChange?: (level: string) => void;
	/** Whether the select is disabled, for someone who cannot change it or while saving */
	disabled?: boolean;
	/** The select's accessible name, such as "Permission for Orders Agent" */
	label: string;
}

/**
 * A permission's level in a table row: a select of Read-Only and Editor, or the
 * level as text, with what the level allows there under it.
 */
export const GrantLevelCell = ({
	resourceType,
	level,
	onChange,
	disabled = false,
	label,
}: GrantLevelCellProps) => {
	const summary = summarizeGrantLevel(resourceType, level);
	return (
		<div className="flex max-w-56 flex-col gap-1 whitespace-normal">
			{onChange && isGrantLevel(level) ? (
				<Select
					value={level}
					disabled={disabled}
					onValueChange={onChange}
				>
					<SelectTrigger
						size="sm"
						className="w-36"
						aria-label={label}
					>
						<SelectValue>{getLevelLabel(level)}</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{GRANT_LEVELS.map((option) => (
							<SelectItem key={option} value={option}>
								{getLevelLabel(option)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			) : (
				<span>{getLevelLabel(level)}</span>
			)}
			{summary ? (
				<span className="text-muted-foreground text-xs">{summary}</span>
			) : null}
		</div>
	);
};
