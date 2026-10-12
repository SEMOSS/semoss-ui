import { Copy, RefreshCw, Users } from "lucide-react";
import { useMemo, useState } from "react";
import type { PermissionsToCopy, TeamRole } from "@semoss/sdk";
import { useIsCurrentLogin } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { AccessViewHeader } from "@/features/bulk-access-management/access-view-header";
import { AddPeopleCard } from "@/features/bulk-access-management/add-people-card";
import type { BringInAccessItem } from "@/features/bulk-access-management/bring-in-access-menu";
import { CopyAccessDialog } from "@/features/bulk-access-management/copy-access-dialog";
import { CopyTeamPeopleDialog } from "@/features/bulk-access-management/copy-team-people-dialog";
import { DiscardChangesDialog } from "@/features/bulk-access-management/discard-changes-dialog";
import { PermissionBatchReviewDialog } from "@/features/bulk-access-management/permission-batch-review-dialog";
import { useUnsavedChangesGuard } from "@/features/bulk-access-management/use-unsaved-changes-guard";
import {
	buildTeamBatches,
	countPeopleChanges,
	getTeamPersonKey,
	TEAM_ROLES,
} from "./team-changes";
import { TEAM_ROLE_COPY } from "./team-role-copy";
import { TeamRoleList } from "./team-role-list";
import { useTeamChanges } from "./use-team-changes";

/** The dialog open on a team's Bulk Access Management */
type TeamAccessDialog =
	| "COPY_TEAM"
	| "COPY_RESOURCE"
	| "REVIEW"
	| "DISCARD"
	| null;

export interface TeamAccessManagementProps {
	/** The custom team */
	groupId: string;
	/** Where the team's page is, relative to this view */
	backTo: string;
	/**
	 * Whether in admin mode, from Team Permissions, where an admin can change
	 * any custom team; outside it, from My Teams, they have only their own permissions
	 */
	admin: boolean;
	/** Whether the organization's Microsoft directory can be searched */
	isDirectoryAvailable: boolean;
}

/**
 * Bulk Access Management for a custom team, for its members or its managers: see
 * who is in each, add many people at once from the app and the organization,
 * copy members from another team or an app or engine, copy managers from
 * another team, and remove people. Every change to both is saved together
 * after a review.
 */
export const TeamAccessManagement = ({
	groupId,
	backTo,
	admin,
	isDirectoryAvailable,
}: TeamAccessManagementProps) => {
	const team = useTeamChanges(groupId, admin);
	const [role, setRole] = useState<TeamRole>("MEMBERS");
	const [dialog, setDialog] = useState<TeamAccessDialog>(null);
	// a new key each time a dialog opens starts it empty
	const [dialogKey, setDialogKey] = useState(0);
	const { people, edits } = team;
	const copy = TEAM_ROLE_COPY[role];
	const target = useMemo(
		() => ({
			kind:
				role === "MANAGERS"
					? ("TEAM_MANAGERS" as const)
					: ("TEAM" as const),
			id: groupId,
		}),
		[role, groupId],
	);
	const { batches, roles, items } = useMemo(
		() => buildTeamBatches(groupId, edits, people),
		[groupId, edits, people],
	);
	// everyone in the list once the changes are saved, so the search marks them
	const stagedKeys = useMemo(
		() =>
			new Set([
				...people[role]
					.map(getTeamPersonKey)
					.filter((key) => !edits[role].removals.has(key)),
				...edits[role].adds.keys(),
			]),
		[people, edits, role],
	);
	const isCurrentLogin = useIsCurrentLogin();
	// outside admin mode, a manager who removes themselves loses the team
	const removesSelf =
		!admin &&
		people.MANAGERS.some(
			(person) =>
				edits.MANAGERS.removals.has(getTeamPersonKey(person)) &&
				isCurrentLogin(person.type, person.id),
		);
	const isFirstLoad = team.isLoading && !team.hasLoaded && !team.error;
	const blocker = useUnsavedChangesGuard(team.changeCount > 0);

	const openDialog = (next: TeamAccessDialog) => {
		setDialogKey((key) => key + 1);
		setDialog(next);
	};

	const handleCopied = (rows: PermissionsToCopy[], from: string) => {
		const added = team.addPeople(
			role,
			rows.map((row) => row.subject),
		);
		if (added === 0) {
			toast.info(copy.getAlreadyInText(from));
		} else {
			toast.success(
				added === 1
					? `Added 1 person from ${from} to your changes`
					: `Added ${added} people from ${from} to your changes`,
			);
		}
	};

	const menuItems: BringInAccessItem[] =
		role === "MANAGERS"
			? [
					{
						label: "Copy Managers From a Team",
						icon: Users,
						disabled: !team.canChange.MANAGERS,
						onSelect: () => openDialog("COPY_TEAM"),
					},
				]
			: [
					{
						label: "Copy Members From a Team",
						icon: Users,
						disabled: !team.canChange.MEMBERS,
						onSelect: () => openDialog("COPY_TEAM"),
					},
					{
						label: "Copy People From an App or Engine",
						icon: Copy,
						disabled: !team.canChange.MEMBERS,
						onSelect: () => openDialog("COPY_RESOURCE"),
					},
				];

	return (
		// a line and space set the view apart from the team's header above it
		<div className="flex w-full flex-col gap-6 border-border border-t pt-6">
			<AccessViewHeader
				title="Bulk Access Management"
				description={
					<>
						Change who is in the {groupId} team and who manages it.
						Nothing is saved until you review and apply the changes.
					</>
				}
				backTo={backTo}
				backLabel="Back to the Team"
				actions={
					<>
						<Button
							type="button"
							variant="outline"
							disabled={team.isLoading}
							onClick={team.refresh}
						>
							<RefreshCw className="size-4" aria-hidden />
							Refresh
						</Button>
						<Button
							type="button"
							variant="outline"
							disabled={team.changeCount === 0}
							onClick={() => openDialog("DISCARD")}
						>
							Discard Changes
						</Button>
						<Button
							type="button"
							disabled={team.changeCount === 0}
							onClick={() => openDialog("REVIEW")}
						>
							Review Changes ({team.changeCount})
						</Button>
					</>
				}
			/>

			{team.error ? (
				<Alert variant="destructive">
					<AlertDescription>{team.error}</AlertDescription>
				</Alert>
			) : null}

			{removesSelf ? (
				<Alert>
					<AlertDescription>
						These changes remove you as a manager. Once they are
						applied, you can no longer change this team or open its
						Bulk Access Management.
					</AlertDescription>
				</Alert>
			) : null}

			{isFirstLoad ? (
				<output className="flex items-center justify-center gap-2 py-12 text-muted-foreground text-sm">
					<Spinner className="size-4" />
					Loading the team...
				</output>
			) : team.hasLoaded ? (
				<Tabs
					value={role}
					onValueChange={(value) => {
						if (value === "MEMBERS" || value === "MANAGERS") {
							setRole(value);
						}
					}}
					className="gap-4"
				>
					<TabsList>
						{TEAM_ROLES.map((item) => {
							const changes = countPeopleChanges(edits[item]);
							return (
								<TabsTrigger
									key={item}
									value={item}
									className="px-3"
								>
									{TEAM_ROLE_COPY[item].title}
									{/* the changes staged in a list stay in sight from the other */}
									{changes > 0 ? (
										<Badge variant="secondary">
											{changes}
											<span className="sr-only">
												{changes === 1
													? " unsaved change"
													: " unsaved changes"}
											</span>
										</Badge>
									) : null}
								</TabsTrigger>
							);
						})}
					</TabsList>
					{TEAM_ROLES.map((item) => (
						// both tabs stay mounted, so each keeps its searches while the other shows
						<TabsContent
							key={item}
							value={item}
							forceMount
							className="data-[state=inactive]:hidden"
						>
							{/* the list's column stretches to the card's height, so the two end together */}
							<div className="flex flex-col gap-6 md:flex-row">
								<div className="flex min-w-0 flex-1 flex-col">
									<TeamRoleList
										role={item}
										people={people[item]}
										edits={edits[item]}
										canChange={team.canChange[item]}
										onRemove={(person) =>
											team.removePerson(item, person)
										}
										onUndo={(key) =>
											team.undoPeople(item, [key])
										}
									/>
								</div>

								{/* the search stays in view while the list scrolls */}
								<AddPeopleCard
									className="md:sticky md:top-4 md:w-80 md:shrink-0 md:self-start lg:w-96"
									description={
										TEAM_ROLE_COPY[item].addDescription
									}
									menuItems={menuItems}
									isDirectoryAvailable={isDirectoryAvailable}
									isStaged={(person) =>
										stagedKeys.has(getTeamPersonKey(person))
									}
									onAdd={(person) =>
										team.addPeople(item, [person])
									}
									disabled={!team.canChange[item]}
								/>
							</div>
						</TabsContent>
					))}
				</Tabs>
			) : null}

			<CopyTeamPeopleDialog
				key={`copy-team-${dialogKey}`}
				open={dialog === "COPY_TEAM"}
				target={target}
				admin={admin}
				teamsWithAccess={[]}
				onCopy={(rows, from) => handleCopied(rows, `the ${from} team`)}
				onClose={() => setDialog(null)}
			/>
			<CopyAccessDialog
				admin={admin}
				key={`copy-resource-${dialogKey}`}
				open={dialog === "COPY_RESOURCE"}
				target={target}
				onCopy={handleCopied}
				onClose={() => setDialog(null)}
			/>
			<PermissionBatchReviewDialog
				admin={admin}
				key={`review-${dialogKey}`}
				open={dialog === "REVIEW"}
				batches={batches}
				items={items}
				onApplied={(result) => {
					setDialog(null);
					team.finishApply();
					toast.success(
						result.changes === 1
							? "1 change was saved"
							: `${result.changes} changes were saved`,
					);
				}}
				onLeaveOut={(blocked) => {
					for (const item of TEAM_ROLES) {
						const keys = blocked
							.filter(
								(change) => roles[change.batchIndex] === item,
							)
							.map((change) => change.key);
						if (keys.length > 0) {
							team.undoPeople(item, keys);
						}
					}
				}}
				onClose={() => setDialog(null)}
			/>
			<DiscardChangesDialog
				open={dialog === "DISCARD"}
				reason="DISCARD"
				changeCount={team.changeCount}
				onConfirm={() => {
					team.discard();
					setDialog(null);
				}}
				onCancel={() => setDialog(null)}
			/>
			<DiscardChangesDialog
				open={blocker.state === "blocked"}
				reason="LEAVE"
				changeCount={team.changeCount}
				onConfirm={() => blocker.proceed?.()}
				onCancel={() => blocker.reset?.()}
			/>
		</div>
	);
};
