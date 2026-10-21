import { useEffect, useId, useState } from "react";
import type {
	AccessLevel,
	PermissionsToCopy,
	PermissionTargetResource,
	TeamRole,
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
	FieldLegend,
	FieldSet,
	Label,
	RadioGroup,
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
import { CopySourceOption } from "./copy-source-option";
import { canCopyFrom, useTeamPeopleToCopy } from "./use-team-people-to-copy";

/** The most teams the picker lists */
const TEAM_LIMIT = 200;

/** A team's lists that can go into a team's members or managers */
const TEAM_LISTS: readonly TeamRole[] = ["MEMBERS", "MANAGERS"];

/** The one list of a team that can go into a project or an engine */
const MEMBERS_ONLY: readonly TeamRole[] = ["MEMBERS"];

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
	 * Called with the people copied, the team's name, and the level each gets
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
 * Copies people from a custom team into a permission batch. The team is picked
 * first, from every team the user can copy from (on a team, this one too), and
 * then which of its lists to copy: each is a card that says how many people it
 * holds and how many are new, and is disabled when it is empty, when everyone
 * in it is already there, when it cannot be read, or when it is the list being
 * changed. So a team's managers can become its members, or the other way round,
 * in one step. On a project or engine only a team's members can be copied, and
 * each gets their own access at the level chosen, which they keep if they
 * later leave the team. The teams listed are the ones the user manages and the
 * ones that already have access to the target; in admin mode, every custom
 * team. Give it a new key each time it opens so it starts empty.
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
	const optionId = useId();
	const isManagers = target.resourceType === "TEAM_MANAGERS";
	const isTeamTarget = target.resourceType === "TEAM" || isManagers;
	const targetRole: TeamRole = isManagers ? "MANAGERS" : "MEMBERS";
	// null until the user's teams are read
	const [managedTeams, setManagedTeams] = useState<string[] | null>(null);
	const [team, setTeam] = useState("");
	// the list the user picked; until they pick, the best one is chosen for them
	const [pickedRole, setPickedRole] = useState<TeamRole | null>(null);
	const [level, setLevel] = useState<AccessLevel>("READ_ONLY");
	const [error, setError] = useState<string | null>(null);
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
					setManagedTeams([]);
					setError(getErrorMessage(e, "Could not load your teams"));
				}
			});
		return () => {
			isStale = true;
		};
	}, [open, admin]);

	// every team the user can copy from, whatever is copied from it
	const teams = [
		...new Set([
			...teamsWithAccess,
			...(managedTeams ?? []),
			...(isTeamTarget ? [target.id] : []),
		]),
	].sort((a, b) => a.localeCompare(b));

	const sources = useTeamPeopleToCopy(
		team,
		target,
		isTeamTarget ? TEAM_LISTS : MEMBERS_ONLY,
		admin,
	);
	const usableRoles = sources
		.filter(canCopyFrom)
		.map((source) => source.role);
	// the matching list first, so members go to members unless they cannot
	const preferredRoles: TeamRole[] = isTeamTarget
		? [targetRole, targetRole === "MEMBERS" ? "MANAGERS" : "MEMBERS"]
		: ["MEMBERS"];
	const role =
		pickedRole !== null && usableRoles.includes(pickedRole)
			? pickedRole
			: (preferredRoles.find((candidate) =>
					usableRoles.includes(candidate),
				) ?? null);
	const chosen = sources.find((source) => source.role === role) ?? null;
	const newCount = chosen?.newRows.length ?? 0;

	const handleTeamChange = (value: string) => {
		setTeam(value);
		setPickedRole(null);
	};

	const handleRoleChange = (value: string) => {
		const picked = TEAM_LISTS.find((candidate) => candidate === value);
		if (picked) {
			setPickedRole(picked);
		}
	};

	const handleCopy = () => {
		if (!chosen) {
			return;
		}
		onCopy(chosen.rows, team, isTeamTarget ? undefined : level);
		onClose();
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					onClose();
				}
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						{isTeamTarget
							? `Copy People Into ${isManagers ? "Managers" : "Members"}`
							: "Copy People From a Team"}
					</DialogTitle>
					<DialogDescription>
						{isTeamTarget
							? `Bring in the members or the managers of a team, this one included, as ${isManagers ? "managers" : "members"} of this team.`
							: "Each member of the team you choose gets their own access at the level below. They keep it even if they leave the team. To give access through the team instead, use Add Team."}{" "}
						Nothing is saved until you review and apply your
						changes.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-2">
					<Label htmlFor={teamId}>Team</Label>
					<Select value={team} onValueChange={handleTeamChange}>
						<SelectTrigger id={teamId} className="w-full">
							<SelectValue placeholder="Choose a team" />
						</SelectTrigger>
						<SelectContent>
							{teams.length === 0 ? (
								<div className="px-2 py-1.5 text-muted-foreground text-sm">
									{managedTeams === null
										? "Loading teams..."
										: "No teams to copy from"}
								</div>
							) : (
								teams.map((name) => (
									<SelectItem key={name} value={name}>
										{isTeamTarget && name === target.id
											? `${name} (this team)`
											: name}
									</SelectItem>
								))
							)}
						</SelectContent>
					</Select>
				</div>

				{team ? (
					<FieldSet>
						{/* the same space under it as under the Team label */}
						<FieldLegend variant="label" className="mb-2">
							Copy From {team}
						</FieldLegend>
						<RadioGroup
							value={role ?? ""}
							onValueChange={handleRoleChange}
							className={
								isTeamTarget ? "sm:grid-cols-2" : undefined
							}
						>
							{sources.map((source) => (
								<CopySourceOption
									key={source.role}
									source={source}
									id={`${optionId}-${source.role}`}
								/>
							))}
						</RadioGroup>
					</FieldSet>
				) : null}

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
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={chosen === null}
						onClick={handleCopy}
					>
						{chosen === null
							? "Copy People"
							: `Copy ${newCount} ${newCount === 1 ? "Person" : "People"}`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
