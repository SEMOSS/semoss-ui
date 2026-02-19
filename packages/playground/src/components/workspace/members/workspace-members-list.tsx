import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	editProjectUserPermissions,
	getProjectUsers,
	getUserProjectPermission,
	removeProjectUserPermissions,
} from "@semoss/shared";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	ScrollArea,
	Skeleton,
	toast,
} from "@semoss/ui/next";
import { useChat } from "@/hooks";
import type { User } from "@/types";
import { WorkspaceMemberRow } from "./workspace-member-row";
import { WorkspaceSharingModal } from "./workspace-sharing-modal";

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

	/**
	 * Optional callback to trigger when members are updated (e.g., after a permission change or deletion)
	 */
	isSharingModalOpen: boolean;
	onSharingModalClose: (madeChanges: boolean) => void;
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
	isSharingModalOpen,
	onSharingModalClose,
}: WorkspaceMembersListProps) => {
	const { rowsPerPage, offset, setTotalRows, setCurrentPage } =
		paginationControl;
	const { chat } = useChat();
	const currentUser = chat.user;

	const navigate = useNavigate();

	// Track previous search term to detect changes and reset pagination
	const prevSearchRef = useRef(search);
	// Current user's permission level for the workspace
	const [userPermission, setUserPermission] = useState<string | null>(null);
	// List of workspace members
	const [members, setMembers] = useState<User[]>([]);
	// Loading state for the entire list
	const [isLoading, setIsLoading] = useState(true);
	// Unified dialog state for confirmations
	const [confirmationDialog, setConfirmationDialog] = useState<{
		open: boolean;
		action:
			| { type: "delete"; userId: string; userName: string }
			| {
					type: "permission";
					userId: string;
					newPermission: string;
					oldPermission: string;
			  }
			| null;
	}>({
		open: false,
		action: null,
	});

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
				false,
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
	 * Shows confirmation dialog when users change their own permission.
	 * Uses optimistic updates for other changes to immediately reflect in the UI.
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

		// If user is changing their own permission, show confirmation dialog
		if (userId === currentUser.id) {
			const member = members.find((m) => m.id === userId);
			if (member) {
				setConfirmationDialog({
					open: true,
					action: {
						type: "permission",
						userId,
						newPermission,
						oldPermission: member.permission,
					},
				});
			}
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
			setConfirmationDialog({
				open: true,
				action: {
					type: "delete",
					userId: member.id,
					userName: member.name,
				},
			});
		}
	};

	/**
	 * Converts a permission constant to a human-readable display name.
	 * @param permission - The permission constant (OWNER, EDIT, READ_ONLY)
	 * @returns The formatted permission name for display
	 */
	const getPermissionDisplay = (permission: string) => {
		switch (permission) {
			case "OWNER":
				return "Owner";
			case "EDIT":
				return "Editor";
			case "READ_ONLY":
				return "Read-only";
			default:
				return permission;
		}
	};

	/**
	 * Confirms and executes the pending action (delete or permission change).
	 */
	const handleConfirm = async () => {
		if (!confirmationDialog.action) return;

		const { action } = confirmationDialog;
		setConfirmationDialog({ open: false, action: null });

		if (action.type === "delete") {
			const startTime = Date.now();
			const minLoadingDuration = 500;

			setIsLoading(true);

			try {
				// Remove user from the workspace
				await removeProjectUserPermissions(workspaceId, [
					action.userId,
				]);

				if (action.userId === currentUser.id) {
					// If the current user removed themselves, navigate back to the agents page
					navigate("/agent");
					return;
				}

				// Silently refetch to get the next user from pagination (showLoading=false)
				await fetchMembers(false);

				// Calculate remaining time to reach minimum loading duration
				const elapsed = Date.now() - startTime;
				const remaining = minLoadingDuration - elapsed;

				// If the operation completed too quickly, delay to prevent UI flash
				if (remaining > 0) {
					await new Promise((resolve) =>
						setTimeout(resolve, remaining),
					);
				}

				setIsLoading(false);
				toast.success("User removed successfully");
			} catch (error) {
				setIsLoading(false);
				toast.error(
					`Failed to remove user${error ? `: ${error instanceof Error ? error.message : "Unknown error"}` : ""}`,
				);
			}
		} else if (action.type === "permission") {
			// Store previous state for potential rollback
			const previousMembers = members;

			// Optimistically update the UI immediately for better UX
			setMembers((prevMembers) =>
				prevMembers.map((member) =>
					member.id === action.userId
						? { ...member, permission: action.newPermission }
						: member,
				),
			);

			try {
				// Persist the change to the server
				await editProjectUserPermissions(workspaceId, [
					{ userid: action.userId, permission: action.newPermission },
				]);
				toast.success("Permission updated successfully");
				// Refetch user permission to update the current user's permission state
				await fetchUserPermission();
			} catch (error) {
				// Revert to previous state if the server update failed
				setMembers(previousMembers);
				toast.error(
					`Failed to update permission${error ? `: ${error instanceof Error ? error.message : "Unknown error"}` : ""}`,
				);
			}
		}
	};

	// Prepare dialog content based on action type
	const dialogContent =
		confirmationDialog.action?.type === "delete"
			? confirmationDialog.action.userId === currentUser.id
				? {
						title: "Remove yourself from agent",
						description:
							"You are about to remove your access to this agent. You will need to be re-invited to regain access. This action cannot be undone.",
						buttonVariant: "destructive" as const,
						buttonText: "Remove access",
					}
				: {
						title: "Remove agent access",
						description: (
							<>
								Are you sure you want to remove{" "}
								<span className="font-medium text-foreground">
									{confirmationDialog.action.userName}
								</span>
								's access to this agent? This action cannot be
								undone.
							</>
						),
						buttonVariant: "destructive" as const,
						buttonText: "Remove access",
					}
			: confirmationDialog.action?.type === "permission"
				? {
						title: "Change your permission",
						description: (
							<>
								You are about to change your own permission from{" "}
								<span className="font-medium text-foreground">
									{getPermissionDisplay(
										confirmationDialog.action.oldPermission,
									)}
								</span>{" "}
								to{" "}
								<span className="font-medium text-foreground">
									{getPermissionDisplay(
										confirmationDialog.action.newPermission,
									)}
								</span>
								. This will affect what actions you can perform
								in this agent.
							</>
						),
						buttonVariant: "default" as const,
						buttonText: "Change permission",
					}
				: {
						title: "",
						description: null,
						buttonVariant: "default" as const,
						buttonText: "",
					};

	return (
		<ScrollArea className="h-full w-full">
			<div className="py-4">
				<div className="px-4 pb-2 text-muted-foreground">
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
								className="flex items-center gap-3 rounded p-2 px-4"
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
							<WorkspaceMemberRow
								key={member.id}
								member={member}
								currentUserId={currentUser.id}
								activeUserPermission={userPermission}
								onPermissionChange={(newPermission) =>
									handlePermissionChange(
										member.id,
										newPermission,
									)
								}
							/>
						))}
			</div>
			{/* Unified Confirmation Dialog */}
			<Dialog
				open={confirmationDialog.open}
				onOpenChange={(open) =>
					setConfirmationDialog({ open, action: null })
				}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{dialogContent.title}</DialogTitle>
						<DialogDescription>
							{dialogContent.description}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() =>
								setConfirmationDialog({
									open: false,
									action: null,
								})
							}
						>
							Cancel
						</Button>
						<Button
							variant={dialogContent.buttonVariant}
							onClick={handleConfirm}
						>
							{dialogContent.buttonText}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			{/* Workspace Sharing Modal */}
			{workspaceId && (
				<WorkspaceSharingModal
					workspaceId={workspaceId}
					open={isSharingModalOpen}
					onClose={(madeChanges) => {
						onSharingModalClose(madeChanges);
						if (madeChanges) fetchMembers();
					}}
					activeUserPermission={userPermission}
				/>
			)}
		</ScrollArea>
	);
};
