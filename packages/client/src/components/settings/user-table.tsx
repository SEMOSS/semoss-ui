import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@semoss/sdk/react";
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
	Label,
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
	toast,
} from "@semoss/ui/next";
import { deleteMember, editMemberInfo } from "@/api";
import { useAPI, useServerPagination, useSettings } from "@/hooks";
import { UserAddOverlay } from "./user-add-overlay";
import { UserPopover } from "./user-popover";

interface User {
	id: string;
	type: string;
	name?: string;
	admin?: boolean;
	publisher?: boolean;
	exporter?: boolean;
	email?: string;
	phone?: string;
	phoneextension?: string;
	countrycode?: string;
	username?: string;
	model_usage_restriction?: string;
	model_usage_frequency?: string;
	model_max_tokens?: number;
	model_max_response_time?: number;
	unit?: string;
}

interface UserTableProps {
	/**
	 * Called users are changed
	 */
	onChange?: () => void;
}

const formatValue = (input: string) => {
	if (input !== undefined) {
		const mappings: Record<string, string> = {
			TOKEN: "Token",
			COMPUTE: "Compute time",
			DAY: "Daily",
			WEEK: "Weekly",
			MONTH: "Monthly",
		};
		return mappings[input.toUpperCase()] || input;
	}
	return "";
};

export const UserTable = (props: UserTableProps) => {
	const { onChange = () => null } = props;

	const { adminMode } = useSettings();

	const [search, setSearch] = useState<string>("");

	// debounce the input
	const debouncedSearch = useDebouncedValue(search);

	/** Member Table State */
	const [selectedMembers, setSelectedMembers] = useState<User[]>([]);

	/** Add User State*/
	const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
	const [addModalUser, setAddModalUser] = useState<User | null>(null);
	const [cachedTotalUsers, setCachedTotalUsers] = useState<number>(0);
	const [paginationTotalUsers, setPaginationTotalUsers] = useState<number>(0);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deleteMode, setDeleteMode] = useState<"single" | "bulk">("single");
	const [userToDelete, setUserToDelete] = useState<User | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const {
		page,
		rowsPerPage,
		setPage,
		setRowsPerPage,
		offset,
		totalPages,
		resetPage,
	} = useServerPagination({
		totalCount: paginationTotalUsers,
		initialRowsPerPage: 50,
		pageIndexBase: 0,
	});

	const getUsers = useAPI([
		"getAllUsers",
		adminMode,
		debouncedSearch ? debouncedSearch : "",
		offset, // offset
		rowsPerPage, // limit
	]);

	// track if the page is loading
	const isLoading =
		getUsers.status === "INITIAL" || getUsers.status === "LOADING";
	const renderedMembers =
		getUsers.status === "SUCCESS" ? getUsers.data?.users : [];
	const totalUsers =
		getUsers.status === "SUCCESS" &&
		typeof getUsers.data?.totalUsers === "number"
			? getUsers.data.totalUsers
			: cachedTotalUsers;
	const filteredUsers =
		getUsers.status === "SUCCESS"
			? (getUsers.data?.filteredUsers ?? totalUsers)
			: 0;
	const hasSearch = (debouncedSearch ?? "").trim().length > 0;
	const activeTotalUsers = hasSearch ? filteredUsers : totalUsers;
	const hasUsers = getUsers.status === "SUCCESS" && activeTotalUsers > 0;

	useEffect(() => {
		if (getUsers.status !== "SUCCESS") {
			return;
		}
		const nextTotalUsers =
			typeof getUsers.data?.totalUsers === "number"
				? getUsers.data.totalUsers
				: cachedTotalUsers;
		if (typeof getUsers.data?.totalUsers === "number") {
			setCachedTotalUsers(getUsers.data.totalUsers);
		}
		const nextFilteredUsers =
			getUsers.data?.filteredUsers ?? nextTotalUsers;
		const nextActiveTotal = hasSearch ? nextFilteredUsers : nextTotalUsers;
		setPaginationTotalUsers(nextActiveTotal);
	}, [getUsers.status, getUsers.data, cachedTotalUsers, hasSearch]);

	useEffect(() => {
		resetPage();
	}, [debouncedSearch, resetPage]);

	/**
	 * Update a user
	 * @param user - user to update
	 */
	const updateUser = async (user: User) => {
		try {
			if (user.exporter === undefined || user.publisher === undefined) {
				if (user.exporter) {
					user.publisher = false;
				} else if (user.publisher) {
					user.exporter = false;
				} else {
					user.publisher = false;
					user.exporter = false;
				}
			}
			const response = await editMemberInfo(adminMode, user);

			if (!response) {
				return;
			}

			// ignore if there is no response
			if (response.data) {
				toast.success("Successfully updated user");

				onChange();

				// refresh the users
				getUsers.refresh();
			} else {
				toast.error("Error changing user");
			}
		} catch (e) {
			toast.error(String(e));
		}
	};
	/**
	 * Delate a user info
	 * @param user - user to update
	 */
	const deleteUser = async (user: User) => {
		try {
			const response = await deleteMember(adminMode, user.id, user.type);

			if (!response) {
				return;
			}

			// ignore if there is no response
			if (response.data) {
				toast.success("Successfully deleting user");

				onChange();

				// refresh the users
				getUsers.refresh();
			} else {
				toast.error("Error deleting user");
			}
		} catch (e) {
			toast.error(String(e));
		}
	};

	/**
	 * @name deleteUsers
	 */
	const deleteUsers = async () => {
		try {
			for (let i = 0; i < selectedMembers.length; i++) {
				try {
					const response = await deleteMember(
						adminMode,
						selectedMembers[i].id,
						selectedMembers[i].type,
					);

					if (!response) {
						return;
					}

					// ignore if there is no response
					if (response.data) {
						toast.success("Successfully deleted users");

						onChange();
					} else {
						toast.error("Error deleting user");
					}
				} catch (e) {
					toast.error(String(e));
				}
			}
		} finally {
			setSelectedMembers([]);
			// refresh the users
			getUsers.refresh();
		}
	};

	const handleDeleteConfirm = async () => {
		setIsDeleting(true);
		try {
			if (deleteMode === "single" && userToDelete) {
				await deleteUser(userToDelete);
			}
			if (deleteMode === "bulk" && selectedMembers.length > 0) {
				await deleteUsers();
			}
		} finally {
			setIsDeleting(false);
			setDeleteModalOpen(false);
			setUserToDelete(null);
		}
	};

	// Avatars rendered
	const avatarUsers = useMemo(() => {
		if (!renderedMembers.length) {
			return [];
		}

		return renderedMembers.slice(0, 5).map((user, index) => {
			const label = (user.name || user.id || "U").charAt(0).toUpperCase();
			return (
				<Avatar
					key={`${user.id}-${index}`}
					className="size-7 border border-background"
				>
					<AvatarFallback>{label}</AvatarFallback>
				</Avatar>
			);
		});
	}, [renderedMembers]);

	const allSelected =
		renderedMembers.length > 0 &&
		selectedMembers.length === renderedMembers.length;
	const someSelected =
		selectedMembers.length > 0 &&
		!allSelected &&
		renderedMembers.length > 0;

	return (
		<Card className="border border-border/60">
			<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-wrap items-center gap-3">
					<CardTitle>Members</CardTitle>
					<Badge variant="secondary" className="rounded-full">
						{hasSearch
							? `${filteredUsers} of ${totalUsers} members`
							: `${totalUsers} members`}
					</Badge>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{avatarUsers.length > 0 ? (
						<div className="-space-x-2 flex">{avatarUsers}</div>
					) : null}
					<div className="min-w-[220px]">
						<InputGroup>
							<InputGroupAddon>
								<Search className="size-4" />
							</InputGroupAddon>
							<InputGroupInput
								placeholder="Search Users"
								value={search}
								onChange={(
									e: React.ChangeEvent<HTMLInputElement>,
								) => {
									setSearch(e.target.value);
								}}
							/>
						</InputGroup>
					</div>
					{selectedMembers.length > 0 ? (
						<Button
							variant="outline"
							size="sm"
							className="border-destructive text-destructive hover:bg-destructive/10"
							onClick={() => {
								setDeleteMode("bulk");
								setDeleteModalOpen(true);
							}}
						>
							<Trash2 className="size-4" />
							Delete Selected
						</Button>
					) : null}
					<Button
						disabled={isLoading}
						onClick={() => {
							setAddModalOpen(true);
							setAddModalUser(null);
						}}
					>
						<Plus className="size-4" />
						Add Members
					</Button>
				</div>
			</CardHeader>
			<CardContent className="p-0">
				{isLoading ? (
					<div className="flex h-40 items-center justify-center">
						<Spinner className="size-6" />
					</div>
				) : hasUsers ? (
					<div>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-10">
										<div className="flex justify-center">
											<Checkbox
												checked={
													allSelected
														? true
														: someSelected
															? "indeterminate"
															: false
												}
												aria-label="Select all members"
												onCheckedChange={(checked) => {
													if (checked === true) {
														setSelectedMembers(
															renderedMembers,
														);
													} else {
														setSelectedMembers([]);
													}
												}}
											/>
										</div>
									</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Model Limits</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{renderedMembers.map((user) => {
									const isSelected = selectedMembers.some(
										(value) => value.id === user.id,
									);
									const displayName =
										user.name || user.id || "Unknown";
									const avatarLabel = displayName
										.charAt(0)
										.toUpperCase();
									const modelLimitType = formatValue(
										user?.model_usage_restriction,
									);
									const modelLimitValue =
										user?.model_usage_restriction ===
										"compute"
											? `${user?.model_max_response_time?.toLocaleString()} ms`
											: user?.model_usage_restriction ===
													"token"
												? `${user?.model_max_tokens?.toLocaleString()}`
												: "";
									const modelLimitFrequency = formatValue(
										user?.model_usage_frequency,
									);

									return (
										<TableRow
											key={user.id}
											data-state={
												isSelected
													? "selected"
													: undefined
											}
										>
											<TableCell className="w-10">
												<div className="flex justify-center">
													<Checkbox
														checked={isSelected}
														aria-label={`Select ${displayName}`}
														onCheckedChange={(
															checked,
														) => {
															if (
																checked === true
															) {
																setSelectedMembers(
																	[
																		...selectedMembers,
																		user,
																	],
																);
															} else {
																setSelectedMembers(
																	selectedMembers.filter(
																		(
																			member,
																		) =>
																			member.id !==
																			user.id,
																	),
																);
															}
														}}
													/>
												</div>
											</TableCell>
											<TableCell>
												<UserPopover
													user={{
														id: user.id,
														name:
															user.name ||
															"Unknown",
														email: user.email || "",
													}}
												>
													<div className="flex items-center gap-3">
														<Avatar className="size-8">
															<AvatarFallback>
																{avatarLabel}
															</AvatarFallback>
														</Avatar>
														<div className="flex flex-col">
															<span className="max-w-[220px] truncate font-medium">
																{displayName}
															</span>
															<span className="text-muted-foreground text-xs">
																{user.email ||
																	"No email"}
															</span>
														</div>
													</div>
												</UserPopover>
											</TableCell>
											<TableCell>{user.type}</TableCell>
											<TableCell>
												<div className="flex flex-col gap-1 text-sm">
													<div>
														<span className="font-medium">
															Type:
														</span>{" "}
														{modelLimitType || "-"}
													</div>
													<div>
														<span className="font-medium">
															Value:
														</span>{" "}
														{modelLimitValue || "-"}
													</div>
													<div>
														<span className="font-medium">
															Frequency:
														</span>{" "}
														{modelLimitFrequency ||
															"-"}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex flex-col gap-2">
													<div className="flex items-center gap-2">
														<Checkbox
															id={`publisher-${user.id}`}
															checked={Boolean(
																user.publisher,
															)}
															onCheckedChange={(
																checked,
															) => {
																if (
																	checked ===
																	true
																) {
																	updateUser({
																		...user,
																		publisher: true,
																	});
																} else {
																	updateUser({
																		...user,
																		publisher: false,
																	});
																}
															}}
														/>
														<Label
															htmlFor={`publisher-${user.id}`}
															className="text-sm"
														>
															Publisher
														</Label>
													</div>
													<div className="flex items-center gap-2">
														<Checkbox
															id={`exporter-${user.id}`}
															checked={Boolean(
																user.exporter,
															)}
															onCheckedChange={(
																checked,
															) => {
																if (
																	checked ===
																	true
																) {
																	updateUser({
																		...user,
																		exporter: true,
																	});
																} else {
																	updateUser({
																		...user,
																		exporter: false,
																	});
																}
															}}
														/>
														<Label
															htmlFor={`exporter-${user.id}`}
															className="text-sm"
														>
															Exporter
														</Label>
													</div>
													<div className="flex items-center gap-2">
														<Checkbox
															id={`admin-${user.id}`}
															checked={Boolean(
																user.admin,
															)}
															onCheckedChange={(
																checked,
															) => {
																if (
																	checked ===
																	true
																) {
																	updateUser({
																		...user,
																		admin: true,
																	});
																} else {
																	updateUser({
																		...user,
																		admin: false,
																	});
																}
															}}
														/>
														<Label
															htmlFor={`admin-${user.id}`}
															className="text-sm"
														>
															Admin
														</Label>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Button
														variant="ghost"
														size="icon-sm"
														onClick={() => {
															setAddModalOpen(
																true,
															);
															setAddModalUser(
																user,
															);
														}}
													>
														<Pencil className="size-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon-sm"
														onClick={() => {
															setUserToDelete(
																user,
															);
															setDeleteMode(
																"single",
															);
															setDeleteModalOpen(
																true,
															);
														}}
													>
														<Trash2 className="size-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
							<TableFooter>
								<TableRow>
									<TableCell colSpan={6} className="py-3">
										<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
											<div className="flex items-center gap-2 text-sm">
												<span className="text-muted-foreground">
													Rows per page
												</span>
												<Select
													value={String(rowsPerPage)}
													onValueChange={(value) => {
														setRowsPerPage(
															Number(value),
														);
													}}
												>
													<SelectTrigger className="h-8 w-[90px]">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{[
															50, 100, 150, 200,
														].map((value) => (
															<SelectItem
																key={`rows-${value}`}
																value={String(
																	value,
																)}
															>
																{value}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													disabled={page === 0}
													onClick={() =>
														setPage((prev) =>
															Math.max(
																0,
																prev - 1,
															),
														)
													}
												>
													Previous
												</Button>
												<span className="text-muted-foreground text-sm">
													{page + 1} of {totalPages}
												</span>
												<Button
													variant="outline"
													size="sm"
													disabled={
														page + 1 >= totalPages
													}
													onClick={() =>
														setPage((prev) =>
															Math.min(
																totalPages - 1,
																prev + 1,
															),
														)
													}
												>
													Next
												</Button>
											</div>
										</div>
									</TableCell>
								</TableRow>
							</TableFooter>
						</Table>
					</div>
				) : (
					<div className="flex h-[360px] flex-col items-center justify-center gap-3">
						<p className="text-muted-foreground text-sm">
							No Members
						</p>
						<Button
							disabled={isLoading}
							onClick={() => {
								setAddModalOpen(true);
								setAddModalUser(null);
							}}
						>
							Add Member
						</Button>
					</div>
				)}
			</CardContent>

			<UserAddOverlay
				user={addModalUser}
				open={addModalOpen}
				onClose={(_success) => {
					// close
					setAddModalOpen(false);
					// de-select the user
					setAddModalUser(null);

					// refresh if successful
					if (_success) {
						// trigger the update
						onChange();

						getUsers.refresh();
					}
				}}
			/>
			<Dialog
				open={deleteModalOpen}
				onOpenChange={(open) => !open && setDeleteModalOpen(false)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{deleteMode === "bulk"
								? "Delete members"
								: "Delete member"}
						</DialogTitle>
						<DialogDescription>
							{deleteMode === "bulk" ? (
								`Are you sure you want to delete ${selectedMembers.length} members? This action cannot be undone.`
							) : (
								<>
									Are you sure you want to delete{" "}
									<span className="font-medium text-foreground">
										{userToDelete?.id || "this member"}
									</span>
									? This action cannot be undone.
								</>
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteConfirm}
							disabled={isDeleting}
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
};
