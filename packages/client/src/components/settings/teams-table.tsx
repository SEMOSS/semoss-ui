import { Info, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import {
	type ModelUsageLimit,
	type PermissionGrant,
	type Role,
	savePermissionBatches,
} from "@semoss/sdk";
import {
	OWNERS_ONLY_LIMIT_REASON,
	UsageLimitGuideButton,
} from "@semoss/shared";
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
	H4,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import {
	editGroupResourceAccess,
	type GroupAccessResource,
	getGroupsWithAccessToEngine,
	getGroupsWithAccessToProject,
	removeGroupResourceAccess,
} from "@/api/teams";
import { TablePagination } from "@/components/ui/table-pagination/table-pagination";
import { UsageLimitDialog } from "@/features/bulk-access-management/usage-limit-dialog";
import {
	AddGroupAccessDialog,
	type GroupAccessModel,
} from "@/features/group-access/add-group-access-dialog";
import {
	GROUP_ACCESS_LEVELS,
	getGroupAccessLevel,
} from "@/features/group-access/group-access-levels";
import { TeamPeopleSheet } from "@/features/team-people/team-people-sheet";
import { TEAM_RESOURCE_NOUNS } from "@/features/team-resource-access/team-resource-nouns";
import { CUSTOM_TEAM_TYPE } from "@/features/team-type/team-type";
import { TeamTypeBadge } from "@/features/team-type/team-type-badge";
import {
	getTeamLimitKey,
	PUBLIC_TEAM_HINT,
	TEAM_LIMIT_DESCRIPTION,
	toTeamLimitBatch,
} from "@/features/team-usage-limit/team-usage-limit";
import { TeamUsageLimitCell } from "@/features/team-usage-limit/team-usage-limit-cell";
import { useTeamUsageLimits } from "@/features/team-usage-limit/use-team-usage-limits";
import { useServerPagination } from "@/hooks";

interface RawTeam {
	ID: string;
	TYPE: string;
	PERMISSION: number | string;
	DATEADDED: string;
}

interface TeamRow {
	/** Row key */
	key: string;
	/** Team name */
	id: string;
	/** Team type */
	type: string;
	/** The team's access level, when it is a known one */
	permission: Role | null;
	/** What the table shows for the access level */
	permissionLabel: string;
	/** When the access was given */
	dateAdded: string;
}

/** The team whose usage limit is open, with its access when it was opened */
interface LimitEditing {
	/** The team */
	team: TeamRow;
	/** Its access on the model, which the change carries forward */
	grant: PermissionGrant;
}

const parseGroupsResponse = (result: unknown) => {
	if (Array.isArray(result)) {
		return {
			groups: result as RawTeam[],
			totalGroups: result.length,
			hasTotal: false,
		};
	}
	if (result && typeof result === "object") {
		const payload = result as {
			groups?: RawTeam[];
			totalGroups?: number;
		};
		const groups = Array.isArray(payload.groups) ? payload.groups : [];
		const hasTotal = typeof payload.totalGroups === "number";
		return {
			groups,
			totalGroups: hasTotal ? payload.totalGroups : groups.length,
			hasTotal,
		};
	}
	return { groups: [] as RawTeam[], totalGroups: 0, hasTotal: false };
};

export interface TeamsTableProps {
	/** Whether the teams have access to a project or an engine */
	type: GroupAccessResource;
	/** The project or engine id */
	id: string;
	/**
	 * Whether the viewer can give, change and remove team access: the
	 * resource's owners. Being an admin does not count here, since an admin can
	 * also act as an ordinary user.
	 */
	canManage?: boolean;
	/**
	 * Whether the viewer can see who is in the custom teams: the resource's
	 * owners and editors
	 */
	canViewPeople?: boolean;
	/**
	 * On a model, what giving a team access needs to give it a team limit too.
	 * The table then has a Usage Limit column, read from the model's
	 * permissions, which the model's owners can open to change a team's limit.
	 */
	model?: GroupAccessModel;
	/**
	 * Whether the teams' usage limits are read and saved in admin mode, where an
	 * admin can change any team's limit. The list of teams, their levels and Add
	 * Team use the owners' endpoints either way.
	 */
	admin?: boolean;
}

/**
 * Lists the teams that have access to a project or engine. Its owners and
 * editors can see who is in each custom team, and its owners can give more
 * teams access, change a team's access level, and take access away. On a
 * model, it shows each team's usage limit, which its owners can change; a
 * level change keeps the limit as it is.
 */
export const TeamsTable = ({
	type,
	id,
	canManage = false,
	canViewPeople = false,
	model,
	admin = false,
}: TeamsTableProps) => {
	const [teams, setTeams] = useState<TeamRow[]>([]);
	const [totalTeams, setTotalTeams] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	// why the last read of the teams failed, or null
	const [loadError, setLoadError] = useState<string | null>(null);
	const [usesServerPagination, setUsesServerPagination] = useState(false);
	const [refreshCount, setRefreshCount] = useState(0);
	const [isAddOpen, setIsAddOpen] = useState(false);
	// a new key each time the add dialog opens starts it with a fresh list
	const [addDialogKey, setAddDialogKey] = useState(0);
	const [removeTarget, setRemoveTarget] = useState<TeamRow | null>(null);
	const [peopleTeam, setPeopleTeam] = useState<TeamRow | null>(null);
	const [isChanging, setIsChanging] = useState(false);
	const [limitEditing, setLimitEditing] = useState<LimitEditing | null>(null);
	// a new key each time the limit dialog opens starts it from the team's limit
	const [limitDialogKey, setLimitDialogKey] = useState(0);
	const noun = TEAM_RESOURCE_NOUNS[type].singular;
	const hasActions = canManage || canViewPeople;
	const hasLimits = model !== undefined && type === "ENGINE";
	const teamLimits = useTeamUsageLimits(hasLimits ? id : null, admin);
	const columnCount = 4 + (hasLimits ? 1 : 0) + (hasActions ? 1 : 0);
	// the table's read says whether the model has known prices, so the add
	// dialog need not read it again, and whether the user is one of the
	// model's owners, who alone give a team a limit
	const addDialogModel =
		model && hasLimits
			? {
					...model,
					isCostAvailable:
						model.isCostAvailable ?? teamLimits.costLimitsAvailable,
					canChangeLimit:
						model.canChangeLimit ?? teamLimits.canChangeModelLimits,
				}
			: model;
	const {
		page,
		rowsPerPage,
		setPage,
		setRowsPerPage,
		offset,
		totalPages,
		startRow,
		endRow,
	} = useServerPagination({
		totalCount: totalTeams,
		initialRowsPerPage: 50,
		pageIndexBase: 0,
	});

	useEffect(() => {
		// refreshCount is read so a change to the teams loads them again
		if (!type || !id || refreshCount < 0) return;
		let isStale = false;
		const fetchTeams = async () => {
			setIsLoading(true);
			setLoadError(null);
			try {
				const getGroups =
					type === "ENGINE"
						? getGroupsWithAccessToEngine
						: getGroupsWithAccessToProject;
				let data: RawTeam[] = [];
				let total = 0;
				let serverPaginated = false;

				const parsed = parseGroupsResponse(
					await getGroups(String(id), rowsPerPage, offset),
				);
				if (parsed.hasTotal) {
					data = parsed.groups;
					total = parsed.totalGroups;
					serverPaginated = true;
				} else {
					const fullParsed = parseGroupsResponse(
						await getGroups(String(id), 100, 0),
					);
					data = fullParsed.groups;
					total = fullParsed.totalGroups;
				}
				if (isStale) {
					return;
				}

				const mappedTeams: TeamRow[] = data.map((team, idx) => {
					const level = getGroupAccessLevel(team.PERMISSION);
					return {
						key: team.ID ? `${team.TYPE}:${team.ID}` : String(idx),
						id: team.ID,
						type: team.TYPE,
						permission: level?.value ?? null,
						permissionLabel:
							level?.label ?? String(team.PERMISSION),
						dateAdded: team.DATEADDED,
					};
				});
				setTeams(mappedTeams);
				setTotalTeams(total);
				setUsesServerPagination(serverPaginated);
			} catch (e) {
				if (isStale) {
					return;
				}
				setTeams([]);
				setTotalTeams(0);
				setUsesServerPagination(false);
				setLoadError(getErrorMessage(e, "Could not load the teams"));
			} finally {
				if (!isStale) {
					setIsLoading(false);
				}
			}
		};
		fetchTeams();
		return () => {
			isStale = true;
		};
	}, [id, rowsPerPage, type, offset, refreshCount]);

	const visibleTeams = usesServerPagination
		? teams
		: teams.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	/** Reads the teams again, and on a model their limits */
	const reloadTeams = () => {
		setRefreshCount((count) => count + 1);
		if (hasLimits) {
			teamLimits.refresh();
		}
	};

	/** The team's access on the model, with its limit, or null when it is not known */
	const getTeamGrant = (team: TeamRow): PermissionGrant | null =>
		teamLimits.grants?.get(getTeamLimitKey(team)) ?? null;

	const handleOpenLimit = (team: TeamRow) => {
		const grant = getTeamGrant(team);
		if (grant) {
			setLimitDialogKey((key) => key + 1);
			setLimitEditing({ team, grant });
		}
	};

	const handleSaveLimit = async (usageLimit: ModelUsageLimit | null) => {
		if (!limitEditing) {
			return;
		}
		const { team, grant } = limitEditing;
		// a refused change rejects, and the dialog shows the backend's reason
		await savePermissionBatches(
			[toTeamLimitBatch(id, team, grant, usageLimit)],
			admin,
		);
		setLimitEditing(null);
		toast.success(`The usage limit for ${team.id} was saved`);
		teamLimits.refresh();
	};

	const handleLevelChange = async (team: TeamRow, value: string) => {
		const level = GROUP_ACCESS_LEVELS.find(
			(option) => option.value === value,
		);
		if (!level || level.value === team.permission) {
			return;
		}
		setIsChanging(true);
		try {
			await editGroupResourceAccess(type, id, team, level.value);
		} catch (e) {
			toast.error(
				getErrorMessage(e, "Could not change the team's access"),
			);
			setIsChanging(false);
			return;
		}
		setIsChanging(false);
		toast.success(`${team.id} now has ${level.label} access`);
		// the team keeps its limit; its grant is read again for the next change
		reloadTeams();
	};

	const handleRemove = async () => {
		if (!removeTarget) {
			return;
		}
		setIsChanging(true);
		try {
			await removeGroupResourceAccess(type, id, removeTarget);
		} catch (e) {
			toast.error(
				getErrorMessage(e, "Could not remove the team's access"),
			);
			setIsChanging(false);
			return;
		}
		setIsChanging(false);
		toast.success(`${removeTarget.id} no longer has access`);
		setRemoveTarget(null);
		reloadTeams();
	};

	return (
		<div className="flex flex-col gap-4 rounded-xl">
			{loadError ? (
				<Alert variant="destructive">
					<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
						{loadError}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={reloadTeams}
						>
							Try Again
						</Button>
					</AlertDescription>
				</Alert>
			) : null}
			{hasLimits && teamLimits.error ? (
				<Alert variant="destructive">
					<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
						<span>
							Could not read the teams' usage limits.{" "}
							{teamLimits.error}
						</span>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={teamLimits.isLoading}
							onClick={teamLimits.refresh}
						>
							Try Again
						</Button>
					</AlertDescription>
				</Alert>
			) : null}
			<div className="rounded-xl border border-border">
				<div className="flex flex-wrap items-center justify-between gap-2 rounded-t-xl border-border border-b bg-background px-6 py-3">
					<div className="flex flex-wrap items-center gap-2">
						<H4>Teams</H4>
						{hasLimits ? (
							<UsageLimitGuideButton
								section="teams"
								viewer={{
									canSetModelLimits:
										teamLimits.canChangeModelLimits,
									isAdminMode: admin,
								}}
							/>
						) : null}
					</div>
					{canManage ? (
						<Button
							size="sm"
							onClick={() => {
								setAddDialogKey((key) => key + 1);
								setIsAddOpen(true);
							}}
						>
							<Plus className="size-4" aria-hidden />
							Add Team
						</Button>
					) : null}
				</div>
				<div className="overflow-x-auto">
					<Table className="rounded-b-xl bg-background">
						<TableHeader>
							<TableRow>
								<TableHead className="p-0">
									<div className="py-3 pr-4 pl-6 text-left">
										Name
									</div>
								</TableHead>
								<TableHead className="px-4">
									Members From
								</TableHead>
								<TableHead className="p-0">
									<div className="px-4 py-3 text-left">
										Permission
									</div>
								</TableHead>
								{hasLimits ? (
									<TableHead className="px-4">
										Usage Limit
									</TableHead>
								) : null}
								<TableHead className="px-4">
									Permission Date
								</TableHead>
								{hasActions ? (
									<TableHead className="w-px whitespace-nowrap px-4 text-center">
										Actions
									</TableHead>
								) : null}
							</TableRow>
						</TableHeader>
						<TableBody>
							{visibleTeams.length > 0 ? (
								visibleTeams.map((team) => (
									<TableRow key={team.key}>
										<TableCell className="pr-4 pl-6">
											{team.id}
										</TableCell>
										<TableCell className="px-4">
											<TeamTypeBadge type={team.type} />
										</TableCell>
										<TableCell className="px-4">
											{canManage && team.permission ? (
												<Select
													value={team.permission}
													disabled={isChanging}
													onValueChange={(value) =>
														handleLevelChange(
															team,
															value,
														)
													}
												>
													<SelectTrigger
														size="sm"
														className="w-36"
														aria-label={`Access level for ${team.id}`}
													>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{GROUP_ACCESS_LEVELS.map(
															(option) => (
																<SelectItem
																	key={
																		option.value
																	}
																	value={
																		option.value
																	}
																>
																	{
																		option.label
																	}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											) : (
												team.permissionLabel
											)}
										</TableCell>
										{hasLimits ? (
											<TableCell className="px-4 text-sm">
												<TeamUsageLimitCell
													teamName={team.id}
													grant={getTeamGrant(team)}
													isLoading={
														teamLimits.isLoading
													}
													readOnlyReason={
														teamLimits.canChangeModelLimits
															? null
															: OWNERS_ONLY_LIMIT_REASON
													}
													disabled={
														isChanging ||
														teamLimits.isLoading
													}
													onEdit={() =>
														handleOpenLimit(team)
													}
												/>
											</TableCell>
										) : null}
										<TableCell className="px-4">
											{team.dateAdded}
										</TableCell>
										{hasActions ? (
											<TableCell className="px-4">
												<div className="flex items-center justify-center gap-1">
													{canViewPeople &&
													team.type ===
														CUSTOM_TEAM_TYPE ? (
														<Tooltip>
															<TooltipTrigger
																asChild
															>
																<Button
																	variant="ghost"
																	size="icon-sm"
																	aria-label={`View people in ${team.id}`}
																	onClick={() =>
																		setPeopleTeam(
																			team,
																		)
																	}
																>
																	<Users
																		className="size-4"
																		aria-hidden
																	/>
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																View People
															</TooltipContent>
														</Tooltip>
													) : canViewPeople ? (
														// a login provider's group has no member list here
														<Tooltip>
															<TooltipTrigger
																asChild
															>
																<Button
																	variant="ghost"
																	size="icon-sm"
																	aria-label={`Why the people in ${team.id} cannot be listed`}
																>
																	<Info
																		className="size-4"
																		aria-hidden
																	/>
																</Button>
															</TooltipTrigger>
															<TooltipContent className="max-w-xs">
																This team's
																members come
																from its login
																provider when
																they sign in, so
																they cannot be
																listed here.
															</TooltipContent>
														</Tooltip>
													) : null}
													{canManage ? (
														<Tooltip>
															<TooltipTrigger
																asChild
															>
																<Button
																	variant="ghost"
																	size="icon-sm"
																	disabled={
																		isChanging
																	}
																	aria-label={`Remove access for ${team.id}`}
																	onClick={() =>
																		setRemoveTarget(
																			team,
																		)
																	}
																>
																	<Trash2
																		className="size-4"
																		aria-hidden
																	/>
																</Button>
															</TooltipTrigger>
															<TooltipContent>
																Remove Access
															</TooltipContent>
														</Tooltip>
													) : null}
												</div>
											</TableCell>
										) : null}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columnCount}
										className="text-center"
									>
										{/* after a failed read, the error above says why there are none */}
										{isLoading ? (
											<span className="flex items-center justify-center gap-2 text-muted-foreground">
												<Spinner />
												Loading teams...
											</span>
										) : loadError ? null : (
											"No teams have access yet"
										)}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
						<TableFooter>
							<TableRow>
								<TableCell
									colSpan={columnCount}
									className="px-6"
								>
									<TablePagination
										startRow={startRow}
										endRow={endRow}
										totalCount={totalTeams}
										page={page}
										totalPages={totalPages}
										rowsPerPage={rowsPerPage}
										onPageChange={setPage}
										onRowsPerPageChange={setRowsPerPage}
										disabled={isLoading}
									/>
								</TableCell>
							</TableRow>
						</TableFooter>
					</Table>
				</div>
			</div>

			{canManage ? (
				<AddGroupAccessDialog
					key={addDialogKey}
					open={isAddOpen}
					resource={type}
					resourceId={id}
					model={addDialogModel}
					onClose={(added) => {
						setIsAddOpen(false);
						if (added) {
							reloadTeams();
						}
					}}
				/>
			) : null}

			{limitEditing ? (
				<UsageLimitDialog
					key={`limit-${limitDialogKey}`}
					open
					title={`Usage Limit for ${limitEditing.team.id}`}
					description={TEAM_LIMIT_DESCRIPTION}
					source="TEAM"
					defaultValue={limitEditing.grant.usageLimit ?? null}
					isCostAvailable={teamLimits.costLimitsAvailable}
					notDefinedHint={
						model?.isPublic ? PUBLIC_TEAM_HINT : undefined
					}
					saveLabel="Save Limit"
					onSave={handleSaveLimit}
					onClose={() => setLimitEditing(null)}
				/>
			) : null}

			{canViewPeople ? (
				<TeamPeopleSheet
					team={peopleTeam}
					target={{ resource: type, resourceId: id }}
					canRemoveAccess={canManage}
					onRemoveAccess={() => {
						setRemoveTarget(peopleTeam);
						setPeopleTeam(null);
					}}
					onClose={() => setPeopleTeam(null)}
				/>
			) : null}

			<Dialog
				open={removeTarget !== null}
				onOpenChange={(isOpen) => {
					if (!isOpen && !isChanging) {
						setRemoveTarget(null);
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="font-medium text-base leading-6">
							Remove Team Access
						</DialogTitle>
						<DialogDescription>
							Everyone in{" "}
							<span className="font-medium text-foreground">
								{removeTarget?.id}
							</span>{" "}
							loses the access this team gave them to this {noun}.
							People who were also given access on their own keep
							it.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={isChanging}
							onClick={() => setRemoveTarget(null)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							disabled={isChanging}
							onClick={handleRemove}
						>
							{isChanging ? "Removing..." : "Remove"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
