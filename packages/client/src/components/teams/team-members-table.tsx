import type { AxiosResponse } from "axios";
import { Search, Trash2, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Avatar,
	AvatarFallback,
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
	toast,
} from "@semoss/ui/next";
import {
	addTeamUser,
	deleteTeamUser,
	getNonTeamUsers,
	getTeamUsers,
	getTeamUsersCount,
} from "@/api/teams";
import { useServerPagination } from "@/hooks";

interface MembersTableProps {
	/**
	 * Id of the setting
	 */
	groupId: string;

	name: string;
}

interface TeamMember {
	admin: boolean;
	countrycode: string;
	email: string;
	exporter: boolean;
	id: string;
	name: string;
	phone: string;
	phoneextension: string;
	publisher: boolean;
	type: string;
	username: string;
	userid?: string;
	dateadded?: string;
}

export const TeamMembersTable = (props: MembersTableProps) => {
	const { groupId } = props;

	const AUTOCOMPLETE_LIMIT = 10;
	const AUTOCOMPLETE_OFFSET = 0;

	/** Member Table State */
	const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([]);
	const [count, setCount] = useState(0);

	/** Delete Member */
	const [deleteMembersModal, setDeleteMembersModal] =
		useState<boolean>(false);
	const [deleteMemberModal, setDeleteMemberModal] = useState<boolean>(false);
	const [userToDelete, setUserToDelete] = useState<TeamMember | null>(null);

	/** Add Member State */
	const [addMembersModal, setAddMembersModal] = useState<boolean>(false);
	const [nonCredentialedUsers, setNonCredentialedUsers] = useState<
		TeamMember[]
	>([]);
	const [selectedNonCredentialedUsers, setSelectedNonCredentialedUsers] =
		useState<TeamMember[]>([]);

	const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
	const [memberCount, setMemberCount] = useState(0);
	const [totalMembersAll, setTotalMembersAll] = useState(0);
	const [hasMembers, setHasMembers] = useState(false);

	const [searchFilter, setSearchFilter] = useState("");
	const isLoadingRef = useRef(false);
	const lastNonGroupQueryRef = useRef("");

	const [searchMemberInput, setSearchMemberInput] = useState<string>("");
	const [offset, setOffset] = useState(AUTOCOMPLETE_OFFSET);
	const [isScrollBottom, setIsScrollBottom] = useState(false);
	const [canCollect, setCanCollect] = useState<boolean>(true);
	const [_isLoading, setIsLoading] = useState<boolean>(false);
	const [searchLoading, setSearchLoading] = useState(false);

	const {
		page: membersPage,
		rowsPerPage,
		setPage: setMembersPage,
		setRowsPerPage,
		offset: pageOffset,
		totalPages,
		startRow,
		endRow,
	} = useServerPagination({
		totalCount: memberCount,
		initialRowsPerPage: 5,
		pageIndexBase: 1,
	});

	const nearBottom = (
		target: {
			scrollHeight?: number;
			scrollTop?: number;
			clientHeight?: number;
		} = {},
	) => {
		const diff = Math.round(target.scrollHeight - target.scrollTop);
		return diff - 25 <= target.clientHeight;
	};

	const filteredNonCredentialedUsers = Array.from(
		new Map(
			nonCredentialedUsers
				.filter(
					(user) =>
						!teamMembers.some(
							(member) => member.userid === user.id,
						),
				)
				.map((user) => [user.id, user]),
		).values(),
	);

	const getAdditionalUsersNonGroup = useCallback(() => {
		setOffset((prev) => prev + AUTOCOMPLETE_LIMIT);
	}, []);

	const getUsersNonGroup = useCallback(
		async (reset: boolean, nextOffset: number, nextSearch: string) => {
			if (isLoadingRef.current) {
				return;
			}
			isLoadingRef.current = true;
			setIsLoading(true);
			try {
				const response = await getNonTeamUsers(
					groupId,
					AUTOCOMPLETE_LIMIT,
					nextOffset,
					nextSearch,
				);

				if (response) {
					const users = (response as unknown as TeamMember[]).map(
						(val) => {
							return {
								...val,
							};
						},
					);
					setNonCredentialedUsers((prev) =>
						reset ? users : prev.concat(users),
					);
					setCanCollect(users.length === AUTOCOMPLETE_LIMIT);
					setSearchLoading(false);
				}
			} catch (e) {
				toast.error(String(e));
				setSearchLoading(false);
			} finally {
				isLoadingRef.current = false;
				setIsLoading(false);
			}
		},
		[groupId],
	);

	useEffect(() => {
		const refreshToken = count;
		if (refreshToken < 0) {
			return;
		}

		let isMounted = true;

		const loadMembers = async () => {
			try {
				const response = await getTeamUsers(
					groupId,
					rowsPerPage,
					pageOffset,
					searchFilter,
				);
				if (!isMounted) {
					return;
				}

				let members = Array.isArray(response)
					? (response as TeamMember[])
					: [];
				const total = memberCount;

				if (
					members.length < rowsPerPage &&
					total > pageOffset + members.length
				) {
					const remaining = rowsPerPage - members.length;
					const extraResponse = await getTeamUsers(
						groupId,
						remaining,
						pageOffset + members.length,
						searchFilter,
					);
					if (!isMounted) {
						return;
					}
					const extraMembers = Array.isArray(extraResponse)
						? (extraResponse as TeamMember[])
						: [];
					members = [...members, ...extraMembers];
				}

				setTeamMembers(members);
				setHasMembers(members.length > 0);
			} catch (e) {
				toast.error(String(e));
				setTeamMembers([]);
				setHasMembers(false);
			}
		};

		loadMembers();

		return () => {
			isMounted = false;
		};
	}, [
		groupId,
		count,
		membersPage,
		searchFilter,
		rowsPerPage,
		memberCount,
		pageOffset,
	]);

	useEffect(() => {
		const refreshToken = count;
		if (refreshToken < 0 || !groupId) {
			return;
		}
		const trimmed = searchFilter.trim();
		getTeamUsersCount(groupId, trimmed || undefined)
			.then((nextCount) => {
				if (trimmed) {
					setMemberCount(nextCount);
				} else {
					setTotalMembersAll(nextCount);
					setMemberCount(nextCount);
				}
			})
			.catch((e) => {
				toast.error(String(e));
				if (trimmed) {
					setMemberCount(0);
				} else {
					setTotalMembersAll(0);
					setMemberCount(0);
				}
			});
	}, [groupId, searchFilter, count]);

	useEffect(() => {
		if (!addMembersModal) {
			return;
		}
		if (isScrollBottom) {
			if (canCollect) {
				getAdditionalUsersNonGroup();
			}
		}
	}, [
		addMembersModal,
		isScrollBottom,
		canCollect,
		getAdditionalUsersNonGroup,
	]);

	useEffect(() => {
		if (!addMembersModal) {
			return;
		}
		const queryKey = `${groupId}|${offset}|${searchMemberInput}`;
		if (lastNonGroupQueryRef.current === queryKey) {
			return;
		}
		lastNonGroupQueryRef.current = queryKey;
		if (searchMemberInput) {
			setSearchLoading(true);
		}
		const timer = setTimeout(() => {
			if (!offset) {
				getUsersNonGroup(true, 0, searchMemberInput);
			} else {
				if (canCollect) {
					getUsersNonGroup(false, offset, searchMemberInput);
				}
			}
		}, 500);
		return () => clearTimeout(timer);
	}, [
		addMembersModal,
		offset,
		searchMemberInput,
		canCollect,
		getUsersNonGroup,
		groupId,
	]);

	const submitNonGroupUsers = async () => {
		try {
			// construct requests for post data
			const requests = selectedNonCredentialedUsers.map((m) => {
				return {
					userid: m.id,
					type: m.type,
				};
			});

			if (requests.length === 0) {
				toast.warning("No users to add");
				return;
			}

			for (let i = 0; i < requests.length; i++) {
				let response:
					| AxiosResponse<{ success: boolean }>
					| {
							response: Response;
							data: {
								success: boolean;
							};
					  }
					| null = null;
				response = await addTeamUser(
					groupId,
					requests[i].type,
					requests[i].userid,
					true,
				);

				if (!response) {
					return;
				}

				if (response) {
					setAddMembersModal(false);
					setSelectedNonCredentialedUsers([]);
					toast.success("Successfully added member permissions");
				} else {
					toast.error("Error changing user permissions");
				}
			}
		} catch (e) {
			setAddMembersModal(false);
			setSelectedNonCredentialedUsers([]);
			toast.error(String(e));
		} finally {
			// refresh the members
			setCount((prev) => prev + 1);
			setOffset(0);
		}
	};

	const deleteUser = async (user: TeamMember) => {
		try {
			let response:
				| AxiosResponse<{ success: boolean }>
				| {
						response: Response;
						data: {
							success: boolean;
						};
				  }
				| null = null;
			response = await deleteTeamUser({
				groupid: groupId,
				type: user.type,
				userid: user.userid ?? user.id,
			});

			if (!response) {
				return;
			}

			toast.success("Successfully removed user");
		} catch (e) {
			toast.error(String(e));
		} finally {
			setDeleteMemberModal(false);
			setCount((prev) => prev + 1);
		}
	};

	const deleteTeamUsers = async () => {
		try {
			for (let i = 0; i < selectedMembers.length; i++) {
				try {
					let response:
						| AxiosResponse<{ success: boolean }>
						| {
								response: Response;
								data: {
									success: boolean;
								};
						  }
						| null = null;
					response = await deleteTeamUser({
						groupid: groupId,
						type: selectedMembers[i].type,
						userid:
							selectedMembers[i].userid ?? selectedMembers[i].id,
					});

					if (!response) {
						return;
					}
				} catch (e) {
					toast.error(String(e));
				} finally {
					setDeleteMemberModal(false);
				}
			}
		} finally {
			toast.success("Successfully removed users");
			setCount((prevCount) => {
				return prevCount + 1;
			});
			setDeleteMembersModal(false);
			setSelectedMembers([]);
		}
	};

	/** HELPERS */
	const Avatars = useMemo(() => {
		if (!teamMembers) return [];

		let i = 0;
		const avatarList = [];
		while (i < 5 && i < teamMembers.length) {
			const name = teamMembers[i].name || "";
			avatarList.push(
				<Avatar key={i} className="h-7 w-7">
					<AvatarFallback className="text-xs">
						{name.charAt(0).toUpperCase()}
					</AvatarFallback>
				</Avatar>,
			);

			i++;
		}

		return avatarList;
	}, [teamMembers]);

	const handleToggleMember = (user: TeamMember) => {
		const isSelected = selectedMembers.some(
			(value) => value.userid === user.userid,
		);
		if (isSelected) {
			setSelectedMembers(
				selectedMembers.filter((m) => m.userid !== user.userid),
			);
		} else {
			setSelectedMembers([...selectedMembers, user]);
		}
	};

	const handleToggleCandidate = (user: TeamMember) => {
		const isSelected = selectedNonCredentialedUsers.some(
			(value) => value.id === user.id,
		);
		if (isSelected) {
			setSelectedNonCredentialedUsers(
				selectedNonCredentialedUsers.filter((m) => m.id !== user.id),
			);
		} else {
			setSelectedNonCredentialedUsers([
				...selectedNonCredentialedUsers,
				user,
			]);
		}
	};

	const isAllSelected =
		selectedMembers.length === teamMembers.length && teamMembers.length > 0;

	return (
		<div className="flex w-full flex-col gap-6">
			{(teamMembers && teamMembers.length > 0) ||
			memberCount > 0 ||
			hasMembers ||
			searchFilter ? (
				<Card>
					<CardHeader className="flex flex-col gap-4">
						<div className="flex flex-wrap items-center gap-3">
							<CardTitle>Members</CardTitle>
							<div className="-space-x-2 flex items-center">
								{Avatars}
							</div>
							<span className="text-muted-foreground text-sm">
								{searchFilter.trim()
									? `${memberCount} of ${totalMembersAll} Members`
									: `${totalMembersAll} Members`}
							</span>
						</div>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<InputGroup className="w-full sm:max-w-sm">
								<InputGroupAddon>
									<Search className="size-4" />
								</InputGroupAddon>
								<InputGroupInput
									placeholder="Search Members"
									value={searchFilter}
									onChange={(e) => {
										setSearchFilter(e.target.value);
									}}
								/>
							</InputGroup>
							<div className="flex items-center gap-2 sm:flex-nowrap">
								<Button
									variant="default"
									className="shrink-0"
									onClick={() => {
										setOffset(0);
										setNonCredentialedUsers([]);
										setSearchMemberInput("");
										setAddMembersModal(true);
									}}
								>
									<UserPlus className="size-4" />
									Add Members
								</Button>
								{selectedMembers.length > 0 && (
									<Button
										variant="outline"
										className="whitespace-nowrap border-destructive text-destructive hover:bg-destructive/10"
										onClick={() =>
											setDeleteMembersModal(true)
										}
									>
										<Trash2 className="size-4" />
										Delete Selected
									</Button>
								)}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-12">
											<div className="flex justify-center">
												<Checkbox
													checked={isAllSelected}
													onCheckedChange={() => {
														if (!isAllSelected) {
															setSelectedMembers(
																teamMembers,
															);
														} else {
															setSelectedMembers(
																[],
															);
														}
													}}
												/>
											</div>
										</TableHead>
										<TableHead>Name</TableHead>
										<TableHead>Added Date</TableHead>
										<TableHead className="text-right">
											Action
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{Array.isArray(teamMembers) &&
									teamMembers.length > 0 ? (
										teamMembers.map((user) => (
											<TableRow key={user.userid}>
												<TableCell className="w-12">
													<div className="flex justify-center">
														<Checkbox
															checked={selectedMembers.some(
																(value) =>
																	value.userid ===
																	user.userid,
															)}
															onCheckedChange={() =>
																handleToggleMember(
																	user,
																)
															}
														/>
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-3">
														<Avatar className="h-8 w-8">
															<AvatarFallback className="text-xs">
																{user.name
																	? user.name[0].toUpperCase()
																	: "U"}
															</AvatarFallback>
														</Avatar>
														<div className="min-w-0">
															<div className="truncate font-medium text-sm">
																{user.name}
															</div>
															<div className="text-muted-foreground text-xs">
																{`${user.type} ID: ${user.userid}`}
															</div>
														</div>
													</div>
												</TableCell>
												<TableCell className="whitespace-nowrap text-sm">
													{user.dateadded}
												</TableCell>
												<TableCell className="text-right">
													<Button
														variant="ghost"
														size="icon-sm"
														onClick={() => {
															setUserToDelete(
																user,
															);
															setDeleteMemberModal(
																true,
															);
														}}
													>
														<Trash2 className="size-4" />
													</Button>
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell
												colSpan={4}
												className="text-center"
											>
												No Members found.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
								<TableFooter>
									<TableRow>
										<TableCell colSpan={4}>
											<div className="flex flex-wrap items-center justify-end gap-4">
												<div className="flex items-center gap-2 text-sm">
													<span>Rows per page:</span>
													<Select
														value={String(
															rowsPerPage,
														)}
														onValueChange={(
															value,
														) => {
															setRowsPerPage(
																parseInt(
																	value,
																	10,
																),
															);
														}}
													>
														<SelectTrigger className="h-8 w-[70px]">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															{[5, 10, 20].map(
																(val) => (
																	<SelectItem
																		key={`rows-${val}`}
																		value={String(
																			val,
																		)}
																	>
																		{val}
																	</SelectItem>
																),
															)}
														</SelectContent>
													</Select>
												</div>
												<div className="text-muted-foreground text-sm">
													{startRow}-{endRow} of{" "}
													{memberCount}
												</div>
												<div className="flex gap-1">
													<Button
														variant="outline"
														size="icon-sm"
														onClick={() =>
															setMembersPage(1)
														}
														disabled={
															membersPage === 1
														}
													>
														{"<<"}
													</Button>
													<Button
														variant="outline"
														size="icon-sm"
														onClick={() =>
															setMembersPage(
																Math.max(
																	1,
																	membersPage -
																		1,
																),
															)
														}
														disabled={
															membersPage === 1
														}
													>
														{"<"}
													</Button>
													<Button
														variant="outline"
														size="icon-sm"
														onClick={() =>
															setMembersPage(
																Math.min(
																	totalPages,
																	membersPage +
																		1,
																),
															)
														}
														disabled={
															membersPage >=
															totalPages
														}
													>
														{">"}
													</Button>
													<Button
														variant="outline"
														size="icon-sm"
														onClick={() =>
															setMembersPage(
																totalPages,
															)
														}
														disabled={
															membersPage >=
															totalPages
														}
													>
														{">>"}
													</Button>
												</div>
											</div>
										</TableCell>
									</TableRow>
								</TableFooter>
							</Table>
						</div>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>Members</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-center">
							<p className="text-muted-foreground text-sm">
								No members present
							</p>
							<Button
								onClick={() => {
									setOffset(0);
									setNonCredentialedUsers([]);
									setSearchMemberInput("");
									setAddMembersModal(true);
								}}
							>
								<UserPlus className="size-4" />
								Add Members
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			<Dialog
				open={addMembersModal}
				onOpenChange={(open) => {
					if (!open) {
						setAddMembersModal(false);
						setOffset(0);
						setNonCredentialedUsers([]);
						setSelectedNonCredentialedUsers([]);
						setSearchMemberInput("");
						lastNonGroupQueryRef.current = "";
					} else {
						setAddMembersModal(true);
					}
				}}
			>
				<DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Add Members</DialogTitle>
						<DialogDescription>
							Search and select users to add to this team.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-4">
						<InputGroup>
							<InputGroupAddon>
								<Search className="size-4" />
							</InputGroupAddon>
							<InputGroupInput
								placeholder="Search"
								value={searchMemberInput}
								onChange={(e) => {
									setSearchMemberInput(e.target.value);
									setOffset(0);
								}}
							/>
						</InputGroup>
						<div
							className="max-h-[280px] overflow-auto rounded-md border p-2"
							onScroll={({ currentTarget }) =>
								setIsScrollBottom(nearBottom(currentTarget))
							}
						>
							{filteredNonCredentialedUsers.length === 0 ? (
								<p className="p-4 text-center text-muted-foreground text-sm">
									{searchLoading
										? "Loading users..."
										: "No users found"}
								</p>
							) : (
								filteredNonCredentialedUsers.map((user) => {
									const isSelected =
										selectedNonCredentialedUsers.some(
											(value) => value.id === user.id,
										);
									const initials = user.name
										? user.name
												.split(" ")
												.map((n) => n[0])
												.join("")
												.toUpperCase()
										: user.id[0].toUpperCase();
									return (
										<div
											key={user.id}
											className="flex items-center gap-3 rounded-md p-3 hover:bg-muted/50"
										>
											<Checkbox
												checked={isSelected}
												onCheckedChange={() =>
													handleToggleCandidate(user)
												}
											/>
											<Avatar className="h-8 w-8">
												<AvatarFallback className="text-xs">
													{initials}
												</AvatarFallback>
											</Avatar>
											<div className="flex flex-1 flex-col gap-1">
												<div className="font-medium text-sm">
													{user.name}
												</div>
												<div className="text-muted-foreground text-xs">
													User ID: {user.id}
												</div>
												<div className="text-muted-foreground text-xs">
													Email: {user.email}
												</div>
												<div className="text-muted-foreground text-xs">
													Type: {user.type}
												</div>
											</div>
										</div>
									);
								})
							)}
						</div>
						{selectedNonCredentialedUsers.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{selectedNonCredentialedUsers.map((user) => (
									<Badge
										key={`selected-${user.id}`}
										variant="secondary"
										className="flex items-center gap-1"
									>
										{user.name}
										<button
											type="button"
											className="rounded-full p-0.5 hover:bg-muted"
											onClick={() =>
												handleToggleCandidate(user)
											}
										>
											<X className="size-3" />
										</button>
									</Badge>
								))}
							</div>
						) : null}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setAddMembersModal(false);
								setOffset(0);
								setNonCredentialedUsers([]);
								setSelectedNonCredentialedUsers([]);
							}}
						>
							Cancel
						</Button>
						<Button
							disabled={selectedNonCredentialedUsers.length < 1}
							onClick={() => {
								submitNonGroupUsers();
							}}
						>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={deleteMemberModal}
				onOpenChange={setDeleteMemberModal}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Are you sure?</DialogTitle>
						<DialogDescription>
							{userToDelete ? (
								<>
									This will remove{" "}
									<span className="font-medium text-foreground">
										{userToDelete.name}
									</span>
									.
								</>
							) : (
								"This will remove the selected user."
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteMemberModal(false)}
						>
							Close
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (!userToDelete) {
									console.error("No user to delete");
									return;
								}
								deleteUser(userToDelete);
							}}
						>
							Confirm
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={deleteMembersModal}
				onOpenChange={setDeleteMembersModal}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Are you sure?</DialogTitle>
						<DialogDescription>
							Would you like to delete all selected members?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteMembersModal(false)}
						>
							Close
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								deleteTeamUsers();
							}}
						>
							Confirm
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
