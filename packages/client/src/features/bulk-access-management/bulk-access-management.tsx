import { Copy, Gauge, Plus, RefreshCw, Users, UsersRound } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type {
	AccessLevel,
	AccessPerson,
	ModelUsageLimit,
	PermissionBatch,
	PermissionTargetResource,
} from "@semoss/sdk";
import {
	describeModelUsageLimit,
	isSameModelUsageLimit,
	OWNERS_ONLY_LIMIT_REASON,
	UsageLimitGuideButton,
	useIsCurrentLogin,
} from "@semoss/shared";
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
import {
	MODEL_LIMIT_NAMES,
	MODEL_TOTAL_DESCRIPTION,
	PUBLIC_USE_DESCRIPTION,
	PUBLIC_USE_NOT_PUBLIC_DESCRIPTION,
} from "@/features/model-usage-limits/model-usage-limits";
import { TeamFormDialog } from "@/features/team-form/team-form-dialog";
import { CUSTOM_TEAM_TYPE } from "@/features/team-type/team-type";
import {
	PUBLIC_TEAM_HINT,
	TEAM_LIMIT_DESCRIPTION,
} from "@/features/team-usage-limit/team-usage-limit";
import { AccessViewHeader } from "./access-view-header";
import { AddPeopleCard } from "./add-people-card";
import type { BringInAccessItem } from "./bring-in-access-menu";
import { CopyAccessDialog } from "./copy-access-dialog";
import { CopyTeamPeopleDialog } from "./copy-team-people-dialog";
import { DiscardChangesDialog } from "./discard-changes-dialog";
import {
	type BatchEntry,
	canSetPersonLimitAt,
	canSetUsageLimits,
	describeChangeDetail,
	describeModelLimitChange,
	getLevelLabel,
	getLimitBlockReason,
	getSubjectKey,
	type ModelLimitEntry,
} from "./permission-batch";
import { PermissionBatchConflicts } from "./permission-batch-conflicts";
import { PermissionBatchList } from "./permission-batch-list";
import {
	PermissionBatchReviewDialog,
	type ReviewItem,
} from "./permission-batch-review-dialog";
import {
	UsageLimitDialog,
	type UsageLimitDialogProps,
} from "./usage-limit-dialog";
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
	| "LIMIT"
	| "REVIEW"
	| "DISCARD"
	| null;

/** Which usage limit the limit dialog edits */
type LimitEditing =
	| { mode: "ENTRY"; entry: BatchEntry }
	| { mode: "MANY"; entries: BatchEntry[] }
	| { mode: "ADD" }
	| { mode: "MODEL_LIMIT"; entry: ModelLimitEntry };

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
	// on a model, the limit people are added with
	const [addLimit, setAddLimit] = useState<ModelUsageLimit | null>(null);
	const [limitEditing, setLimitEditing] = useState<LimitEditing | null>(null);
	const [selectedKeys, setSelectedKeys] = useState<ReadonlySet<string>>(
		() => new Set(),
	);
	const [newTeamMembers, setNewTeamMembers] = useState<NewTeamMembers[]>([]);
	const { resourceType, id } = target;
	const isEngine = resourceType === "ENGINE";
	const allowedChanges = batch.allowedChanges;
	const canAddPeople =
		allowedChanges?.canChangePeople === true &&
		!allowedChanges.addsAreAdminOnly;
	const levels = allowedChanges?.canGiveAuthorAccess
		? GROUP_ACCESS_LEVELS
		: GROUP_ACCESS_LEVELS.filter((option) => option.value !== "OWNER");
	// on a model, only its owners, and admins in admin mode, set usage limits
	const canSetLimits =
		isModel && allowedChanges !== null && canSetUsageLimits(allowedChanges);
	/** Whether the user can give the people they add at a level a limit */
	const canGiveLimitAt = (level: AccessLevel): boolean =>
		isModel &&
		allowedChanges !== null &&
		canSetPersonLimitAt(allowedChanges, level);
	/** The limit people added at a level get; none from a user who cannot set limits */
	const getAddLimitFor = (level: AccessLevel): ModelUsageLimit | null =>
		canGiveLimitAt(level) ? addLimit : null;
	const canGiveAddLimit = canGiveLimitAt(addLevel);

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
				target: { resourceType, id },
				changes: batch.changes.map((c) => c.change),
			},
			...newTeamMembers.map(
				(team): PermissionBatch => ({
					target: { resourceType: "TEAM", id: team.teamId },
					changes: team.people.map((person) => ({
						action: "ADD",
						subject: {
							category: "USER",
							id: person.id,
							type: person.type,
						},
					})),
				}),
			),
		],
		[resourceType, id, batch.changes, newTeamMembers],
	);
	const entriesByKey = new Map(
		batch.entries.map((entry) => [entry.key, entry]),
	);
	const modelLimitsByKey = new Map(
		batch.modelLimitEntries.map((entry) => [entry.key, entry]),
	);
	const reviewItems: ReviewItem[] = batch.changes.flatMap(
		(item, changeIndex) => {
			const modelLimit = modelLimitsByKey.get(item.key);
			if (modelLimit) {
				return [
					{
						batchIndex: 0,
						changeIndex,
						key: item.key,
						where: name,
						action: item.change.action,
						name: MODEL_LIMIT_NAMES[modelLimit.category],
						category: modelLimit.category,
						type: "",
						detail: describeModelLimitChange(modelLimit),
					},
				];
			}
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
								entry.subject.category === "TEAM"
									? entry.subject.id
									: entry.person?.name ||
										entry.person?.email ||
										entry.subject.id,
							category: entry.subject.category,
							type: entry.subject.type,
							id:
								entry.subject.category === "USER"
									? entry.subject.id
									: undefined,
							email: entry.person?.email,
							detail: describeChangeDetail(
								entry.current,
								item.change.action === "REMOVE"
									? null
									: entry.staged,
								entry.subject.category === "TEAM"
									? "TEAM"
									: "DIRECT",
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
					category: "USER",
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
			.filter((entry) => entry.subject.category === "TEAM")
			.map((entry) => `${entry.subject.type}:${entry.subject.id}`),
	);
	const customTeamsWithAccess = batch.entries
		.filter(
			(entry) =>
				entry.subject.category === "TEAM" &&
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
				entry.subject.category !== "USER" ||
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
		// someone who has access now keeps their limit when the user cannot set it
		const currentLimit =
			entriesByKey.get(getSubjectKey(person))?.current?.usageLimit ??
			null;
		batch.add(
			[{ subject: person, person }],
			isModel
				? {
						level: addLevel,
						usageLimit: canGiveAddLimit ? addLimit : currentLimit,
					}
				: { level: addLevel },
		);
	};

	const openLimit = (editing: LimitEditing) => {
		setLimitEditing(editing);
		openDialog("LIMIT");
	};

	/**
	 * A new level for an entry. A change sets the whole access, so the limit is
	 * carried with it: the one staged when the user can set the limit at the new
	 * level, and otherwise the one it has now, since only owners set limits.
	 */
	const handleLevelChange = (entry: BatchEntry, level: AccessLevel) => {
		const base = entry.staged ?? entry.current;
		if (!base) {
			return;
		}
		const next = { ...base, level };
		const keepsStagedLimit =
			!isModel ||
			(allowedChanges !== null &&
				getLimitBlockReason(
					{ ...entry, staged: next },
					allowedChanges,
				) === null);
		batch.setStaged(
			entry,
			keepsStagedLimit
				? next
				: { ...next, usageLimit: entry.current?.usageLimit ?? null },
		);
	};

	const handleSaveLimit = (usageLimit: ModelUsageLimit | null) => {
		const editing = limitEditing;
		setDialog(null);
		setLimitEditing(null);
		if (!editing) {
			return;
		}
		if (editing.mode === "ADD") {
			setAddLimit(usageLimit);
			return;
		}
		if (editing.mode === "MODEL_LIMIT") {
			batch.setModelLimit(editing.entry.category, usageLimit);
			return;
		}
		if (editing.mode === "MANY") {
			batch.setUsageLimits(editing.entries, usageLimit);
			setSelectedKeys(new Set());
			return;
		}
		const base = editing.entry.staged;
		if (base) {
			batch.setStaged(editing.entry, { ...base, usageLimit });
		}
	};

	const handleCopied = (
		copiedCount: number,
		count: { added: number; conflicts: number },
		from: string,
	) => {
		if (copiedCount === 0) {
			toast.info(`No one to copy from ${from}`);
			return;
		}
		if (count.added === 0 && count.conflicts === 0) {
			toast.info(`Everyone from ${from} already has this access`);
			return;
		}
		const conflicts =
			count.conflicts === 1
				? "1 already has different access; choose what to keep."
				: `${count.conflicts} already have different access; choose what to keep.`;
		if (count.added === 0) {
			toast.success(`From ${from}, ${conflicts}`);
			return;
		}
		toast.success(
			count.conflicts === 0
				? `Added ${count.added} from ${from} to your changes.`
				: `Added ${count.added} from ${from} to your changes. ${conflicts}`,
		);
	};

	// the team is made right away; its members and its access wait for the batch
	const handleTeamMade = (team?: TeamSummary) => {
		setDialog(null);
		if (!team) {
			return;
		}
		const members = team.type === CUSTOM_TEAM_TYPE ? stagedPeople : [];
		const memberCount =
			members.length === 1 ? "1 member" : `${members.length} members`;
		if (members.length > 0) {
			setNewTeamMembers((prev) => [
				...prev,
				{ teamId: team.id, people: members },
			]);
		}
		batch.add(
			[
				{
					subject: { category: "TEAM", id: team.id, type: team.type },
					person: null,
				},
			],
			isModel
				? { level: "READ_ONLY", usageLimit: null }
				: { level: "READ_ONLY" },
			members.length > 0
				? `New team, with ${memberCount} to add`
				: "New team",
		);
		toast.success(
			members.length > 0
				? `${team.id} was made. Its ${memberCount} and its Read-Only access are in your changes, and are saved when you apply them.`
				: `${team.id} was made. Its Read-Only access is in your changes, and is saved when you apply them.`,
		);
	};

	/**
	 * @param editing - which usage limit the dialog edits
	 * @returns what the dialog says and starts from
	 */
	const getLimitDialogProps = (
		editing: LimitEditing,
	): Pick<
		UsageLimitDialogProps,
		| "title"
		| "description"
		| "source"
		| "defaultValue"
		| "notDefinedHint"
		| "readOnlyReason"
		| "saveLabel"
	> => {
		if (editing.mode === "ADD") {
			return {
				title: "Usage Limit for the People You Add",
				description:
					"Everyone you add from here, or copy from a team, gets this limit on the model.",
				source: "DIRECT",
				defaultValue: addLimit,
			};
		}
		if (editing.mode === "MODEL_LIMIT") {
			const isTotal = editing.entry.category === "MODEL";
			return {
				title: isTotal ? "Model Total" : "Public Use Limit",
				description: isTotal
					? MODEL_TOTAL_DESCRIPTION
					: batch.isPublic
						? PUBLIC_USE_DESCRIPTION
						: PUBLIC_USE_NOT_PUBLIC_DESCRIPTION,
				source: isTotal ? "MODEL_TOTAL" : "PUBLIC",
				defaultValue: editing.entry.staged,
				readOnlyReason: canSetLimits ? null : OWNERS_ONLY_LIMIT_REASON,
				saveLabel: "Use This Limit",
			};
		}
		if (editing.mode === "MANY") {
			const isAllTeams = editing.entries.every(
				(entry) => entry.subject.category === "TEAM",
			);
			const [first, ...rest] = editing.entries;
			const firstLimit = first?.staged?.usageLimit ?? null;
			// several rows start from their limit when they all have the same one
			const isSame = rest.every((entry) =>
				isSameModelUsageLimit(entry.staged?.usageLimit, firstLimit),
			);
			const count = editing.entries.length;
			return {
				title:
					count === 1
						? "Set Usage Limit for 1 Row"
						: `Set Usage Limit for ${count.toLocaleString()} Rows`,
				description: isAllTeams
					? "Each team selected gets this team limit. Their access levels stay as they are."
					: "Each person selected gets this limit, and each team gets it for each member. Their access levels stay as they are.",
				source: isAllTeams ? "TEAM" : "DIRECT",
				defaultValue: isSame ? firstLimit : null,
				notDefinedHint:
					isAllTeams && batch.isPublic ? PUBLIC_TEAM_HINT : undefined,
				saveLabel: "Set Usage Limit",
			};
		}
		const { entry } = editing;
		const isTeam = entry.subject.category === "TEAM";
		const label = isTeam
			? entry.subject.id
			: entry.person?.name || entry.person?.email || entry.subject.id;
		return {
			title: `Usage Limit for ${label}`,
			description: isTeam
				? TEAM_LIMIT_DESCRIPTION
				: "This person's own limit on this model. It replaces any team limit for them.",
			source: isTeam ? "TEAM" : "DIRECT",
			defaultValue: (entry.staged ?? entry.current)?.usageLimit ?? null,
			notDefinedHint:
				isTeam && batch.isPublic ? PUBLIC_TEAM_HINT : undefined,
			readOnlyReason: allowedChanges
				? getLimitBlockReason(entry, allowedChanges)
				: null,
		};
	};

	const handleDiscard = () => {
		batch.discard();
		setNewTeamMembers([]);
		setSelectedKeys(new Set());
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
						{isModel ? (
							<UsageLimitGuideButton
								section="who"
								viewer={{
									canSetModelLimits: canSetLimits,
									isAdminMode: admin,
								}}
							/>
						) : null}
						<Button
							type="button"
							variant="outline"
							disabled={batch.isLoading}
							onClick={batch.refresh}
						>
							<RefreshCw
								className={
									batch.isLoading
										? "size-4 animate-spin motion-reduce:animate-none"
										: "size-4"
								}
								aria-hidden
							/>
							Load Latest Access
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
							modelLimitEntries={batch.modelLimitEntries}
							isPublic={batch.isPublic}
							selectedKeys={selectedKeys}
							onSelectedKeysChange={setSelectedKeys}
							onLevelChange={handleLevelChange}
							onRemove={(entry) => batch.setStaged(entry, null)}
							onRestore={(entry) => batch.restore(entry.key)}
							onEditLimit={(entry) =>
								openLimit({ mode: "ENTRY", entry })
							}
							onEditModelLimit={(entry) =>
								openLimit({ mode: "MODEL_LIMIT", entry })
							}
							onRestoreModelLimit={(entry) =>
								batch.restore(entry.key)
							}
							onSetUsageLimits={(entries) =>
								openLimit({ mode: "MANY", entries })
							}
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
									<SelectValue>
										{getLevelLabel(addLevel)}
									</SelectValue>
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
							{isModel ? (
								<>
									<Button
										type="button"
										variant="outline"
										className="h-auto w-full justify-start whitespace-normal py-2 text-start"
										disabled={
											!canAddPeople || !canGiveAddLimit
										}
										onClick={() =>
											openLimit({ mode: "ADD" })
										}
									>
										<Gauge
											className="size-4 shrink-0"
											aria-hidden
										/>
										<span className="sr-only">
											Usage limit for the people you add:{" "}
										</span>
										<span
											className={
												getAddLimitFor(addLevel)
													? undefined
													: "text-muted-foreground"
											}
										>
											{describeModelUsageLimit(
												getAddLimitFor(addLevel),
											)}
										</span>
									</Button>
									{canGiveAddLimit || !canAddPeople ? null : (
										<p className="text-muted-foreground text-xs">
											{OWNERS_ONLY_LIMIT_REASON}. People
											you add get no limit, and anyone who
											has access keeps their own.
										</p>
									)}
								</>
							) : null}
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
						rows.length,
						batch.copy(rows, {
							note: `Copied from ${from}`,
							keepModelLimits: isModel,
							canSetLimits,
							costLimitsAvailable: batch.costLimitsAvailable,
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
						rows.length,
						batch.copy(rows, {
							note: `Copied from the ${team} team`,
							level,
							// a team's members get the Add With limit from a user who
							// can set it; otherwise each keeps the limit they have now
							...(isModel && level
								? { usageLimit: getAddLimitFor(level) }
								: {}),
							keepModelLimits: isModel,
							canSetLimits:
								level !== undefined && canGiveLimitAt(level),
							costLimitsAvailable: batch.costLimitsAvailable,
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
					model={
						isModel
							? {
									isPublic: batch.isPublic,
									isCostAvailable: batch.costLimitsAvailable,
									canChangeLimit: canSetLimits,
								}
							: undefined
					}
					onStage={(team, level, usageLimit) => {
						if (level === "DISCOVERABLE") {
							return;
						}
						batch.add(
							[
								{
									subject: {
										category: "TEAM",
										id: team.id,
										type: team.type,
									},
									person: null,
								},
							],
							isModel ? { level, usageLimit } : { level },
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
			{limitEditing ? (
				<UsageLimitDialog
					key={`limit-${dialogKey}`}
					open={dialog === "LIMIT"}
					{...getLimitDialogProps(limitEditing)}
					isCostAvailable={batch.costLimitsAvailable}
					onSave={handleSaveLimit}
					onClose={() => {
						setDialog(null);
						setLimitEditing(null);
					}}
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
					// the rows picked are gone from the list until the access is read again
					setSelectedKeys(new Set());
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
