import { UserPlusIcon } from "lucide-react";
import { useCallback, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	ScrollArea,
	toast,
} from "@semoss/ui/next";
import { addProjectUserPermissions, type PostUser } from "@/api";
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
	const [userId, setUserId] = useState("");
	const [selectedPermission, setSelectedPermission] = useState("READ_ONLY");
	const [pendingUsers, setPendingUsers] = useState<User[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	/**
	 * Add a user to the pending list
	 */
	const handleAddUser = () => {
		const trimmedUserId = userId.trim();
		if (!trimmedUserId) {
			toast.error("Please enter a user ID");
			return;
		}

		// Check if user is already in the list
		if (pendingUsers.some((u) => u.id === trimmedUserId)) {
			toast.error("User already added");
			return;
		}

		setPendingUsers((prev) => [
			...prev,
			{
				id: trimmedUserId,
				permission: selectedPermission,
				date_added: "todo",
				name: "todo", // Name and email will be resolved on the backend when processing the request
				email: "todo",
				type: "todo",
			} satisfies User,
		]);

		// Reset inputs
		setUserId("");
		setSelectedPermission("READ_ONLY");
	};

	/**
	 * Remove a user from the pending list
	 */
	const handleRemoveUser = (userIdToRemove: string) => {
		setPendingUsers((prev) => prev.filter((u) => u.id !== userIdToRemove));
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
			setPendingUsers((prev) =>
				prev.map((u) =>
					u.id === userIdToUpdate
						? { ...u, permission: newPermission }
						: u,
				),
			);
		}
	};

	/**
	 * Submit the pending users to the API
	 */
	const handleSubmit = async () => {
		if (pendingUsers.length === 0) {
			toast.error("Please add at least one user");
			return;
		}

		setIsSubmitting(true);
		try {
			const usersToAdd: PostUser[] = pendingUsers.map((u) => ({
				userid: u.id,
				permission: u.permission,
			}));

			await addProjectUserPermissions(workspaceId, usersToAdd);

			toast.success(
				`Successfully added ${pendingUsers.length} member${pendingUsers.length > 1 ? "s" : ""}`,
			);

			// Reset state
			setPendingUsers([]);
			setUserId("");
			setSelectedPermission("READ_ONLY");

			// Close modal with changes made
			onClose(true);
		} catch (error) {
			toast.error(
				`Failed to add members: ${error instanceof Error ? error.message : "Unknown error"}`,
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
		setPendingUsers([]);
		setUserId("");
		setSelectedPermission("READ_ONLY");
		onClose(false);
	}, [onClose]);

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Add members</DialogTitle>
					<DialogDescription>
						Invite members to access and collaborate on this agent.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					{/* Add User Form */}
					<div className="flex flex-col gap-2">
						<div className="flex gap-2">
							<Input
								placeholder="Enter user ID or email"
								value={userId}
								onChange={(e) => setUserId(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleAddUser();
									}
								}}
								className="flex-1"
							/>
							<PermissionDropdown
								activeUserPermission={activeUserPermission}
								permission={selectedPermission}
								handlePermissionChange={setSelectedPermission}
								hideDeleteOption
							/>
							<Button
								variant="outline"
								onClick={handleAddUser}
								disabled={!userId.trim()}
							>
								Invite
							</Button>
						</div>
					</div>

					{/* Pending Users List */}
					{pendingUsers.length > 0 && (
						<div className="flex flex-col gap-2">
							<div className="font-medium text-sm">
								Members to add ({pendingUsers.length})
							</div>
							<ScrollArea className="max-h-[300px] rounded-md border">
								<div>
									{pendingUsers.map((user) => (
										<WorkspaceMemberRow
											key={user.id}
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

					{pendingUsers.length === 0 && (
						<div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-12 text-center">
							<UserPlusIcon className="size-8 text-muted-foreground" />
							<div className="text-muted-foreground text-sm">
								Add users to share this workspace
							</div>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={pendingUsers.length === 0 || isSubmitting}
					>
						{isSubmitting ? "Adding..." : "Add Members"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
