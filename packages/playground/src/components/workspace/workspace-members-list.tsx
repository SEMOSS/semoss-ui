import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Avatar,
	AvatarFallback,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	ScrollArea,
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
	Skeleton,
	toast,
} from "@semoss/ui/next";
import {
	editProjectUserPermissions,
	getProjectUsers,
	getUserProjectPermission,
	removeProjectUserPermissions,
} from "@/api";
import { useChat } from "@/hooks";
import type { User } from "@/types";
import { toInitials } from "@/utility";

export interface WorkspaceMembersListProps {
	/**
	 * The ID of the workspace to display members for
	 */
	workspaceId: string;

	/**
	 * Search query to filter members by name
	 */
	search: string;

	/**
	 * Pagination control state and setters
	 */
	paginationControl: {
		/** Number of rows to display per page */
		rowsPerPage: number;
		/** Current offset for pagination */
		offset: number;
		/** Total number of rows across all pages */
		totalRows: number;
		/** Setter to update total rows */
		setTotalRows: (rows: number) => void;
		/** Setter to update current page number */
		setCurrentPage: (currentPage: number) => void;
	};
}

/**
 * Displays a list of workspace members with their permissions.
 * Allows users with appropriate permissions to modify member roles and remove access.
 * Uses optimistic updates for permission changes and debounced loading for deletions.
 */
export const WorkspaceMembersList = ({
	workspaceId,
	paginationControl,
	search,
}: WorkspaceMembersListProps) => {
	const { rowsPerPage, offset, setTotalRows, setCurrentPage } =
		paginationControl;
	const { chat } = useChat();
	const currentUser = chat.user;

	// Track previous search term to detect changes and reset pagination
	const prevSearchRef = useRef(search);
	// Current user's permission level for the workspace
	const [userPermission, setUserPermission] = useState<string | null>(null);
	// List of workspace members
	const [members, setMembers] = useState<User[]>([]);
	// Loading state for the entire list
	const [isLoading, setIsLoading] = useState(true);
	// Dialog state for delete confirmation
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [userToDelete, setUserToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);

	/**
	 * Fetches the current user's permission level for the workspace.
	 * This determines what actions they can perform (e.g., only owners can promote to owner).
	 */
	const fetchUserPermission = useCallback(async () => {
		try {
			const permission = await getUserProjectPermission(workspaceId);
			if (permission) {
				setUserPermission(permission);
			}
		} catch (error) {
			toast.error(
				`Failed to fetch user permissions${error ? `: ${error instanceof Error ? error.message : "Unknown error"}` : ""}`,
			);
		}
	}, [workspaceId]);

	/**
	 * Fetches the list of workspace members with pagination.
	 * @param showLoading - Whether to show loading state (default: true). Set to false for silent refetches.
	 */
	const fetchMembers = useCallback(
		async (showLoading = true) => {
			if (showLoading) {
				setIsLoading(true);
			}

			const { totalMembers, members } = await getProjectUsers(
				workspaceId,
				search,
				undefined,
				rowsPerPage,
				offset,
			);

			setTotalRows(totalMembers);

			// If the search term has changed, reset to the first page
			if (prevSearchRef.current !== search) {
				setCurrentPage(1);
				prevSearchRef.current = search;
			}

			setMembers(members);

			if (showLoading) {
				setIsLoading(false);
			}
		},
		[
			workspaceId,
			search,
			rowsPerPage,
			offset,
			setTotalRows,
			setCurrentPage,
		],
	);

	useEffect(() => {
		fetchUserPermission();
	}, [fetchUserPermission]);

	useEffect(() => {
		fetchMembers();
	}, [fetchMembers]);

	/**
	 * Handles permission changes for a workspace member.
	 * Uses optimistic updates to immediately reflect the change in the UI,
	 * then reverts if the server update fails.
	 * @param userId - The ID of the user whose permission is being changed
	 * @param newPermission - The new permission level (OWNER, EDIT, READ_ONLY, or "delete")
	 */
	const handlePermissionChange = async (
		userId: string,
		newPermission: string,
	) => {
		// Handle delete action separately (routed through the dropdown)
		if (newPermission === "delete") {
			await handleDelete(userId);
			return;
		}

		// Store previous state for potential rollback
		const previousMembers = members;

		// Optimistically update the UI immediately for better UX
		setMembers((prevMembers) =>
			prevMembers.map((member) =>
				member.id === userId
					? { ...member, permission: newPermission }
					: member,
			),
		);

		try {
			// Persist the change to the server
			await editProjectUserPermissions(workspaceId, [
				{ userid: userId, permission: newPermission },
			]);
			toast.success("Permission updated successfully");
		} catch (error) {
			// Revert to previous state if the server update failed
			setMembers(previousMembers);
			toast.error(
				`Failed to update permission${error ? `: ${error instanceof Error ? error.message : "Unknown error"}` : ""}`,
			);
		}
	};

	/**
	 * Opens the delete confirmation dialog for a workspace member.
	 * @param userId - The ID of the user to remove from the workspace
	 */
	const handleDelete = async (userId: string) => {
		const member = members.find((m) => m.id === userId);
		if (member) {
			setUserToDelete({ id: member.id, name: member.name });
			setDeleteDialogOpen(true);
		}
	};

	/**
	 * Confirms and executes deletion of a workspace member.
	 * Shows loading state for at least 500ms to prevent jarring UI flashes,
	 * then refetches the list to display the next user from pagination.
	 */
	const confirmDelete = async () => {
		if (!userToDelete) return;

		const startTime = Date.now();
		// Minimum duration to show loading state (prevents jarring flash)
		const minLoadingDuration = 500;

		setDeleteDialogOpen(false);
		setIsLoading(true);

		try {
			// Remove user from the workspace
			await removeProjectUserPermissions(workspaceId, [userToDelete.id]);

			// Silently refetch to get the next user from pagination (showLoading=false)
			await fetchMembers(false);

			// Calculate remaining time to reach minimum loading duration
			const elapsed = Date.now() - startTime;
			const remaining = minLoadingDuration - elapsed;

			// If the operation completed too quickly, delay to prevent UI flash
			if (remaining > 0) {
				await new Promise((resolve) => setTimeout(resolve, remaining));
			}

			setIsLoading(false);
			toast.success("User removed successfully");
		} catch (error) {
			setIsLoading(false);
			toast.error(
				`Failed to remove user${error ? `: ${error instanceof Error ? error.message : "Unknown error"}` : ""}`,
			);
		} finally {
			setUserToDelete(null);
		}
	};

	return (
		<ScrollArea className="h-full w-full">
			<div className="py-4">
				<div className="px-6 pb-2 text-muted-foreground">
					Who has access
				</div>
				{isLoading
					? // Show skeleton loaders while data is being fetched
						Array.from({ length: rowsPerPage }).map((_, index) => (
							<div
								key={`skeleton-${
									// biome-ignore lint/suspicious/noArrayIndexKey: loading state
									index
								}`}
								className="flex items-center gap-3 rounded p-2 px-6"
							>
								<Skeleton className="h-12 w-12 rounded-md" />
								<div className="flex flex-1 flex-col gap-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-48" />
								</div>
								<Skeleton className="h-8 w-24" />
							</div>
						))
					: members.map((member) => (
							<div
								key={member.id}
								className="flex items-center gap-3 rounded p-2 px-6 hover:bg-accent"
							>
								<Avatar className="h-12 w-12 rounded-md">
									<AvatarFallback className="rounded-md bg-primary/10">
										{toInitials(member.name)}
									</AvatarFallback>
								</Avatar>
								<div className="flex flex-1 flex-col">
									<span className="font-medium text-sm">
										{member.name}{" "}
										{member.id === currentUser.id && (
											<span className="ml-1 text-muted-foreground">
												(You)
											</span>
										)}
									</span>
									<span className="text-muted-foreground text-xs">
										{member.email}
									</span>
								</div>
								<Select
									value={member.permission}
									onValueChange={(newPermission) =>
										handlePermissionChange(
											member.id,
											newPermission,
										)
									}
									// Disable if current user is read-only or trying to modify an owner without being an owner
									disabled={
										userPermission === "READ_ONLY" ||
										(member.permission === "OWNER" &&
											userPermission !== "OWNER")
									}
								>
									<SelectTrigger size="sm">
										<SelectValue />
									</SelectTrigger>
									{/* Position checkmark on left side of menu items */}
									<SelectContent className="[&_span:first-child]:right-auto [&_span:first-child]:left-2">
										{/* Only owners can promote users to owner */}
										<SelectItem
											value="OWNER"
											disabled={
												userPermission !== "OWNER"
											}
											className="pr-2 pl-8"
										>
											Owner
										</SelectItem>
										<SelectItem
											value="EDIT"
											className="pr-2 pl-8"
										>
											Editor
										</SelectItem>
										<SelectItem
											value="READ_ONLY"
											className="pr-2 pl-8"
										>
											Read-only
										</SelectItem>
										<SelectSeparator />
										<SelectItem
											value="delete"
											className="pr-2 text-destructive focus:text-destructive"
										>
											<Trash2 className="size-4 text-destructive" />
											Remove access
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						))}
			</div>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Remove agent access</DialogTitle>
						<DialogDescription>
							Are you sure you want to remove{" "}
							<span className="font-medium text-foreground">
								{userToDelete?.name}
							</span>
							's access to this agent? This action cannot be
							undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button variant="destructive" onClick={confirmDelete}>
							Remove access
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</ScrollArea>
	);
};
