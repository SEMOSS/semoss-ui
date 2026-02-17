import { Trash2, UserPlusIcon } from "lucide-react";
import { useCallback, useState } from "react";
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
	Input,
	ScrollArea,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@semoss/ui/next";
import { addProjectUserPermissions, type PostUser } from "@/api";
import { toInitials } from "@/utility";

export interface WorkspaceSharingModalProps {
	/** Id of the workspace */
	workspaceId: string;

	open: boolean;
	onClose: (madeChanges: boolean) => void;
}

type PendingUser = {
	userid: string;
	name?: string;
	email?: string;
	permission: string;
};

export const WorkspaceSharingModal = ({
	workspaceId,
	open,
	onClose,
}: WorkspaceSharingModalProps) => {
	const [userId, setUserId] = useState("");
	const [selectedPermission, setSelectedPermission] = useState("READ_ONLY");
	const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	/**
	 * Add a user to the pending list
	 */
	const handleAddUser = useCallback(() => {
		const trimmedUserId = userId.trim();
		if (!trimmedUserId) {
			toast.error("Please enter a user ID");
			return;
		}

		// Check if user is already in the list
		if (pendingUsers.some((u) => u.userid === trimmedUserId)) {
			toast.error("User already added");
			return;
		}

		setPendingUsers((prev) => [
			...prev,
			{
				userid: trimmedUserId,
				permission: selectedPermission,
			},
		]);

		// Reset inputs
		setUserId("");
		setSelectedPermission("READ_ONLY");
	}, [userId, selectedPermission, pendingUsers]);

	/**
	 * Remove a user from the pending list
	 */
	const handleRemoveUser = useCallback((userIdToRemove: string) => {
		setPendingUsers((prev) =>
			prev.filter((u) => u.userid !== userIdToRemove),
		);
	}, []);

	/**
	 * Update a user's permission in the pending list
	 */
	const handleUpdatePermission = useCallback(
		(userIdToUpdate: string, newPermission: string) => {
			setPendingUsers((prev) =>
				prev.map((u) =>
					u.userid === userIdToUpdate
						? { ...u, permission: newPermission }
						: u,
				),
			);
		},
		[],
	);

	/**
	 * Submit the pending users to the API
	 */
	const handleSubmit = useCallback(async () => {
		if (pendingUsers.length === 0) {
			toast.error("Please add at least one user");
			return;
		}

		setIsSubmitting(true);
		try {
			const usersToAdd: PostUser[] = pendingUsers.map((u) => ({
				userid: u.userid,
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
	}, [pendingUsers, workspaceId, onClose]);

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
							<Select
								value={selectedPermission}
								onValueChange={setSelectedPermission}
							>
								<SelectTrigger className="w-[140px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="READ_ONLY">
										Read Only
									</SelectItem>
									<SelectItem value="EDIT">Edit</SelectItem>
									<SelectItem value="OWNER">Owner</SelectItem>
								</SelectContent>
							</Select>
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
								<div className="divide-y">
									{pendingUsers.map((user) => (
										<div
											key={user.userid}
											className="flex items-center gap-3 p-3"
										>
											<Avatar className="size-8">
												<AvatarFallback className="text-xs">
													{toInitials(
														user.name ||
															user.userid,
													)}
												</AvatarFallback>
											</Avatar>
											<div className="flex min-w-0 flex-1 flex-col">
												<div className="truncate font-medium text-sm">
													{user.userid}
												</div>
												{user.email && (
													<div className="truncate text-muted-foreground text-xs">
														{user.email}
													</div>
												)}
											</div>
											<Select
												value={user.permission}
												onValueChange={(value) =>
													handleUpdatePermission(
														user.userid,
														value,
													)
												}
											>
												<SelectTrigger className="w-[120px]">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="READ_ONLY">
														Read Only
													</SelectItem>
													<SelectItem value="EDIT">
														Edit
													</SelectItem>
													<SelectItem value="OWNER">
														Owner
													</SelectItem>
												</SelectContent>
											</Select>
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() =>
													handleRemoveUser(
														user.userid,
													)
												}
											>
												<Trash2 className="size-4" />
											</Button>
										</div>
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
