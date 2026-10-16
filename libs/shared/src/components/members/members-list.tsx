import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	editEngineUserPermissions,
	editProjectUserPermissions,
	getEngineUsers,
	getProjectUsers,
	type ModelUsageLimit,
	type PostUser,
	type Role,
	removeEngineUserPermissions,
	removeProjectUserPermissions,
} from "@semoss/sdk";
import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuTrigger,
	Muted,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { useIsCurrentLogin } from "../../hooks/use-is-current-login";
import { LoginTypeLabel } from "../login-type-label";
import {
	describeModelUsageLimit,
	toExplicitUsageLimit,
} from "../model-usage-limit/model-usage-limit-format";
import { OWNERS_END_LIMITED_ACCESS_REASON } from "../model-usage-limit/usage-limit-labels";
import { returnAccessType } from "./common";
import { PersonIdentity } from "./person-identity";

/** A member as the members endpoints list them */
export interface MemberUser {
	/** User id */
	id: string;
	/** Display name */
	name: string;
	/** Login type, such as NATIVE or MICROSOFT */
	type: string;
	/** Email address */
	email: string;
	/** Access level: OWNER, EDIT or READ_ONLY */
	permission: string;
	/** Id of who gave the access */
	permission_granted_by: string;
	/** Login type of who gave the access */
	permission_granted_by_type: string;
	/** When the access was given or the member was added */
	date_added: string;
	/** On a model engine, the usage limit on their own grant, or null for no limit defined */
	usage_limit?: ModelUsageLimit | null;
}

/** What the list calls each access level */
const ACCESS_LEVEL_LABELS: Readonly<Record<string, string>> = {
	OWNER: "Author",
	EDIT: "Editor",
	READ_ONLY: "Read-Only",
};

/**
 * @param permission - an access level, such as READ_ONLY
 * @returns what the list calls it
 */
export const getAccessLevelLabel = (permission: string): string =>
	ACCESS_LEVEL_LABELS[permission] ?? "Select Access";

/**
 * Where the list reads and removes members, for a host whose members are not a
 * project's or engine's, such as a team's. Make it with useMemo so the list does
 * not reload on every render.
 */
export interface MembersListSource {
	/** Loads a page of members and how many there are in all, rejecting with a message when it fails */
	load: (
		searchTerm: string,
		limit: number,
		offset: number,
	) => Promise<{ members: MemberUser[]; total: number }>;
	/** Removes members, rejecting with a message when any fail */
	remove: (members: MemberUser[]) => Promise<void>;
	/** What one member is called, such as "Manager", in place of "Member" */
	memberLabel?: string;
}

/** Props for {@link MembersList}. */
export interface MembersListProps {
	/** Id of the project or engine; unused with `source` */
	id?: string;
	/** Kind of resource; unused with `source` */
	type?:
		| "PROJECT"
		| "ENGINE"
		| "DATABASE"
		| "STORAGE"
		| "MODEL"
		| "VECTOR"
		| "FUNCTION"
		| "WORKSPACE"
		| "GUARDRAIL";
	/** Lists only the members matching this search */
	search?: string;
	/** Whether the list is inside the add dialog, which hides selection and row actions */
	isAddMember?: boolean;
	/** Reloads the list from the start whenever it changes */
	refreshList?: number;
	/** Lists only the members with this access level, or all for "" or "select access" */
	permission?: string;
	/** Called when a member's Edit button is clicked */
	onEdit?: (user: MemberUser) => void;
	/** Whether the viewer is an owner, who can change other owners and make people owners */
	isOwner?: boolean;
	/** Whether to use the admin endpoints, where the viewer can change anyone */
	adminMode?: boolean;
	/** The signed in user's id, starred when a member's login type is not known */
	currentUserId?: string;
	/** The viewer's access level on the project or engine; OWNER and EDIT can change members */
	myPermission?: string;
	/**
	 * Read-only mode: hides bulk-select, the checkbox column, the
	 * per-row Actions, and renders permission as static text.
	 */
	readOnly?: boolean;
	/**
	 * Reads and removes members through the host instead of a project's or
	 * engine's endpoints. The list then has no permission column.
	 */
	source?: MembersListSource;
}

/**
 * The members of a project or engine, or of a host's `source`, with each
 * person's login and, for a project or engine, their access level. Loads more
 * as it scrolls, and asks before removing anyone.
 */
export const MembersList = ({
	id,
	type,
	search = "",
	isAddMember = false,
	refreshList = 0,
	permission = "",
	onEdit,
	isOwner = false,
	adminMode = false,
	currentUserId,
	myPermission = "",
	readOnly = false,
	source,
}: MembersListProps) => {
	// a host's members have no project or engine permission
	const hasPermissions = !source;
	const memberLabel = source?.memberLabel ?? "Member";
	const isCurrentLogin = useIsCurrentLogin();
	const [userData, setUserData] = useState<MemberUser[]>([]);
	const [totalMembers, setTotalMembers] = useState<number>(0);
	const [refreshData, setRefreshData] = useState<number>(0);
	const [offset, setOffset] = useState<number>(0);
	const [usersToDelete, setUsersToDelete] = useState<MemberUser[]>([]);
	const [userDataLoading, setUserDataLoading] = useState<boolean>(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const membersListId = `members-table-list-container-${isAddMember ? "add-member" : "default"}`;
	const apiCallTriggerId = `triggerAPICall-${isAddMember ? "add-member" : "default"}`;
	const isFetchingRef = useRef(false);
	const fetchVersionRef = useRef(0);
	const canLoadMoreRef = useRef(false);
	// set while a reset moves a paged list back to its first page
	const isResettingRef = useRef(false);

	// Reset to page 0, with nothing selected, whenever identity, source or search changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset
	useEffect(() => {
		// the offset only resets on the next render, so the read waits for it
		if (offset !== 0) {
			isResettingRef.current = true;
		}
		setOffset(0);
		setUserData([]);
		setTotalMembers(0);
		setSelectedIds(new Set());
		canLoadMoreRef.current = false;
		isFetchingRef.current = false;
	}, [id, type, search, refreshData, source]);

	// Set up intersection observer once; refs keep guards current
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only setup
	useEffect(() => {
		const root = document.getElementById(membersListId);
		const trigger = document.getElementById(apiCallTriggerId);
		if (!trigger) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (
					entries[0].isIntersecting &&
					canLoadMoreRef.current &&
					!isFetchingRef.current
				) {
					isFetchingRef.current = true;
					setOffset((prev) => prev + 50);
				}
			},
			{ root, threshold: 1.0 },
		);
		observer.observe(trigger);
		return () => observer.disconnect();
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional
	useEffect(() => {
		if (isResettingRef.current) {
			if (offset !== 0) {
				// a read at the old offset would be thrown away, so skip it and
				// drop any read still in flight for the old query
				fetchVersionRef.current++;
				return;
			}
			isResettingRef.current = false;
		}
		const version = ++fetchVersionRef.current;
		async function fetchUserData() {
			isFetchingRef.current = true;
			setUserDataLoading(true);
			setLoadError(null);
			const isProject = type === "PROJECT" || type === "WORKSPACE";
			try {
				if (source) {
					const data = await source.load(search, 50, offset);
					if (fetchVersionRef.current !== version) return;
					setUserData((prev) =>
						offset === 0
							? data.members
							: [...prev, ...data.members],
					);
					setTotalMembers(data.total);
					canLoadMoreRef.current =
						offset + data.members.length < data.total;
					return;
				}
				if (!id) return;
				const data = await (isProject
					? getProjectUsers(
							id,
							adminMode,
							search || undefined,
							undefined,
							50,
							offset,
						)
					: getEngineUsers(
							id,
							adminMode,
							search || undefined,
							undefined,
							50,
							offset,
						));
				if (fetchVersionRef.current !== version) return;
				const page = (data.members || []) as unknown as MemberUser[];
				const total = data.totalMembers || 0;
				setUserData((prev) =>
					offset === 0 ? page : [...prev, ...page],
				);
				setTotalMembers(total);
				canLoadMoreRef.current = offset + page.length < total;
			} catch (error) {
				if (fetchVersionRef.current !== version) return;
				console.error("Error fetching user data:", error);
				setLoadError(
					getErrorMessage(
						error,
						`Could not load the ${memberLabel.toLowerCase()}s`,
					),
				);
			} finally {
				isFetchingRef.current = false;
				if (fetchVersionRef.current === version)
					setUserDataLoading(false);
			}
		}
		fetchUserData();
	}, [id, type, search, refreshData, offset, adminMode, source]);

	useEffect(() => {
		if (refreshList) {
			setRefreshData((prev) => prev + 1);
		}
	}, [refreshList]);

	const updateUserPermission = async (user: MemberUser, permission: Role) => {
		if (!id) return;
		const isProject = type === "PROJECT" || type === "WORKSPACE";
		// a level change keeps a model member's limit as it is
		const payload: PostUser = {
			userid: user.id,
			permission,
			...(type === "MODEL"
				? { usageLimit: toExplicitUsageLimit(user.usage_limit ?? null) }
				: {}),
		};
		const success = await (isProject
			? editProjectUserPermissions(id, [payload], adminMode)
			: editEngineUserPermissions(id, [payload], adminMode)
		).catch((error: Error) => {
			toast.error(error?.message || "Error updating user permission.");
			return false;
		});
		if (success) {
			setUserData((prev) =>
				prev.map((u) => (u.id === user.id ? { ...u, permission } : u)),
			);
			toast.success("User permission updated successfully.");
		}
	};

	const resetSelectedMembers = () => {
		setUsersToDelete([]);
		setSelectedIds(new Set());
		setRefreshData((prev) => prev + 1);
	};

	const deleteSelectedMembers = () => {
		if (isDeleting) return;
		const isProjectDel = type === "PROJECT" || type === "WORKSPACE";
		const userIds = usersToDelete.map((u) => u.id);
		setIsDeleting(true);

		(source
			? source.remove(usersToDelete)
			: isProjectDel
				? removeProjectUserPermissions(id ?? "", userIds, adminMode)
				: removeEngineUserPermissions(id ?? "", userIds, adminMode)
		)
			.then(() => {
				toast.success(
					`Selected ${memberLabel.toLowerCase()}s have been deleted successfully.`,
				);
			})
			.catch((error: Error) => {
				toast.error(
					error?.message ||
						`There was an error deleting the selected ${memberLabel.toLowerCase()}s.`,
				);
			})
			.finally(() => {
				setIsDeleting(false);
				resetSelectedMembers();
			});
	};

	const userDataFiltered =
		permission !== ""
			? userData.filter((user) => {
					if (permission !== "select access")
						return user.permission === permission;
					return true;
				})
			: userData;

	// a host decides who can change its members through readOnly
	const canActOnOwners = !hasPermissions || adminMode || isOwner;
	const canShowOwnerOption = adminMode || isOwner;
	const canEditMembers = hasPermissions
		? adminMode || myPermission === "OWNER" || myPermission === "EDIT"
		: !readOnly;
	// on a model, only its owners take away the access of someone with a usage
	// limit: the limit goes with it, and they would fall through to another one
	const canEndLimitedAccess = adminMode || isOwner;
	const canRemove = (user: MemberUser): boolean =>
		canEditMembers &&
		(user.permission !== "OWNER" || canActOnOwners) &&
		(type !== "MODEL" || !user.usage_limit || canEndLimitedAccess);
	const hasLimitedMembersToKeep =
		type === "MODEL" &&
		canEditMembers &&
		!canEndLimitedAccess &&
		userDataFiltered.some((user) => Boolean(user.usage_limit));
	// the selection is for taking access away
	const selectableUsers = userDataFiltered.filter(canRemove);
	const allSelected =
		selectableUsers.length > 0 &&
		selectableUsers.every((u) => selectedIds.has(u.id));
	const someSelected = selectableUsers.some((u) => selectedIds.has(u.id));
	const showSelectionAndActions = !isAddMember && !readOnly;
	const colCount =
		(type === "MODEL" ? 4 : 3) -
		(hasPermissions ? 0 : 1) +
		(showSelectionAndActions ? 2 : 0) +
		1;

	function toggleSelectAll() {
		if (allSelected) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(selectableUsers.map((u) => u.id)));
		}
	}

	function toggleSelectUser(user: MemberUser) {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(user.id)) next.delete(user.id);
			else next.add(user.id);
			return next;
		});
	}

	return (
		<>
			<div className="flex h-full w-full flex-col" id={membersListId}>
				{showSelectionAndActions && selectedIds.size > 0 && (
					<div className="flex items-center justify-between border border-destructive/30 bg-destructive/5 px-3 py-2">
						<span className="font-medium text-sm">
							{selectedIds.size} user
							{selectedIds.size !== 1 ? "s" : ""} selected
						</span>
						<Button
							type="button"
							variant="destructive"
							size="sm"
							onClick={() => {
								const users = userDataFiltered.filter((u) =>
									selectedIds.has(u.id),
								);
								setUsersToDelete(users);
							}}
						>
							<Trash2 className="me-1.5 h-4 w-4" />
							Delete Selected
						</Button>
					</div>
				)}
				<div className="max-h-[400px] w-full overflow-y-auto">
					<Table wrapperClassName="overflow-x-auto">
						<TableHeader className="sticky top-0 z-10 bg-background">
							<TableRow>
								{showSelectionAndActions && (
									<TableHead className="w-10">
										<Checkbox
											checked={
												allSelected
													? true
													: someSelected
														? "indeterminate"
														: false
											}
											onCheckedChange={toggleSelectAll}
											aria-label="Select all"
										/>
									</TableHead>
								)}
								<TableHead>Name</TableHead>
								<TableHead>Login Type</TableHead>
								{hasPermissions && (
									<TableHead>Permission</TableHead>
								)}
								{type === "MODEL" && (
									<TableHead>Usage Limit</TableHead>
								)}
								<TableHead>
									{hasPermissions
										? "Permission Date"
										: "Date Added"}
								</TableHead>
								{showSelectionAndActions && (
									<TableHead className="w-px whitespace-nowrap">
										Actions
									</TableHead>
								)}
							</TableRow>
						</TableHeader>
						<TableBody>
							{userDataFiltered.length > 0 ? (
								userDataFiltered.map((user) => (
									<TableRow
										key={`members-row-${user.type}-${user.id}`}
										data-state={
											selectedIds.has(user.id)
												? "selected"
												: undefined
										}
										className={
											!canEditMembers ||
											(user.permission === "OWNER" &&
												!canActOnOwners)
												? "opacity-50"
												: undefined
										}
									>
										{showSelectionAndActions && (
											<TableCell className="w-10">
												<Checkbox
													checked={selectedIds.has(
														user.id,
													)}
													disabled={!canRemove(user)}
													onCheckedChange={() =>
														toggleSelectUser(user)
													}
													aria-label={`Select ${user.name}`}
												/>
											</TableCell>
										)}
										<TableCell>
											{/* the login the session is signed in with, or the
											host's user id when the login type is not known */}
											<PersonIdentity
												name={user.name}
												type={user.type}
												id={user.id}
												email={user.email}
												isCurrentLogin={
													user.type
														? isCurrentLogin(
																user.type,
																user.id,
															)
														: user.id ===
															currentUserId
												}
											/>
										</TableCell>
										<TableCell>
											{user.type ? (
												<LoginTypeLabel
													type={user.type}
													className="text-sm"
												/>
											) : (
												<span className="text-sm">
													-
												</span>
											)}
										</TableCell>
										{hasPermissions && (
											<TableCell>
												{readOnly ? (
													<span className="text-sm">
														{getAccessLevelLabel(
															user.permission,
														)}
													</span>
												) : (
													<DropdownMenu>
														<DropdownMenuTrigger
															asChild
															disabled={
																!canEditMembers ||
																(user.permission ===
																	"OWNER" &&
																	!canActOnOwners)
															}
														>
															<Button
																type="button"
																variant="outline"
																size="default"
																className="w-32"
																disabled={
																	!canEditMembers ||
																	(user.permission ===
																		"OWNER" &&
																		!canActOnOwners)
																}
															>
																<span>
																	{getAccessLevelLabel(
																		user.permission,
																	)}
																</span>
																<ChevronDown className="ms-auto h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent>
															<DropdownMenuRadioGroup>
																<DropdownMenuCheckboxItem
																	checked={
																		returnAccessType(
																			user.permission,
																		) ===
																		"Viewer"
																	}
																	onCheckedChange={() =>
																		updateUserPermission(
																			user,
																			"READ_ONLY",
																		)
																	}
																>
																	Read-Only
																</DropdownMenuCheckboxItem>
																<DropdownMenuCheckboxItem
																	checked={
																		returnAccessType(
																			user.permission,
																		) ===
																		"Editor"
																	}
																	onCheckedChange={() =>
																		updateUserPermission(
																			user,
																			"EDIT",
																		)
																	}
																>
																	Editor
																</DropdownMenuCheckboxItem>
																{canShowOwnerOption && (
																	<DropdownMenuCheckboxItem
																		checked={
																			returnAccessType(
																				user.permission,
																			) ===
																			"Owner"
																		}
																		onCheckedChange={() =>
																			updateUserPermission(
																				user,
																				"OWNER",
																			)
																		}
																	>
																		Author
																	</DropdownMenuCheckboxItem>
																)}
															</DropdownMenuRadioGroup>
														</DropdownMenuContent>
													</DropdownMenu>
												)}
											</TableCell>
										)}
										{type === "MODEL" && (
											<TableCell className="max-w-64">
												<span
													className={
														user.usage_limit
															? "text-sm"
															: "text-muted-foreground text-sm"
													}
												>
													{describeModelUsageLimit(
														user.usage_limit,
													)}
												</span>
											</TableCell>
										)}
										<TableCell>
											<span className="text-muted-foreground text-sm">
												{user.date_added ?? "-"}
											</span>
										</TableCell>
										{showSelectionAndActions && (
											<TableCell>
												<div className="flex items-center gap-1">
													{hasPermissions && (
														<Button
															type="button"
															variant="outline"
															size="icon-sm"
															className="border-none"
															aria-label={`Edit ${user.name}`}
															disabled={
																!canEditMembers ||
																(user.permission ===
																	"OWNER" &&
																	!canActOnOwners)
															}
															onClick={() =>
																onEdit?.(user)
															}
														>
															<Pencil className="h-4 w-4" />
														</Button>
													)}
													<Button
														type="button"
														variant="outline"
														size="icon-sm"
														className="border-none"
														aria-label={`Delete ${user.name}`}
														disabled={
															!canRemove(user)
														}
														onClick={() =>
															setUsersToDelete(
																(prev) => [
																	...prev,
																	user,
																],
															)
														}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										)}
									</TableRow>
								))
							) : userDataLoading ? (
								<TableRow>
									<TableCell
										colSpan={colCount}
										className="text-center"
									>
										Loading...
									</TableCell>
								</TableRow>
							) : loadError ? (
								<TableRow>
									<TableCell colSpan={colCount}>
										<div className="flex flex-col items-center gap-2 py-2 text-center">
											<span className="text-destructive text-sm">
												{loadError}
											</span>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() =>
													setRefreshData(
														(prev) => prev + 1,
													)
												}
											>
												Try Again
											</Button>
										</div>
									</TableCell>
								</TableRow>
							) : (
								<TableRow>
									<TableCell
										colSpan={colCount}
										className="text-center"
									>
										<Muted>
											No {memberLabel.toLowerCase()}s
											found
										</Muted>
									</TableCell>
								</TableRow>
							)}
							<tr id={apiCallTriggerId} />
						</TableBody>
					</Table>
				</div>
				{hasLimitedMembersToKeep ? (
					<p className="mt-2 text-muted-foreground text-xs">
						{OWNERS_END_LIMITED_ACCESS_REASON}.
					</p>
				) : null}
				<p className="mt-2 text-end text-muted-foreground text-sm">
					{userData.length} of {totalMembers}{" "}
					{memberLabel.toLowerCase()}
					{totalMembers === 1 ? "" : "s"}
				</p>
			</div>
			<Dialog
				open={usersToDelete.length > 0}
				onOpenChange={() => {
					if (!isDeleting) resetSelectedMembers();
				}}
			>
				<DialogContent className="w-full max-w-md">
					<DialogTitle className="font-medium text-base leading-6">
						{usersToDelete.length === 1
							? `Delete ${memberLabel}`
							: `Delete ${usersToDelete.length} ${memberLabel}s`}
					</DialogTitle>
					<DialogDescription>
						{hasPermissions
							? "Remove member access from this resource. This action cannot be undone."
							: `Remove the selected ${memberLabel.toLowerCase()}s. This action cannot be undone.`}
					</DialogDescription>
					<div className="flex max-h-64 flex-col gap-2 overflow-y-auto py-2 pe-1">
						{usersToDelete.map((u) => (
							<div
								key={`${u.type}-${u.id}`}
								className="rounded-md border bg-muted/40 px-3 py-2.5"
							>
								<PersonIdentity
									name={u.name}
									type={u.type}
									id={u.id}
									email={u.email}
									isCurrentLogin={isCurrentLogin(
										u.type,
										u.id,
									)}
								/>
							</div>
						))}
					</div>
					<DialogFooter>
						<Button
							variant="ghost"
							disabled={isDeleting}
							onClick={resetSelectedMembers}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={isDeleting}
							onClick={deleteSelectedMembers}
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
