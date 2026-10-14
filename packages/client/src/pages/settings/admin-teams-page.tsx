import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Navigate } from "react-router";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import {
	getTeams,
	getTeamsCount,
	type TeamSummary,
	toTeamSummaries,
} from "@/api/teams";
import { DeleteTeamDialog } from "@/features/team-delete/delete-team-dialog";
import { TeamFormDialog } from "@/features/team-form/team-form-dialog";
import { TeamList } from "@/features/team-list/team-list";
import {
	getAdminTeamPath,
	MANAGED_TEAMS_PATH,
} from "@/features/team-list/team-paths";
import { useSession } from "@/hooks/use-session";
import { useNavigate } from "@/hooks/useNavigate";

/** Which team the form is open for: null to create one */
interface FormTarget {
	team: TeamSummary | null;
}

/**
 * Every team, for admins: create, edit and delete teams, and open one to
 * manage its members, managers and access.
 */
export const AdminTeamsPage = () => {
	const navigate = useNavigate();
	// the signed in role, not the admin mode preference, decides who sees this page
	const isAdmin = useSession((state) => state.user.admin);
	const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<TeamSummary | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);

	const loadTeams = useCallback(
		async (searchTerm: string, limit: number, offset: number) =>
			toTeamSummaries(await getTeams(true, searchTerm, limit, offset)),
		[],
	);
	const countTeams = useCallback(
		async (searchTerm: string) =>
			Number(await getTeamsCount(true, searchTerm)),
		[],
	);

	if (!isAdmin) {
		return <Navigate to={MANAGED_TEAMS_PATH} replace />;
	}

	return (
		<>
			<TeamList
				loadTeams={loadTeams}
				countTeams={countTeams}
				getTeamPath={getAdminTeamPath}
				refreshKey={refreshKey}
				emptyTitle="No teams yet"
				emptyDescription="Create a team to give a group of people the same access to projects and engines."
				actions={
					<Button onClick={() => setFormTarget({ team: null })}>
						<Plus className="size-4" aria-hidden />
						New Team
					</Button>
				}
				renderRowActions={(team) => (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={`Actions for ${team.id}`}
							>
								<MoreHorizontal
									className="size-4"
									aria-hidden
								/>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onSelect={() => setFormTarget({ team })}
							>
								<Pencil className="size-4" aria-hidden />
								Edit
							</DropdownMenuItem>
							<DropdownMenuItem
								className="text-destructive focus:text-destructive"
								onSelect={() => setDeleteTarget(team)}
							>
								<Trash2 className="size-4" aria-hidden />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			/>

			{formTarget ? (
				<TeamFormDialog
					key={
						formTarget.team
							? `${formTarget.team.type}:${formTarget.team.id}`
							: "new"
					}
					open
					team={formTarget.team}
					onClose={(saved) => {
						const isCreate = formTarget.team === null;
						setFormTarget(null);
						if (!saved) {
							return;
						}
						if (isCreate) {
							navigate(getAdminTeamPath(saved));
						} else {
							setRefreshKey((key) => key + 1);
						}
					}}
				/>
			) : null}

			<DeleteTeamDialog
				team={deleteTarget}
				onClose={(deleted) => {
					setDeleteTarget(null);
					if (deleted) {
						setRefreshKey((key) => key + 1);
					}
				}}
			/>
		</>
	);
};
