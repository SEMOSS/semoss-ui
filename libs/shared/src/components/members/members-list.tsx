import { ChevronDown, Pencil, Star, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Env, get, post } from "@semoss/sdk";
import {
	Avatar,
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
import { returnAccessType } from "./common";

export interface MemberUser {
	id: string;
	name: string;
	type: string;
	email: string;
	permission: string;
	permission_granted_by: string;
	permission_granted_by_type: string;
	date_added: string;
	usage_restriction?: string;
	usage_frequency?: string;
	max_tokens?: number;
	max_input_tokens?: number;
	max_output_tokens?: number;
	max_response_time?: number;
	restrict_per_model?: boolean;
}

interface MembersProps {
	id: string;
	type:
		| "PROJECT"
		| "ENGINE"
		| "DATABASE"
		| "STORAGE"
		| "MODEL"
		| "VECTOR"
		| "FUNCTION"
		| "WORKSPACE"
		| "GUARDRAIL";
	search?: string;
	isAddMember?: boolean;
	refreshList?: number;
	permission?: string;
	onEdit?: (user: MemberUser) => void;
	isOwner?: boolean;
	adminMode?: boolean;
	currentUserId?: string;
	myPermission?: string;
	/**
	 * Read-only mode: hides bulk-select, the checkbox column, the
	 * per-row Actions, and renders permission as static text.
	 */
	readOnly?: boolean;
}

const formatValue = (input?: string) => {
	if (!input) return "—";
	const mappings: Record<string, string> = {
		DAY: "Daily",
		WEEK: "Weekly",
		MONTH: "Monthly",
		YEAR: "Yearly",
		ALL_TIME: "All time",
	};
	return mappings[input.toUpperCase()] ?? input;
};

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
}: MembersProps) => {
	const [userData, setUserData] = useState<MemberUser[]>([]);
	const [totalMembers, setTotalMembers] = useState<number>(0);
	const [refreshData, setRefreshData] = useState<number>(0);
	const [offset, setOffset] = useState<number>(0);
	const [usersToDelete, setUsersToDelete] = useState<MemberUser[]>([]);
	const [userDataLoading, setUserDataLoading] = useState<boolean>(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const membersListId = `members-table-list-container-${isAddMember ? "add-member" : "default"}`;
	const apiCallTriggerId = `triggerAPICall-${isAddMember ? "add-member" : "default"}`;
	const isFetchingRef = useRef(false);
	const fetchVersionRef = useRef(0);
	const canLoadMoreRef = useRef(false);

	// Reset to page 0 whenever identity or search changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset
	useEffect(() => {
		setOffset(0);
		setUserData([]);
		setTotalMembers(0);
		canLoadMoreRef.current = false;
		isFetchingRef.current = false;
	}, [id, type, search, refreshData]);

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
		const version = ++fetchVersionRef.current;
		async function fetchUserData() {
			isFetchingRef.current = true;
			setUserDataLoading(true);
			const authBase = `${Env.MODULE}/api/auth${adminMode ? "/admin" : ""}`;
			const isProject = type === "PROJECT" || type === "WORKSPACE";
			try {
				const response = await get(
					`${authBase}/${isProject ? "project" : "engine"}/${isProject ? "getProjectUsers" : "getEngineUsers"}?${isProject ? "projectId" : "engineId"}=${id}&limit=50&offset=${offset}${search !== "" ? `&userId=${search}` : ""}`,
				).catch((error) => {
					throw Error(error);
				});
				if (fetchVersionRef.current !== version) return;
				if (response?.data) {
					const data = response.data as {
						members?: MemberUser[];
						totalMembers?: number;
					};
					const page: MemberUser[] = data.members || [];
					const total: number = data.totalMembers || 0;
					setUserData((prev) =>
						offset === 0 ? page : [...prev, ...page],
					);
					setTotalMembers(total);
					canLoadMoreRef.current = offset + page.length < total;
				}
			} catch (error) {
				if (fetchVersionRef.current !== version) return;
				console.error("Error fetching user data:", error);
			} finally {
				isFetchingRef.current = false;
				if (fetchVersionRef.current === version)
					setUserDataLoading(false);
			}
		}
		fetchUserData();
	}, [id, type, search, refreshData, offset, adminMode]);

	useEffect(() => {
		if (refreshList) {
			setRefreshData((prev) => prev + 1);
		}
	}, [refreshList]);

	const updateUserPermission = async (
		user: MemberUser,
		permission: string,
	) => {
		const authBase = `${Env.MODULE}/api/auth${adminMode ? "/admin" : ""}`;
		const isProject = type === "PROJECT" || type === "WORKSPACE";
		const url = `${authBase}/${isProject ? "project" : "engine"}/${isProject ? "editProjectUserPermissions" : "editEngineUserPermissions"}`;
		const payload: Record<string, unknown> = {
			userid: user.id,
			permission,
		};
		if (type === "MODEL" || type === "PROJECT" || type === "WORKSPACE") {
			const hasAnyLimit =
				user.max_tokens != null ||
				user.max_input_tokens != null ||
				user.max_output_tokens != null;
			const hasComputeTime = user.max_response_time != null;
			if (hasAnyLimit) {
				payload.usageRestriction = "token";
				payload.usageFrequency = user.usage_frequency;
				if (user.max_tokens != null)
					payload.maxTokens = user.max_tokens;
				if (user.max_input_tokens != null)
					payload.maxInputTokens = user.max_input_tokens;
				if (user.max_output_tokens != null)
					payload.maxOutputTokens = user.max_output_tokens;
			}
			if (hasComputeTime) {
				if (!hasAnyLimit) {
					payload.usageRestriction = "compute";
					payload.usageFrequency = user.usage_frequency;
				}
				payload.maxResponseTime = user.max_response_time;
			}
		}
		const response = await post(url, {
			[isProject ? "projectId" : "engineId"]: id,
			userpermissions: [payload],
		}).catch((error: Error) => {
			toast.error(error?.message || "Error updating user permission.");
		});
		if ((response?.data as { success?: boolean })?.success) {
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
		const authBase = `${Env.MODULE}/api/auth${adminMode ? "/admin" : ""}`;
		const isProjectDel = type === "PROJECT" || type === "WORKSPACE";
		const usersUrl = isProjectDel
			? "removeProjectUserPermissions"
			: "removeEngineUserPermissions";

		post(`${authBase}/${isProjectDel ? "project" : "engine"}/${usersUrl}`, {
			[isProjectDel ? "projectId" : "engineId"]: id,
			ids: usersToDelete.map((u) => u.id),
		})
			.then(() => {
				toast.success(
					"Selected members have been deleted successfully.",
				);
				resetSelectedMembers();
			})
			.catch((error: Error) => {
				toast.error(
					error?.message ||
						"There was an error deleting the selected members.",
				);
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

	const canActOnOwners = adminMode || isOwner;
	const canShowOwnerOption = adminMode || isOwner;
	const canEditMembers =
		adminMode || myPermission === "OWNER" || myPermission === "EDIT";
	const selectableUsers = userDataFiltered.filter(
		(u) => (u.permission !== "OWNER" || canActOnOwners) && canEditMembers,
	);
	const allSelected =
		selectableUsers.length > 0 &&
		selectableUsers.every((u) => selectedIds.has(u.id));
	const someSelected = selectableUsers.some((u) => selectedIds.has(u.id));
	const showSelectionAndActions = !isAddMember && !readOnly;
	const colCount =
		(type === "MODEL" ? 6 : 3) + (showSelectionAndActions ? 2 : 0) + 1;

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
								<TableHead>Permission</TableHead>
								{(type === "MODEL" ||
									type === "PROJECT" ||
									type === "WORKSPACE") && (
									<>
										<TableHead>Combined Limit</TableHead>
										<TableHead>Input Limit</TableHead>
										<TableHead>Output Limit</TableHead>
										<TableHead>Compute Time</TableHead>
										<TableHead>Frequency</TableHead>
									</>
								)}
								<TableHead>Permission Date</TableHead>
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
													disabled={
														!canEditMembers ||
														(user.permission ===
															"OWNER" &&
															!canActOnOwners)
													}
													onCheckedChange={() =>
														toggleSelectUser(user)
													}
													aria-label={`Select ${user.name}`}
												/>
											</TableCell>
										)}
										<TableCell>
											<div className="flex items-center gap-2">
												{user.id === currentUserId ? (
													<Avatar className="items-center justify-center bg-primary/10 text-primary">
														<Star className="h-4 w-4 fill-primary" />
													</Avatar>
												) : (
													<Avatar className="items-center justify-center bg-[#ECEDEF] text-gray-500">
														{user.name
															.charAt(0)
															.toUpperCase()}
													</Avatar>
												)}
												<span className="flex flex-col overflow-hidden">
													<span className="font-semibold text-accent-foreground text-sm">
														{user.name}
													</span>
													<span className="text-muted-foreground text-xs">
														id: {user.id}
													</span>
													<span className="text-muted-foreground text-xs">
														email: {user.email}
													</span>
												</span>
											</div>
										</TableCell>
										<TableCell>
											<span className="text-sm">
												{user.type ?? "—"}
											</span>
										</TableCell>
										<TableCell>
											{readOnly ? (
												<span className="text-sm">
													{returnAccessType(
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
															className="w-[120px]"
															disabled={
																!canEditMembers ||
																(user.permission ===
																	"OWNER" &&
																	!canActOnOwners)
															}
														>
															<span>
																{returnAccessType(
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
																Viewer
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
																	Owner
																</DropdownMenuCheckboxItem>
															)}
														</DropdownMenuRadioGroup>
													</DropdownMenuContent>
												</DropdownMenu>
											)}
										</TableCell>
										{(type === "MODEL" ||
											type === "PROJECT" ||
											type === "WORKSPACE") &&
											(() => {
												const combinedLimit =
													user.max_tokens != null
														? user.max_tokens.toLocaleString()
														: "—";
												const inputLimit =
													user.max_input_tokens !=
													null
														? user.max_input_tokens.toLocaleString()
														: "—";
												const outputLimit =
													user.max_output_tokens !=
													null
														? user.max_output_tokens.toLocaleString()
														: "—";
												const computeTime =
													user.max_response_time !=
													null
														? user.max_response_time.toLocaleString()
														: "—";
												return (
													<>
														<TableCell>
															<span className="text-sm">
																{combinedLimit}
															</span>
														</TableCell>
														<TableCell>
															<span className="text-sm">
																{inputLimit}
															</span>
														</TableCell>
														<TableCell>
															<span className="text-sm">
																{outputLimit}
															</span>
														</TableCell>
														<TableCell>
															<span className="text-sm">
																{computeTime}
															</span>
														</TableCell>
														<TableCell>
															<span className="text-sm">
																{formatValue(
																	user.usage_frequency,
																)}
															</span>
														</TableCell>
													</>
												);
											})()}
										<TableCell>
											<span className="text-muted-foreground text-sm">
												{user.date_added ?? "—"}
											</span>
										</TableCell>
										{showSelectionAndActions && (
											<TableCell>
												<div className="flex items-center gap-1">
													<Button
														type="button"
														variant="outline"
														size="icon-sm"
														className="border-none"
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
													<Button
														type="button"
														variant="outline"
														size="icon-sm"
														className="border-none"
														disabled={
															!canEditMembers ||
															(user.permission ===
																"OWNER" &&
																!canActOnOwners)
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
							) : (
								<TableRow>
									<TableCell
										colSpan={colCount}
										className="text-center"
									>
										<Muted>No members found</Muted>
									</TableCell>
								</TableRow>
							)}
							<tr id={apiCallTriggerId} />
						</TableBody>
					</Table>
				</div>
				<p className="mt-2 text-end text-muted-foreground text-sm">
					{userData.length} of {totalMembers}{" "}
					{totalMembers === 1 ? "member" : "members"}
				</p>
			</div>
			<Dialog
				open={usersToDelete.length > 0}
				onOpenChange={resetSelectedMembers}
			>
				<DialogContent className="w-full max-w-md">
					<DialogTitle>
						{usersToDelete.length === 1
							? "Delete Member"
							: `Delete ${usersToDelete.length} Members`}
					</DialogTitle>
					<DialogDescription>
						Remove member access from this resource. This action
						cannot be undone.
					</DialogDescription>
					<div className="flex max-h-64 flex-col gap-2 overflow-y-auto py-2 pe-1">
						{usersToDelete.map((u) => (
							<div
								key={`${u.type}-${u.id}`}
								className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2.5"
							>
								<Avatar className="h-9 w-9 items-center justify-center bg-muted text-muted-foreground text-sm">
									{u.name.charAt(0).toUpperCase()}
								</Avatar>
								<div className="flex flex-col">
									<span className="font-medium text-sm">
										{u.name}
									</span>
									<span className="text-muted-foreground text-xs">
										id: {u.id}
									</span>
									<span className="text-muted-foreground text-xs">
										email: {u.email}
									</span>
								</div>
							</div>
						))}
					</div>
					<DialogFooter>
						<Button variant="ghost" onClick={resetSelectedMembers}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={deleteSelectedMembers}
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
