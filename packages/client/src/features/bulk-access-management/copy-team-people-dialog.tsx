import { useEffect, useId, useState } from "react";
import {
	type AccessLevel,
	getPermissionsToCopy,
	type PermissionsToCopy,
	type PermissionTargetResource,
} from "@semoss/sdk";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { getTeams, toTeamSummaries } from "@/api/teams";
import { GROUP_ACCESS_LEVELS } from "@/features/group-access/group-access-levels";
import { CUSTOM_TEAM_TYPE } from "@/features/team-type/team-type";

/** The most teams the picker lists */
const TEAM_LIMIT = 200;

export interface CopyTeamPeopleDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** The project or engine, or the team's members or managers, being changed */
	target: PermissionTargetResource;
	/**
	 * Whether in admin mode, where any custom team can be copied from; outside
	 * it, the teams the user manages and the teams that have access are listed
	 */
	admin: boolean;
	/** The custom teams that already have access to the target, whose members its owners and editors can see */
	teamsWithAccess: string[];
	/** Whether Author access can be given, for a project or engine */
	canGiveAuthorAccess?: boolean;
	/**
	 * Called with the members copied, the team's name, and the level each gets
	 * on a project or engine
	 */
	onCopy: (
		rows: PermissionsToCopy[],
		teamName: string,
		level?: AccessLevel,
	) => void;
	/** Called when the dialog closes */
	onClose: () => void;
}

/**
 * Copies a custom team's members into a permission batch. On a project or engine, each
 * member gets their own access at the level chosen, which they keep if they
 * later leave the team; on a team, they become its members. When the batch is
 * for a team's managers, the other team's managers are copied and become its
 * managers. The teams listed are the ones the user manages, and the ones that
 * already have access to the target; in admin mode, every custom team. Give it
 * a new key each time it opens so it starts empty.
 */
export const CopyTeamPeopleDialog = ({
	open,
	target,
	admin,
	teamsWithAccess,
	canGiveAuthorAccess = false,
	onCopy,
	onClose,
}: CopyTeamPeopleDialogProps) => {
	const teamId = useId();
	const levelId = useId();
	const isManagers = target.kind === "TEAM_MANAGERS";
	const isTeamTarget = target.kind === "TEAM" || isManagers;
	const [managedTeams, setManagedTeams] = useState<string[]>([]);
	const [team, setTeam] = useState("");
	const [level, setLevel] = useState<AccessLevel>("READ_ONLY");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const levels = canGiveAuthorAccess
		? GROUP_ACCESS_LEVELS
		: GROUP_ACCESS_LEVELS.filter((option) => option.value !== "OWNER");

	useEffect(() => {
		if (!open) {
			return;
		}
		let isStale = false;
		getTeams(admin, undefined, TEAM_LIMIT, 0)
			.then((data) => {
				if (!isStale) {
					setManagedTeams(
						toTeamSummaries(data)
							.filter(
								(summary) => summary.type === CUSTOM_TEAM_TYPE,
							)
							.map((summary) => summary.id),
					);
				}
			})
			.catch((e: unknown) => {
				if (!isStale) {
					setError(getErrorMessage(e, "Could not load your teams"));
				}
			});
		return () => {
			isStale = true;
		};
	}, [open, admin]);

	const teams = [...new Set([...teamsWithAccess, ...managedTeams])]
		.filter((name) => !isTeamTarget || name !== target.id)
		.sort((a, b) => a.localeCompare(b));

	const handleCopy = async () => {
		if (!team) {
			return;
		}
		setIsLoading(true);
		setError(null);
		try {
			const rows = await getPermissionsToCopy(
				{ kind: isManagers ? "TEAM_MANAGERS" : "TEAM", id: team },
				target,
				admin,
			);
			onCopy(rows, team, isTeamTarget ? undefined : level);
		} catch (e) {
			setError(
				getErrorMessage(
					e,
					isManagers
						? "Could not read the team's managers"
						: "Could not read the team's members",
				),
			);
			setIsLoading(false);
			return;
		}
		setIsLoading(false);
		onClose();
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen && !isLoading) {
					onClose();
				}
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						{isManagers
							? "Copy Managers From a Team"
							: isTeamTarget
								? "Copy Members From a Team"
								: "Copy People From a Team"}
					</DialogTitle>
					<DialogDescription>
						{isManagers
							? "Everyone who manages the team you choose becomes a manager of this team too."
							: isTeamTarget
								? "Everyone in the team you choose becomes a member of this team too."
								: "Each member of the team you choose gets their own access at the level below. They keep it even if they leave the team. To give access through the team instead, use Add Team."}{" "}
						Nothing is saved until you review and apply your
						changes.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-2">
					<Label htmlFor={teamId}>Team</Label>
					<Select value={team} onValueChange={setTeam}>
						<SelectTrigger id={teamId} className="w-full">
							<SelectValue placeholder="Choose a team" />
						</SelectTrigger>
						<SelectContent>
							{teams.length === 0 ? (
								<div className="px-2 py-1.5 text-muted-foreground text-sm">
									No teams to copy from
								</div>
							) : (
								teams.map((name) => (
									<SelectItem key={name} value={name}>
										{name}
									</SelectItem>
								))
							)}
						</SelectContent>
					</Select>
				</div>

				{isTeamTarget ? null : (
					<div className="flex flex-col gap-2">
						<Label htmlFor={levelId}>Access Level</Label>
						<Select
							value={level}
							onValueChange={(value) => {
								const option = levels.find(
									(item) => item.value === value,
								);
								if (
									option &&
									(option.value === "OWNER" ||
										option.value === "EDIT" ||
										option.value === "READ_ONLY")
								) {
									setLevel(option.value);
								}
							}}
						>
							<SelectTrigger id={levelId} className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{levels.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				{error ? (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={isLoading}
						onClick={onClose}
					>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={!team || isLoading}
						onClick={handleCopy}
					>
						{isLoading
							? "Copying..."
							: isManagers
								? "Copy Managers"
								: "Copy People"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
