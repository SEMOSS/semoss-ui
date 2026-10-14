import { Trash2 } from "lucide-react";
import {
	Button,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@semoss/ui/next";
import type { GroupAccessTarget, GroupKey } from "@/api/teams";
import { useGroupManagers } from "@/features/group-managers/use-group-managers";
import { TEAM_RESOURCE_NOUNS } from "@/features/team-resource-access/team-resource-nouns";
import { TeamTypeBadge } from "@/features/team-type/team-type-badge";
import { TeamPeopleManagers } from "./team-people-managers";
import { TeamPeopleMembers } from "./team-people-members";

/** A section heading inside the sheet */
const SECTION_TITLE_CLASS = "font-medium text-sm";

export interface TeamPeopleSheetProps {
	/** The custom team to show, or null to keep the sheet closed */
	team: GroupKey | null;
	/** The project or engine the team has access to, which the people are read through */
	target: GroupAccessTarget;
	/** Whether the viewer can take the team's access away: the resource's owners and admins */
	canRemoveAccess?: boolean;
	/** Called to take the team's access away; the caller confirms it first */
	onRemoveAccess?: () => void;
	/** Called when the sheet closes */
	onClose: () => void;
}

/**
 * Shows who a custom team gives access to: its managers, who decide who is in
 * it, and its members. Read only; the resource's owners can take the team's
 * access away from here.
 */
export const TeamPeopleSheet = ({
	team,
	target,
	canRemoveAccess = false,
	onRemoveAccess,
	onClose,
}: TeamPeopleSheetProps) => {
	const noun = TEAM_RESOURCE_NOUNS[target.resource].singular;
	const { managers, isLoading, error } = useGroupManagers(
		team?.id ?? null,
		false,
		target,
	);

	return (
		<Sheet
			open={team !== null}
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					onClose();
				}
			}}
		>
			<SheetContent className="w-full overflow-y-auto sm:max-w-lg">
				<SheetHeader>
					<div className="flex flex-wrap items-center gap-2 pe-8">
						<SheetTitle className="wrap-break-word min-w-0">
							{team?.id}
						</SheetTitle>
						{team ? <TeamTypeBadge type={team.type} /> : null}
					</div>
					<SheetDescription>
						Everyone in this team can use this {noun}. Its managers
						decide who is in it.
					</SheetDescription>
				</SheetHeader>

				<div className="flex flex-col gap-6 px-4">
					<section className="flex flex-col gap-2">
						<h3 className={SECTION_TITLE_CLASS}>Managers</h3>
						<TeamPeopleManagers
							managers={managers}
							isLoading={isLoading}
							error={error}
						/>
					</section>

					<section className="flex flex-col gap-2">
						<h3 className={SECTION_TITLE_CLASS}>Members</h3>
						{team ? (
							<TeamPeopleMembers
								key={team.id}
								groupId={team.id}
								target={target}
							/>
						) : null}
					</section>
				</div>

				{canRemoveAccess && onRemoveAccess ? (
					<SheetFooter>
						<Button
							type="button"
							variant="outline"
							className="text-destructive hover:bg-destructive/10 hover:text-destructive"
							onClick={onRemoveAccess}
						>
							<Trash2 className="size-4" aria-hidden />
							Remove This Team's Access
						</Button>
					</SheetFooter>
				) : null}
			</SheetContent>
		</Sheet>
	);
};
