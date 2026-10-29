import type { PermissionGrant } from "@semoss/sdk";
import { UsageLimitEditButton } from "@/features/bulk-access-management/usage-limit-edit-button";
import { UsageLimitSummary } from "@/features/bulk-access-management/usage-limit-summary";

/** Props for {@link TeamUsageLimitCell}. */
export interface TeamUsageLimitCellProps {
	/** The team's name, for the button's accessible name */
	teamName: string;
	/** The team's access on the model, with its limit, or null when it is not known */
	grant: PermissionGrant | null;
	/** Whether the access is being read, so a limit not known yet is loading */
	isLoading: boolean;
	/** Why the user cannot change the limit, or null when they can */
	readOnlyReason: string | null;
	/** Whether the limit cannot be opened now, such as while the access is read or changed */
	disabled?: boolean;
	/** Called to open the team's limit */
	onEdit: () => void;
}

/**
 * A team's usage limit in the Teams table on a model: its one-line summary, as
 * a button with a pencil that opens the limit for the people who can change it, or with the
 * reason they cannot. The summary reads the same as in Bulk Access Management.
 */
export const TeamUsageLimitCell = ({
	teamName,
	grant,
	isLoading,
	readOnlyReason,
	disabled = false,
	onEdit,
}: TeamUsageLimitCellProps) => {
	if (!grant) {
		return (
			<span className="text-muted-foreground">
				{isLoading ? "Loading..." : "Unknown"}
			</span>
		);
	}
	const summary = (
		<UsageLimitSummary
			limit={grant.usageLimit}
			isChanged={false}
			source="TEAM"
		/>
	);
	if (readOnlyReason) {
		return (
			<span className="flex max-w-64 flex-col gap-0.5 whitespace-normal">
				{summary}
				<span className="text-muted-foreground text-xs">
					{readOnlyReason}
				</span>
			</span>
		);
	}
	return (
		<UsageLimitEditButton
			disabled={disabled}
			context={`Usage limit for ${teamName}`}
			onClick={onEdit}
		>
			{summary}
		</UsageLimitEditButton>
	);
};
