import { UserRound } from "lucide-react";
import type { PermissionSource } from "@semoss/sdk";
import { cn } from "@semoss/ui/next";
import { formatLocalDateTime } from "@semoss/utility/date";
import { getLevelLabel } from "@/features/bulk-access-management/permission-batch";
import { CUSTOM_TEAM_TYPE } from "@/features/team-type/team-type";
import { TeamTypeIcon } from "@/features/team-type/team-type-icon";
import { useTeamTypeName } from "@/features/team-type/use-team-type-name";

export interface AccessSourceChipProps {
	/** Where part of a person's access comes from */
	source: PermissionSource;
	/** Whether this source gives the person the access they end up with */
	isEffective: boolean;
}

/**
 * One place a person's access comes from, as a chip: given to them directly,
 * or a team with its type's icon, then the level and when it ends. The sources
 * that give the access they end up with are highlighted.
 */
export const AccessSourceChip = ({
	source,
	isEffective,
}: AccessSourceChipProps) => {
	const teamTypeName = useTeamTypeName(
		source.kind === "TEAM" ? source.type : CUSTOM_TEAM_TYPE,
	);
	const endDate = formatLocalDateTime(
		source.endDate ?? undefined,
		"MMM D, YYYY",
	);

	return (
		<span
			className={cn(
				"inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-xs",
				isEffective
					? "border-primary/30 bg-primary/10 text-foreground"
					: "border-border bg-muted/40 text-muted-foreground",
			)}
		>
			{source.kind === "TEAM" ? (
				<TeamTypeIcon
					type={source.type}
					name={teamTypeName}
					className="size-3.5"
				/>
			) : (
				<UserRound className="size-3.5 shrink-0" aria-hidden />
			)}
			<span className="truncate font-medium">
				{source.kind === "TEAM" ? (
					<>
						<span className="sr-only">Team </span>
						{source.id}
					</>
				) : (
					"Direct"
				)}
			</span>
			<span className="h-3 w-px shrink-0 bg-border" aria-hidden />
			<span className="shrink-0">{getLevelLabel(source.level)}</span>
			{endDate ? (
				<span className="shrink-0 text-muted-foreground">
					until {endDate}
				</span>
			) : null}
		</span>
	);
};
