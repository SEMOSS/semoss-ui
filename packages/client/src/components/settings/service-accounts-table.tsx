import { Copy, Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
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
import { createAPIUser, deleteMember } from "@/api";
import { SdkBlock } from "@/components/shared/sdk-block";
import { useAPI, useServerPagination, useSettings } from "@/hooks";
import { UserAddOverlay } from "./user-add-overlay";
import { UserPopover } from "./user-popover";

interface ServiceAccountUser {
	id: string;
	type: string;
	name?: string;
	email?: string;
	username?: string;
}

interface ServiceAccountsTableProps {
	/**
	 * Called when service accounts are changed
	 */
	onChange?: () => void;
}

const getUserKey = (user: ServiceAccountUser) => `${user.type}:${user.id}`;

export const ServiceAccountsTable = (props: ServiceAccountsTableProps) => {
	const { onChange = () => null } = props;
	const { adminMode } = useSettings();

	const [search, setSearch] = useState<string>("");
	const debouncedSearch = useDebouncedValue(search);

	const [selectedServiceAccounts, setSelectedServiceAccounts] = useState<
		ServiceAccountUser[]
	>([]);

	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [newServiceAccountName, setNewServiceAccountName] =
		useState<string>("");
	const [isCreating, setIsCreating] = useState(false);
	const [cachedTotalUsers, setCachedTotalUsers] = useState<number>(0);
	const [paginationTotalUsers, setPaginationTotalUsers] = useState<number>(0);
	const [createdServiceAccount, setCreatedServiceAccount] = useState<Record<
		string,
		string
	> | null>(null);

	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [deleteMode, setDeleteMode] = useState<"single" | "bulk">("single");
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [serviceAccountToEdit, setServiceAccountToEdit] =
		useState<ServiceAccountUser | null>(null);
	const [serviceAccountToDelete, setServiceAccountToDelete] =
		useState<ServiceAccountUser | null>(null);
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
		"getAllAPIUsers",
		adminMode,
		debouncedSearch ? debouncedSearch : "",
		offset,
		rowsPerPage,
	]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on search change
	useEffect(() => {
		resetPage();
	}, [debouncedSearch, resetPage]);

	const isLoading =
		getUsers.status === "INITIAL" || getUsers.status === "LOADING";
	const renderedServiceAccounts =
		getUsers.status === "SUCCESS" ? (getUsers.data?.users ?? []) : [];
	const totalUsers =
		getUsers.status === "SUCCESS" &&
		typeof getUsers.data?.totalUsers === "number"
			? getUsers.data.totalUsers
			: cachedTotalUsers;
	const filteredUsers =
		getUsers.status === "SUCCESS"
			? (getUsers.data?.filteredUsers ?? totalUsers)
			: 0;
	const serviceAccountLabel =
		totalUsers === 1 ? "service account" : "service accounts";
	const hasSearch = (debouncedSearch || "").trim().length > 0;
	const activeTotalUsers = hasSearch ? filteredUsers : totalUsers;
	const hasServiceAccounts =
		getUsers.status === "SUCCESS" && activeTotalUsers > 0;

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
		setSelectedServiceAccounts((current) => {
			if (current.length === 0) {
				return current;
			}

			const validSelection = current.filter((selected) => {
				return renderedServiceAccounts.some(
					(user) => getUserKey(user) === getUserKey(selected),
				);
			});

			return validSelection.length === current.length
				? current
				: validSelection;
		});
	}, [renderedServiceAccounts]);

	const createdServiceAccountEntries = useMemo(() => {
		if (!createdServiceAccount) {
			return [];
		}

		return Object.entries(createdServiceAccount).filter(
			([entryKey]) => entryKey !== "errorMessage",
		);
	}, [createdServiceAccount]);

	const avatarUsers = useMemo(() => {
		if (!renderedServiceAccounts.length) {
			return [];
		}

		return renderedServiceAccounts.slice(0, 5).map((user, index) => {
			const label = (user.name || user.id || "S").charAt(0).toUpperCase();
			return (
				<Avatar
					key={`${getUserKey(user)}-${index}`}
					className="size-7 border border-background"
				>
					<AvatarFallback>{label}</AvatarFallback>
				</Avatar>
			);
		});
	}, [renderedServiceAccounts]);

	const allSelected =
		renderedServiceAccounts.length > 0 &&
		selectedServiceAccounts.length === renderedServiceAccounts.length;
	const someSelected =
		selectedServiceAccounts.length > 0 &&
		!allSelected &&
		renderedServiceAccounts.length > 0;

	const copyText = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success(`Copied ${label}`);
		} catch (_error) {
			toast.error(`Unable to copy ${label}`);
		}
	};

	const resetCreateState = () => {
		setNewServiceAccountName("");
		setCreatedServiceAccount(null);
	};

	const createServiceAccount = async () => {
		const trimmedName = newServiceAccountName.trim();

		if (!trimmedName) {
			toast.error("Service account name is required");
			return;
		}

		setIsCreating(true);
		try {
			const response = await createAPIUser(trimmedName);

			if (!response) {
				throw new Error("Unable to create service account");
			}

			if (response.errorMessage) {
				throw new Error(response.errorMessage);
			}

			setCreatedServiceAccount(response);
			toast.success("Successfully created service account");
			onChange();
			getUsers.refresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to create service account",
			);
		} finally {
			setIsCreating(false);
		}
	};

	const downloadCredentialsJson = () => {
		if (!createdServiceAccount) return;
		const slug =
			newServiceAccountName
				.trim()
				.replace(/[^A-Za-z0-9._-]+/g, "-")
				.replace(/^-+|-+$/g, "") || "service-account";
		const blob = new Blob(
			[JSON.stringify(createdServiceAccount, null, 2)],
			{ type: "application/json" },
		);
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = `${slug}-credentials.json`;
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
		URL.revokeObjectURL(url);
	};

	const deleteServiceAccounts = async (accounts: ServiceAccountUser[]) => {
		let failedDeletes = 0;

		for (const account of accounts) {
			try {
				const response = await deleteMember(
					adminMode,
					account.id,
					account.type,
				);

				if (!response?.data) {
					failedDeletes++;
				}
			} catch (_error) {
				failedDeletes++;
			}
		}

		if (failedDeletes === 0) {
			toast.success(
				accounts.length > 1
					? "Successfully deleted service accounts"
					: "Successfully deleted service account",
			);
		} else {
			toast.error("Unable to delete one or more service accounts");
		}

		setSelectedServiceAccounts([]);
		setServiceAccountToDelete(null);
		onChange();
		getUsers.refresh();
	};

	const handleDeleteConfirm = async () => {
		const accountsToDelete =
			deleteMode === "bulk"
				? selectedServiceAccounts
				: serviceAccountToDelete
					? [serviceAccountToDelete]
					: [];

		if (!accountsToDelete.length) {
			return;
		}

		setIsDeleting(true);
		try {
			await deleteServiceAccounts(accountsToDelete);
		} finally {
			setDeleteModalOpen(false);
			setIsDeleting(false);
		}
	};

	return (
		<Card className="border border-border/60">
			<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-wrap items-center gap-3">
					<CardTitle>Service Accounts</CardTitle>
					<Badge variant="secondary" className="rounded-full">
						{hasSearch
							? `${filteredUsers} of ${totalUsers} ${serviceAccountLabel}`
							: `${totalUsers} ${serviceAccountLabel}`}
					</Badge>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{avatarUsers.length > 0 ? (
						<div className="-space-x-2 flex">{avatarUsers}</div>
					) : null}
					<div className="min-w-[240px]">
						<InputGroup>
							<InputGroupAddon>
								<Search className="size-4" />
							</InputGroupAddon>
							<InputGroupInput
								placeholder="Search Service Accounts"
								value={search}
								onChange={(
									e: React.ChangeEvent<HTMLInputElement>,
								) => {
									setSearch(e.target.value);
								}}
							/>
						</InputGroup>
					</div>
					{selectedServiceAccounts.length > 0 ? (
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
							resetCreateState();
							setCreateModalOpen(true);
						}}
					>
						<Plus className="size-4" />
						Create Service Account
					</Button>
				</div>
			</CardHeader>
			<CardContent className="p-0">
				{isLoading ? (
					<div className="flex h-40 items-center justify-center">
						<Spinner className="size-6" />
					</div>
				) : hasServiceAccounts ? (
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
												aria-label="Select all service accounts"
												onCheckedChange={(checked) => {
													if (checked === true) {
														setSelectedServiceAccounts(
															renderedServiceAccounts,
														);
													} else {
														setSelectedServiceAccounts(
															[],
														);
													}
												}}
											/>
										</div>
									</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Username</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{renderedServiceAccounts.map((account) => {
									const accountKey = getUserKey(account);
									const isSelected =
										selectedServiceAccounts.some(
											(selectedAccount) =>
												getUserKey(selectedAccount) ===
												accountKey,
										);
									const displayName =
										account.name || account.id || "Unknown";
									const avatarLabel = displayName
										.charAt(0)
										.toUpperCase();

									return (
										<TableRow
											key={accountKey}
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
																setSelectedServiceAccounts(
																	(prev) => {
																		const next =
																			prev.filter(
																				(
																					item,
																				) =>
																					getUserKey(
																						item,
																					) !==
																					accountKey,
																			);

																		return [
																			...next,
																			account,
																		];
																	},
																);
															} else {
																setSelectedServiceAccounts(
																	(prev) =>
																		prev.filter(
																			(
																				item,
																			) =>
																				getUserKey(
																					item,
																				) !==
																				accountKey,
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
														id: account.id,
														name:
															account.name ||
															"Unknown",
														email:
															account.email ||
															"No email",
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
																id: {account.id}
															</span>
															<span className="text-muted-foreground text-xs">
																email:{" "}
																{account.email ||
																	"No email"}
															</span>
														</div>
													</div>
												</UserPopover>
											</TableCell>
											<TableCell>
												{account.type}
											</TableCell>
											<TableCell>
												{account.username || "-"}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Button
														variant="ghost"
														size="icon-sm"
														onClick={() =>
															copyText(
																account.id,
																"service account id",
															)
														}
													>
														<Copy className="size-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon-sm"
														onClick={() => {
															setServiceAccountToEdit(
																account,
															);
															setEditModalOpen(
																true,
															);
														}}
													>
														<Pencil className="size-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon-sm"
														onClick={() => {
															setServiceAccountToDelete(
																account,
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
									<TableCell colSpan={5} className="py-3">
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
														{[25, 50, 100, 150].map(
															(value) => (
																<SelectItem
																	key={`rows-${value}`}
																	value={String(
																		value,
																	)}
																>
																	{value}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											</div>
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													disabled={page === 0}
													onClick={() =>
														setPage(
															Math.max(
																0,
																page - 1,
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
														setPage(
															Math.min(
																totalPages - 1,
																page + 1,
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
							No Service Accounts
						</p>
						<Button
							disabled={isLoading}
							onClick={() => {
								resetCreateState();
								setCreateModalOpen(true);
							}}
						>
							Create Service Account
						</Button>
					</div>
				)}
			</CardContent>

			<UserAddOverlay
				user={serviceAccountToEdit}
				open={editModalOpen}
				onClose={(_success) => {
					setEditModalOpen(false);
					setServiceAccountToEdit(null);

					if (_success) {
						onChange();
						getUsers.refresh();
					}
				}}
			/>

			<Dialog
				open={createModalOpen}
				onOpenChange={(open) => {
					if (!open) {
						setCreateModalOpen(false);
						resetCreateState();
					}
				}}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Create Service Account</DialogTitle>
						<DialogDescription>
							Create a service account for machine-based access.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="space-y-1.5">
							<p className="font-medium text-sm">
								Service Account Name
							</p>
							<Input
								value={newServiceAccountName}
								disabled={Boolean(createdServiceAccount)}
								onChange={(e) =>
									setNewServiceAccountName(e.target.value)
								}
								placeholder="Enter service account name"
								maxLength={255}
							/>
						</div>
						<div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 text-sm">
							One-time credentials are shown only once after
							creation. Copy and store them now.
						</div>
						{createdServiceAccount ? (
							<div className="flex flex-col gap-3">
								{createdServiceAccountEntries.length > 0 ? (
									createdServiceAccountEntries.map(
										([entryKey, entryValue]) => (
											<SdkBlock
												key={entryKey}
												label={entryKey.toLowerCase()}
												code={entryValue}
												testId={`serviceAccount-${entryKey}-copy-btn`}
											/>
										),
									)
								) : (
									<p className="text-sm">
										Service account created successfully.
									</p>
								)}
							</div>
						) : null}
					</div>
					<DialogFooter>
						{createdServiceAccount ? (
							<Button
								variant="default"
								className="gap-2"
								onClick={downloadCredentialsJson}
							>
								<Download className="size-4" />
								Download JSON
							</Button>
						) : null}
						{!createdServiceAccount ? (
							<Button
								onClick={createServiceAccount}
								disabled={isCreating}
							>
								{isCreating ? "Creating..." : "Create"}
							</Button>
						) : null}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={deleteModalOpen}
				onOpenChange={(open) => !open && setDeleteModalOpen(false)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{deleteMode === "bulk"
								? "Delete service accounts"
								: "Delete service account"}
						</DialogTitle>
						<DialogDescription>
							{deleteMode === "bulk" ? (
								`Are you sure you want to delete ${selectedServiceAccounts.length} service accounts? Any clients using these service accounts will lose access. This action cannot be undone.`
							) : (
								<>
									Are you sure you want to delete{" "}
									<span className="font-medium text-foreground">
										{serviceAccountToDelete?.id ||
											"this service account"}
									</span>
									? Any clients using this service account
									will lose access. This action cannot be
									undone.
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
