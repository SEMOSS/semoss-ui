import { ChevronsUpDownIcon, UserPlusIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	addProjectUserPermissions,
	getProjectUsers,
	getProjectUsersNoCredentials,
	type PostUser,
	type Role,
} from "@semoss/shared";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Popover,
	PopoverContent,
	PopoverTrigger,
	ScrollArea,
	Spinner,
	toast,
	useDebouncedValue,
} from "@semoss/ui/next";
import type { User } from "@/types";
import { PermissionDropdown } from "./permission-dropdown";
import { WorkspaceMemberRow } from "./workspace-member-row";

export interface WorkspaceSharingModalProps {
	/** Id of the workspace */
	workspaceId: string;

	open: boolean;
	onClose: (madeChanges: boolean) => void;
	activeUserPermission: string; // Pass active user's permission to control dropdown options and actions
}

export const WorkspaceSharingModal = ({
	workspaceId,
	open,
	onClose,
	activeUserPermission,
}: WorkspaceSharingModalProps) => {
	const { t } = useTranslation(["workspace", "common"]);

	/**
	 * State
	 */
	const [search, setSearch] = useState("");
	const [selectedPermission, setSelectedPermission] = useState("READ_ONLY");
	const [pendingUsers, setPendingUsers] = useState<
		Record<
			string,
			User & {
				inAgent?: boolean; // Optional flag to indicate if user is already in the agent (for UI purposes)
			}
		>
	>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [popoverOpen, setPopoverOpen] = useState(false);

	const [usersInDropdown, setUsersInDropdown] = useState<
		(User & {
			inAgent?: boolean;
		})[]
	>([]);
	const [isLoadingDropdownUsers, setIsLoadingDropdownUsers] = useState(false);

	/**
	 * Library Hooks
	 */
	const debouncedSearch = useDebouncedValue(search, 500);

	/**
	 * Functions
	 */
	useEffect(() => {
		const fetchUsers = async () => {
			setIsLoadingDropdownUsers(true);
			try {
				const [usersIn, usersOut] = await Promise.all([
					getProjectUsers(
						workspaceId,
						false,
						debouncedSearch,
						undefined,
						5,
						0,
					),
					getProjectUsersNoCredentials(
						workspaceId,
						false,
						debouncedSearch,
						5,
						0,
					),
				]);

				setUsersInDropdown([
					...usersOut,
					...usersIn.members.map((member) => ({
						...member,
						inAgent: true,
					})),
				]);
			} catch (error) {
				toast.error(
					t("workspace:messages.fetchUsersFailed") +
						`: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			} finally {
				setIsLoadingDropdownUsers(false);
			}
		};
		fetchUsers();
	}, [debouncedSearch, workspaceId]);

	/**
	 * Add a user to the pending list
	 */
	const handleAddUser = (user: User) => {
		// Check if user is already in the list
		if (pendingUsers[user.id]) {
			toast.error(t("workspace:messages.userAlreadyAdded"));
			return;
		}

		setPendingUsers((prev) => ({
			...prev,
			[user.id]: {
				...user,
				permission: selectedPermission,
			},
		}));

		// Close popover and reset search
		setPopoverOpen(false);
		setSearch("");
	};

	/**
	 * Remove a user from the pending list
	 */
	const handleRemoveUser = (userIdToRemove: string) => {
		setPendingUsers((prev) => {
			const { [userIdToRemove]: _, ...rest } = prev;
			return rest;
		});
	};

	/**
	 * Update a user's permission in the pending list
	 */
	const handleUpdatePermission = (
		userIdToUpdate: string,
		newPermission: string,
	) => {
		if (newPermission === "delete") {
			handleRemoveUser(userIdToUpdate);
		} else {
			setPendingUsers((prev) => ({
				...prev,
				[userIdToUpdate]: {
					...prev[userIdToUpdate],
					permission: newPermission,
				},
			}));
		}
	};

	/**
	 * Submit the pending users to the API
	 */
	const handleSubmit = async () => {
		const pendingUsersList = Object.values(pendingUsers);
		if (pendingUsersList.length === 0) {
			toast.error(t("workspace:messages.addAtLeastOne"));
			return;
		}

		setIsSubmitting(true);
		try {
			const usersToAdd: PostUser[] = pendingUsersList.map((u) => ({
				userid: u.id,
				permission: u.permission as Role,
			}));

			await addProjectUserPermissions(workspaceId, usersToAdd);

			toast.success(
				t("workspace:messages.addMembersSuccess", {
					count: pendingUsersList.length,
				}),
			);

			// Reset state
			setPendingUsers({});
			setSearch("");
			setSelectedPermission("READ_ONLY");

			// Close modal with changes made
			onClose(true);
		} catch (error) {
			toast.error(
				t("workspace:messages.addMembersFailed") +
					`: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	/**
	 * Handle dialog close
	 */
	const handleClose = useCallback(() => {
		// Reset state
		setPendingUsers({});
		setSearch("");
		setSelectedPermission("READ_ONLY");
		onClose(false);
	}, [onClose]);

	const showLoading = isLoadingDropdownUsers || search !== debouncedSearch;

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{t("workspace:sharing.title")}</DialogTitle>
					<DialogDescription>
						{t("workspace:sharing.description")}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					{/* Add User Form */}
					<div className="flex flex-col gap-2">
						<div className="flex gap-2">
							<Popover
								open={popoverOpen}
								onOpenChange={setPopoverOpen}
							>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										role="combobox"
										aria-expanded={popoverOpen}
										className="flex-1 justify-between"
									>
										<span className="truncate">
											{search ||
												t(
													"workspace:sharing.searchPlaceholder",
												)}
										</span>
										<ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent
									className="w-[400px] p-0"
									align="start"
								>
									<Command shouldFilter={false}>
										<CommandInput
											placeholder={t(
												"workspace:sharing.searchUsers",
											)}
											value={search}
											onValueChange={setSearch}
										/>
										<CommandList>
											<CommandEmpty>
												{showLoading ? (
													<div className="flex items-center justify-center py-4">
														<Spinner />
													</div>
												) : (
													t(
														"workspace:sharing.noUsersFound",
													)
												)}
											</CommandEmpty>
											<CommandGroup>
												{usersInDropdown.map((user) => {
													const isAlreadyPending =
														!!pendingUsers[user.id];
													const isInAgent =
														user.inAgent;

													return (
														<CommandItem
															key={`${user.id}-${user.email}`} // Use both ID and email for uniqueness
															value={user.id}
															onSelect={() =>
																handleAddUser(
																	user,
																)
															}
															disabled={
																isAlreadyPending ||
																isInAgent
															}
														>
															<div className="flex flex-1 flex-col truncate">
																<span className="truncate">
																	{user.name}
																</span>
																{user.email && (
																	<span className="truncate text-muted-foreground text-xs">
																		{
																			user.email
																		}
																	</span>
																)}
															</div>
															{isInAgent && (
																<span className="ml-auto text-muted-foreground text-xs">
																	{t(
																		"workspace:sharing.hasAccess",
																	)}
																</span>
															)}
															{isAlreadyPending && (
																<span className="ml-auto text-muted-foreground text-xs">
																	{t(
																		"workspace:sharing.pendingInvite",
																	)}
																</span>
															)}
														</CommandItem>
													);
												})}
												{showLoading &&
													usersInDropdown.length >
														0 && (
														<div className="flex items-center justify-center py-2">
															<Spinner className="size-4" />
														</div>
													)}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
							<div className="[&_button]:h-9!">
								<PermissionDropdown
									activeUserPermission={activeUserPermission}
									permission={selectedPermission}
									handlePermissionChange={
										setSelectedPermission
									}
									hideDeleteOption
								/>
							</div>
						</div>
					</div>

					{/* Pending Users List */}
					{Object.keys(pendingUsers).length > 0 && (
						<div className="flex flex-col gap-2">
							<div className="font-medium text-sm">
								{t("workspace:sharing.membersToAdd")} (
								{Object.keys(pendingUsers).length})
							</div>
							<ScrollArea className="max-h-[300px] rounded-md border">
								<div>
									{Object.values(pendingUsers).map((user) => (
										<WorkspaceMemberRow
											key={`${user.id}-${user.email}`} // Use both ID and email for uniqueness
											member={user}
											currentUserId=""
											activeUserPermission={
												activeUserPermission
											}
											onPermissionChange={(
												newPermission,
											) =>
												handleUpdatePermission(
													user.id,
													newPermission,
												)
											}
										/>
									))}
								</div>
							</ScrollArea>
						</div>
					)}

					{Object.keys(pendingUsers).length === 0 && (
						<div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-12 text-center">
							<UserPlusIcon className="size-8 text-muted-foreground" />
							<div className="text-muted-foreground text-sm">
								{t("workspace:sharing.emptyState")}
							</div>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						{t("common:buttons.cancel")}
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={
							Object.keys(pendingUsers).length === 0 ||
							isSubmitting
						}
					>
						{isSubmitting
							? t("workspace:sharing.buttonAdding")
							: t("workspace:sharing.buttonAdd")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
