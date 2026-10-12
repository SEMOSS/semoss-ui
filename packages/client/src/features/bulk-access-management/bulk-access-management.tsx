import { Copy, Plus, RefreshCw, Users, UsersRound } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type {
	AccessLevel,
	AccessPerson,
	PermissionBatch,
	PermissionTargetResource,
} from "@semoss/sdk";
import { useIsCurrentLogin } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	toast,
} from "@semoss/ui/next";
import type { TeamSummary } from "@/api/teams";
import { AddGroupAccessDialog } from "@/features/group-access/add-group-access-dialog";
import { GROUP_ACCESS_LEVELS } from "@/features/group-access/group-access-levels";
import { TeamFormDialog } from "@/features/team-form/team-form-dialog";
import { CUSTOM_TEAM_TYPE } from "@/features/team-type/team-type";
import { AccessViewHeader } from "./access-view-header";
import { AddPeopleCard } from "./add-people-card";
import type { BringInAccessItem } from "./bring-in-access-menu";
import { CopyAccessDialog } from "./copy-access-dialog";
import { CopyTeamPeopleDialog } from "./copy-team-people-dialog";
import { DiscardChangesDialog } from "./discard-changes-dialog";
import { describeChangeDetail, getSubjectKey } from "./permission-batch";
import { PermissionBatchConflicts } from "./permission-batch-conflicts";
import { PermissionBatchList } from "./permission-batch-list";
import {
	PermissionBatchReviewDialog,
	type ReviewItem,
} from "./permission-batch-review-dialog";
import { usePermissionBatch } from "./use-permission-batch";
import { useUnsavedChangesGuard } from "./use-unsaved-changes-guard";

/** How much each level gives, so a change can be told to lower someone's access */
const LEVEL_RANK: Readonly<Record<AccessLevel, number>> = {
	OWNER: 3,
	EDIT: 2,
	READ_ONLY: 1,
};

/** The dialog open on Bulk Access Management */
type BulkAccessDialog =
	| "COPY"
	| "COPY_TEAM"
	| "ADD_TEAM"
	| "MAKE_TEAM"
	| "REVIEW"
	| "DISCARD"
	| null;

/** The people to add to a team made from the batch, saved with the batch */
interface NewTeamMembers {
	/** The new team's id */
	teamId: string;
	/** The people to add to it */
	people: AccessPerson[];
}

/** The review's key for adding a person to a team made from the batch */
const getNewMemberKey = (teamId: string, person: AccessPerson): string =>
	`NEW_TEAM_MEMBER:${teamId}:${getSubjectKey(person)}`;

export interface BulkAccessManagementProps {
	/** The project or engine being changed */
	target: PermissionTargetResource;
	/** Its name */
	name: string;
	/** What it is called in sentences, such as "app" or "engine" */
	noun: string;
	/** Where its access page is, relative to Bulk Access Management */
	backTo: string;
	/**
	 * Whether in admin mode, where an admin can make any change and make a team
	 * from the people in the batch; outside it an admin has only their own permissions
	 */
	admin: boolean;
	/** Whether the organization's Microsoft directory can be searched */
	isDirectoryAvailable: boolean;
	/** Whether the target is a model engine, whose people have usage limits */
	isModel?: boolean;
	/** The title's heading level: 3 when the view sits under a page's own heading */
	headingLevel?: 2 | 3;
}

/**
 * Bulk Access Management for a project or engine: see who has access, find people
 * in the app and the organization, copy access from another app, engine or
 * team, settle conflicts, and save every change together after a review.
 */
export const BulkAccessManagement = ({
	target,
	name,
	noun,
	backTo,
	admin,
	isDirectoryAvailable,
	isModel = false,
	headingLevel = 2,
}: BulkAccessManagementProps) => {
	const addLevelId = useId();
	const batch = usePermissionBatch(target, admin);
	const isCurrentLogin = useIsCurrentLogin();
	const [dialog, setDialog] = useState<BulkAccessDialog>(null);
	// a new key each time a dialog opens starts it empty
	const [dialogKey, setDialogKey] = useState(0);
	const [addLevel, setAddLevel] = useState<AccessLevel>("READ_ONLY");
	const [newTeamMembers, setNewTeamMembers] = useState<NewTeamMembers[]>([]);
	const { kind, id } = target;
	const isEngine = kind === "ENGINE";
	const allowedChanges = batch.allowedChanges;
	const canAddPeople =
		allowedChanges?.canChangePeople === true &&
		!allowedChanges.addsAreAdminOnly;
	const levels = allowedChanges?.canGiveAuthorAccess
		? GROUP_ACCESS_LEVELS
		: GROUP_ACCESS_LEVELS.filter((option) => option.value !== "OWNER");

	const stagedKeys = useMemo(
		() =>
			new Set(
				batch.entries
					.filter((entry) => entry.staged)
					.map((entry) => entry.key),
			),
		[batch.entries],
	);
	// the members of a team made from the batch are saved with it, as a batch
	// of their own on the team
	const batches = useMemo<PermissionBatch[]>(
		() => [
			{
				target: { kind, id },
				changes: batch.changes.map((c) => c.change),
			},
			...newTeamMembers.map(
				(team): PermissionBatch => ({
					target: { kind: "TEAM", id: team.teamId },
					changes: team.people.map((person) => ({
						action: "ADD",
						subject: {
							kind: "USER",
							id: person.id,
							type: person.type,
						},
					})),
				}),
			),
		],
		[kind, id, batch.changes, newTeamMembers],
	);
	const entriesByKey = new Map(
		batch.entries.map((entry) => [entry.key, entry]),
	);
	const reviewItems: ReviewItem[] = batch.changes.flatMap(
		(item, changeIndex) => {
			const entry = entriesByKey.get(item.key);
			return entry
				? [
						{
							batchIndex: 0,
							changeIndex,
							key: item.key,
							where: name,
							action: item.change.action,
							name:
								entry.subject.kind === "TEAM"
									? entry.subject.id
									: entry.person?.name ||
										entry.person?.email ||
										entry.subject.id,
							kind: entry.subject.kind,
							type: entry.subject.type,
							id:
								entry.subject.kind === "USER"
									? entry.subject.id
									: undefined,
							email: entry.person?.email,
							detail: describeChangeDetail(
								entry.current,
								item.change.action === "REMOVE"
									? null
									: entry.staged,
							),
						},
					]
				: [];
		},
	);
	const newMemberItems: ReviewItem[] = newTeamMembers.flatMap(
		(team, teamIndex) =>
			team.people.map(
				(person, changeIndex): ReviewItem => ({
					batchIndex: teamIndex + 1,
					changeIndex,
					key: getNewMemberKey(team.teamId, person),
					where: `${team.teamId} team members`,
					action: "ADD",
					name: person.name || person.email || person.id,
					kind: "USER",
					type: person.type,
					id: person.id,
					email: person.email,
					detail: "",
				}),
			),
	);
	// teams already in the batch are left out of Add Team
	const teamsInBatch = new Set(
		batch.entries
			.filter((entry) => entry.subject.kind === "TEAM")
			.map((entry) => `${entry.subject.type}:${entry.subject.id}`),
	);
	const customTeamsWithAccess = batch.entries
		.filter(
			(entry) =>
				entry.subject.kind === "TEAM" &&
				entry.subject.type === CUSTOM_TEAM_TYPE &&
				entry.current,
		)
		.map((entry) => entry.subject.id);
	const stagedPeople = batch.entries.flatMap((entry) =>
		entry.person && entry.staged ? [entry.person] : [],
	);
	const changeCount = batch.changes.length + newMemberItems.length;
	// outside admin mode, someone who lowers or takes away their own access may
	// lose the permission to change this access once the batch is saved
	const lowersOwnAccess =
		!admin &&
		batch.changes.some((item) => {
			const entry = entriesByKey.get(item.key);
			if (
				!entry ||
				entry.subject.kind !== "USER" ||
				!isCurrentLogin(entry.subject.type, entry.subject.id)
			) {
				return false;
			}
			return (
				item.change.action === "REMOVE" ||
				(entry.current !== null &&
					entry.staged !== null &&
					LEVEL_RANK[entry.staged.level] <
						LEVEL_RANK[entry.current.level])
			);
		});
	const hasConflicts = batch.conflicts.length > 0;
	const blocker = useUnsavedChangesGuard(changeCount > 0 || hasConflicts);

	const openDialog = (next: BulkAccessDialog) => {
		setDialogKey((key) => key + 1);
		setDialog(next);
	};

	const bringInItems: BringInAccessItem[] = [
		{
			label: "Copy From an App or Engine",
			icon: Copy,
			disabled: !canAddPeople,
			onSelect: () => openDialog("COPY"),
		},
		{
			label: "Copy People From a Team",
			icon: Users,
			disabled: !canAddPeople,
			onSelect: () => openDialog("COPY_TEAM"),
		},
		...(allowedChanges?.canChangeTeams
			? [
					{
						label: "Add Team",
						icon: Plus,
						onSelect: () => openDialog("ADD_TEAM"),
					},
				]
			: []),
		...(admin
			? [
					{
						label: "Make a Team From These People",
						icon: UsersRound,
						disabled: stagedPeople.length === 0,
						isNewGroup: true,
						onSelect: () => openDialog("MAKE_TEAM"),
					},
				]
			: []),
	];

	const handleAddPerson = (person: AccessPerson) => {
		batch.add([{ subject: person, person }], { level: addLevel });
	};

	const handleCopied = (
		count: { added: number; conflicts: number },
		from: string,
	) => {
		if (count.added === 0 && count.conflicts === 0) {
			toast.info(`Everyone from ${from} already has this access`);
			return;
		}
		const conflicts =
			count.conflicts > 0
				? ` ${count.conflicts} already have different access; choose what to keep.`
				: "";
		toast.success(
			`Added ${count.added} from ${from} to your changes.${conflicts}`,
		);
	};

	// the team is made right away; its members and its access wait for the batch
	const handleTeamMade = (team?: TeamSummary) => {
		setDialog(null);
		if (!team) {
			return;
		}
		const members = team.type === CUSTOM_TEAM_TYPE ? stagedPeople : [];
		if (members.length > 0) {
			setNewTeamMembers((prev) => [
				...prev,
				{ teamId: team.id, people: members },
			]);
		}
		batch.add(
			[
				{
					subject: { kind: "TEAM", id: team.id, type: team.type },
					person: null,
				},
			],
			{ level: "READ_ONLY" },
			members.length > 0
				? `New team, with ${members.length} members to add`
				: "New team",
		);
		toast.success(
			members.length > 0
				? `${team.id} was made. Its ${members.length} members and its Read-Only access are in your changes, and are saved when you apply them.`
				: `${team.id} was made. Its Read-Only access is in your changes, and is saved when you apply them.`,
		);
	};

	const handleDiscard = () => {
		batch.discard();
		setNewTeamMembers([]);
		setDialog(null);
	};

	return (
		<div className="flex w-full flex-col gap-6">
			<AccessViewHeader
				headingLevel={headingLevel}
				title="Bulk Access Management"
				description={
					<>
						Make many changes to who can use {name}. Nothing is
						saved until you review and apply them.
					</>
				}
				backTo={backTo}
				backLabel="Back to Members"
				actions={
					<>
						<Button
							type="button"
							variant="outline"
							disabled={batch.isLoading}
							onClick={batch.refresh}
						>
							<RefreshCw className="size-4" aria-hidden />
							Refresh
						</Button>
						<Button
							type="button"
							variant="outline"
							disabled={changeCount === 0 && !hasConflicts}
							onClick={() => openDialog("DISCARD")}
						>
							Discard Changes
						</Button>
						<Button
							type="button"
							disabled={changeCount === 0 || hasConflicts}
							onClick={() => openDialog("REVIEW")}
						>
							Review Changes ({changeCount})
						</Button>
					</>
				}
			/>

			{batch.error ? (
				<Alert variant="destructive">
					<AlertDescription>{batch.error}</AlertDescription>
				</Alert>
			) : null}

			{allowedChanges &&
			!allowedChanges.canChangePeople &&
			!allowedChanges.canChangeTeams ? (
				<Alert>
					<AlertDescription>
						You can see who has access to this {noun}, but only its
						editors and owners can change it.
					</AlertDescription>
				</Alert>
			) : null}
			{lowersOwnAccess ? (
				<Alert>
					<AlertDescription>
						These changes lower or take away your own access. Once
						they are applied, you may no longer be able to change
						who can use this {noun}.
					</AlertDescription>
				</Alert>
			) : null}
			{allowedChanges?.addsAreAdminOnly ? (
				<Alert>
					<AlertDescription>
						Only admins can give people access to this {noun}, from
						its settings page in admin mode. You can still change or
						take away the access people have.
					</AlertDescription>
				</Alert>
			) : null}

			{!allowedChanges && batch.isLoading ? (
				<output className="flex items-center justify-center gap-2 py-12 text-muted-foreground text-sm">
					<Spinner className="size-4" />
					Loading who has access...
				</output>
			) : allowedChanges ? (
				// the list's column stretches to the card's height, so the two end together
				<div className="flex flex-col gap-6 md:flex-row">
					<div className="flex min-w-0 flex-1 flex-col gap-6">
						{hasConflicts ? (
							<PermissionBatchConflicts
								conflicts={batch.conflicts}
								onResolve={batch.resolveConflict}
								onResolveAll={batch.resolveAllConflicts}
							/>
						) : null}
						<PermissionBatchList
							entries={batch.entries}
							allowedChanges={allowedChanges}
							showModelLimits={isModel}
							onLevelChange={(entry, level) => {
								const base = entry.staged ?? entry.current;
								if (base) {
									batch.setStaged(entry, { ...base, level });
								}
							}}
							onRemove={(entry) => batch.setStaged(entry, null)}
							onRestore={(entry) => batch.restore(entry.key)}
						/>
					</div>

					{/* the search stays in view while the list scrolls */}
					<AddPeopleCard
						className="md:sticky md:top-4 md:w-80 md:shrink-0 md:self-start lg:w-96"
						description="Add people one by one, or use Bring In Access to copy people from an app, engine or team, or to give a whole team access."
						menuItems={bringInItems}
						isDirectoryAvailable={isDirectoryAvailable}
						isStaged={(person) =>
							stagedKeys.has(getSubjectKey(person))
						}
						onAdd={handleAddPerson}
						disabled={!canAddPeople}
					>
						<div className="flex flex-col gap-2">
							<Label htmlFor={addLevelId}>Add With</Label>
							<Select
								value={addLevel}
								disabled={!canAddPeople}
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
										setAddLevel(option.value);
									}
								}}
							>
								<SelectTrigger
									id={addLevelId}
									className="w-full"
								>
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
					</AddPeopleCard>
				</div>
			) : null}

			<CopyAccessDialog
				admin={admin}
				key={`copy-${dialogKey}`}
				open={dialog === "COPY"}
				target={target}
				onCopy={(rows, from) =>
					handleCopied(
						batch.copy(rows, {
							note: `Copied from ${from}`,
							keepModelLimits: isModel,
						}),
						from,
					)
				}
				onClose={() => setDialog(null)}
			/>
			<CopyTeamPeopleDialog
				key={`copy-team-${dialogKey}`}
				open={dialog === "COPY_TEAM"}
				target={target}
				admin={admin}
				teamsWithAccess={customTeamsWithAccess}
				canGiveAuthorAccess={allowedChanges?.canGiveAuthorAccess}
				onCopy={(rows, team, level) =>
					handleCopied(
						batch.copy(rows, {
							note: `Copied from the ${team} team`,
							level,
							keepModelLimits: false,
						}),
						`the ${team} team`,
					)
				}
				onClose={() => setDialog(null)}
			/>
			{allowedChanges?.canChangeTeams ? (
				<AddGroupAccessDialog
					key={`add-team-${dialogKey}`}
					open={dialog === "ADD_TEAM"}
					resource={isEngine ? "ENGINE" : "PROJECT"}
					resourceId={id}
					admin={admin}
					excludedTeams={teamsInBatch}
					onStage={(team, level) => {
						if (level === "DISCOVERABLE") {
							return;
						}
						batch.add(
							[
								{
									subject: {
										kind: "TEAM",
										id: team.id,
										type: team.type,
									},
									person: null,
								},
							],
							{ level },
						);
					}}
					onClose={() => setDialog(null)}
				/>
			) : null}
			{admin ? (
				<TeamFormDialog
					key={`make-team-${dialogKey}`}
					open={dialog === "MAKE_TEAM"}
					team={null}
					onClose={handleTeamMade}
				/>
			) : null}
			<PermissionBatchReviewDialog
				admin={admin}
				key={`review-${dialogKey}`}
				open={dialog === "REVIEW"}
				batches={batches}
				items={[...reviewItems, ...newMemberItems]}
				onApplied={(result) => {
					setDialog(null);
					batch.finishApply();
					setNewTeamMembers([]);
					toast.success(
						result.changes === 1
							? "1 change was saved"
							: `${result.changes} changes were saved`,
					);
				}}
				onLeaveOut={(blocked) => {
					const leftOutMembers = new Set<string>();
					for (const item of blocked) {
						if (item.batchIndex === 0) {
							batch.restore(item.key);
						} else {
							leftOutMembers.add(item.key);
						}
					}
					if (leftOutMembers.size > 0) {
						setNewTeamMembers((prev) =>
							prev
								.map((team) => ({
									...team,
									people: team.people.filter(
										(person) =>
											!leftOutMembers.has(
												getNewMemberKey(
													team.teamId,
													person,
												),
											),
									),
								}))
								.filter((team) => team.people.length > 0),
						);
					}
				}}
				onClose={() => setDialog(null)}
			/>
			<DiscardChangesDialog
				open={dialog === "DISCARD"}
				reason="DISCARD"
				changeCount={changeCount + batch.conflicts.length}
				onConfirm={handleDiscard}
				onCancel={() => setDialog(null)}
			/>
			<DiscardChangesDialog
				open={blocker.state === "blocked"}
				reason="LEAVE"
				changeCount={changeCount + batch.conflicts.length}
				onConfirm={() => blocker.proceed?.()}
				onCancel={() => blocker.reset?.()}
			/>
		</div>
	);
};
