import { Pencil, Trash2 } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { EntityHeader } from "@semoss/shared";
import {
	Button,
	Skeleton,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { DeleteTeamDialog } from "@/features/team-delete/delete-team-dialog";
import { TeamFormDialog } from "@/features/team-form/team-form-dialog";
import {
	ADMIN_TEAMS_PATH,
	getAdminTeamPath,
} from "@/features/team-list/team-paths";
import { TeamTypeBadge } from "@/features/team-type/team-type-badge";
import { useNavigate } from "@/hooks/useNavigate";
import { useTeamDescription } from "./use-team-description";

export interface TeamHeaderProps {
	/** The team's name, which is also its id */
	id: string;
	/** CUSTOM, or the login provider whose group the team mirrors */
	type: string;
	/**
	 * Whether this is the admin's view of the team, which reads it through the
	 * admin endpoints and can edit and delete it. Pass it only for admins.
	 */
	admin: boolean;
	/** The page's own actions, such as the admin mode switch */
	actions?: ReactNode;
}

/**
 * The header of a team's page: its name and type, its description below, and
 * for admins icon buttons that edit or delete the team. Key it by the team so a
 * renamed team starts fresh.
 */
export const TeamHeader = ({ id, type, admin, actions }: TeamHeaderProps) => {
	const navigate = useNavigate();
	const group = useMemo(() => ({ id, type }), [id, type]);
	const [refreshKey, setRefreshKey] = useState(0);
	const { description, isLoading, error, refresh } = useTeamDescription(
		group,
		admin,
		refreshKey,
	);
	// the form starts from the description, so it waits for a successful read
	const canEdit = !isLoading && error === null;
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	return (
		<>
			<EntityHeader
				name={id}
				actions={actions}
				nameAddon={
					<div className="flex items-center gap-1">
						<TeamTypeBadge type={type} />
						{admin ? (
							<>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label="Edit Team"
											disabled={!canEdit}
											onClick={() => setIsEditOpen(true)}
										>
											<Pencil
												className="size-4"
												aria-hidden
											/>
										</Button>
									</TooltipTrigger>
									<TooltipContent>Edit Team</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label="Delete Team"
											className="text-destructive hover:bg-destructive/10 hover:text-destructive"
											onClick={() =>
												setIsDeleteOpen(true)
											}
										>
											<Trash2
												className="size-4"
												aria-hidden
											/>
										</Button>
									</TooltipTrigger>
									<TooltipContent>Delete Team</TooltipContent>
								</Tooltip>
							</>
						) : null}
					</div>
				}
				description={
					isLoading ? (
						<Skeleton className="h-5 w-2/3 max-w-md" />
					) : error ? (
						<div className="flex flex-wrap items-center gap-2">
							<p className="text-destructive text-sm">{error}</p>
							<Button
								variant="outline"
								size="sm"
								onClick={refresh}
							>
								Try Again
							</Button>
						</div>
					) : description ? (
						<p className="wrap-break-word max-w-prose whitespace-pre-wrap text-muted-foreground">
							{description}
						</p>
					) : admin ? (
						<p className="text-muted-foreground">
							No description yet.
						</p>
					) : null
				}
			/>

			{isEditOpen ? (
				<TeamFormDialog
					key={`${type}:${id}`}
					open
					team={{
						id,
						type,
						description,
						dateAdded: null,
						managerSince: null,
						memberCount: null,
					}}
					onClose={(saved) => {
						setIsEditOpen(false);
						if (!saved) {
							return;
						}
						if (saved.id !== id) {
							navigate(getAdminTeamPath(saved), {
								replace: true,
							});
						} else {
							setRefreshKey((key) => key + 1);
						}
					}}
				/>
			) : null}

			<DeleteTeamDialog
				team={isDeleteOpen ? group : null}
				onClose={(deleted) => {
					setIsDeleteOpen(false);
					if (deleted) {
						// the deleted team's page cannot be gone back to
						navigate(ADMIN_TEAMS_PATH, { replace: true });
					}
				}}
			/>
		</>
	);
};
