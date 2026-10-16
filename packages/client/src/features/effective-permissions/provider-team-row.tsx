import { Info, UsersRound } from "lucide-react";
import type { UnlistedTeam } from "@semoss/sdk";
import {
	getUsageSourceLabel,
	LoginTypeLabel,
	ModelUsageLimitRules,
} from "@semoss/shared";
import { Avatar, TableCell, TableRow } from "@semoss/ui/next";
import { getLevelLabel } from "@/features/bulk-access-management/permission-batch";
import { useTeamTypeName } from "@/features/team-type/use-team-type-name";

export interface ProviderTeamRowProps {
	/** The team, which mirrors a group in a login provider */
	team: UnlistedTeam;
	/** Whether the target is a model, so the row shows the team limit */
	isModel?: boolean;
	/** Whether the table has a last column for each person's limits */
	hasActionsColumn?: boolean;
}

/**
 * A team whose members come from a login provider, as one row of the
 * Effective Permissions table: this app does not keep who is in it, so its
 * members cannot be listed one by one, and the row says so. On a model it
 * shows the team limit that applies to its members' calls when nothing more
 * specific applies to them.
 */
export const ProviderTeamRow = ({
	team,
	isModel = false,
	hasActionsColumn = false,
}: ProviderTeamRowProps) => {
	const providerName = useTeamTypeName(team.type);

	return (
		<TableRow className="bg-muted/30">
			<TableCell className="pl-6">
				<div className="flex items-center gap-2">
					<Avatar className="items-center justify-center bg-muted text-muted-foreground">
						<UsersRound className="size-4" aria-hidden />
					</Avatar>
					<span className="flex min-w-0 flex-col">
						<span className="truncate font-semibold text-sm">
							{team.id}
						</span>
						<span className="text-muted-foreground text-xs">
							Team
						</span>
					</span>
				</div>
			</TableCell>
			<TableCell>
				<LoginTypeLabel
					type={team.type}
					name={providerName}
					className="text-sm"
				/>
			</TableCell>
			<TableCell className="font-medium">
				{getLevelLabel(team.level)}
			</TableCell>
			<TableCell className="min-w-56 whitespace-normal">
				<span className="flex items-start gap-1.5 text-muted-foreground text-sm">
					<Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
					Everyone in this {providerName} group gets this access. Its
					members are managed in {providerName}, so they cannot be
					listed one by one.
				</span>
			</TableCell>
			{isModel ? (
				<>
					<TableCell className="min-w-40 whitespace-normal text-sm">
						{team.usageLimit ? (
							getUsageSourceLabel("TEAM", team.id)
						) : (
							<span className="text-muted-foreground">
								No Limit Defined
							</span>
						)}
					</TableCell>
					<TableCell className="min-w-52 whitespace-normal text-sm">
						<ModelUsageLimitRules
							limit={team.usageLimit}
							source="TEAM"
						/>
					</TableCell>
				</>
			) : null}
			{hasActionsColumn ? <TableCell /> : null}
		</TableRow>
	);
};
