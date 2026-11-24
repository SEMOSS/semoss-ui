import { formatLocalDateTime } from "@semoss/utility/date";

/** Props for {@link GrantEndDate}. */
export interface GrantEndDateProps {
	/** When the permission ends, as an ISO date and time, or null for never */
	endDate: string | null | undefined;
}

/** When a permission ends, in the viewer's time, or that it has no end date. */
export const GrantEndDate = ({ endDate }: GrantEndDateProps) =>
	formatLocalDateTime(endDate ?? undefined) ?? (
		<span className="text-muted-foreground">No end date</span>
	);
