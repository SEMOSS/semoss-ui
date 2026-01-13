import { useNotification } from "@semoss/ui";
import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
} from "@semoss/ui/next";
import { apiPost } from "../utility/api";

export const DeleteMembersOverlay = ({
	id,
	type,
	open,
	onClose,
	idsToDelete,
}) => {
	const notification = useNotification();
	const usersUrl =
		type === "PROJECT"
			? "removeProjectUserPermissions"
			: "removeEngineUserPermissions";
	const typeId = type === "PROJECT" ? "projectId" : "engineId";

	function deleteSelectedMembers() {
		// Logic to delete members
		apiPost(`/api/auth/project/${usersUrl}`, {
			[typeId]: id,
			ids: idsToDelete,
		})
			.then(() => {
				notification.add({
					id: "success",
					color: "success",
					message: "Selected members have been deleted successfully.",
				});
				onClose();
			})
			.catch(() => {
				notification.add({
					id: "error",
					color: "error",
					message:
						"There was an error deleting the selected members.",
				});
				onClose();
			});
	}

	return (
		<div className="position-relative w-full">
			<Dialog open={open} onOpenChange={onClose}>
				<DialogContent className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-lg">
					<DialogTitle>Delete Members</DialogTitle>

					<DialogDescription className="mb-4 flex flex-col gap-4 text-gray-600">
						Do you want to delete the selected members?
					</DialogDescription>
					<DialogFooter>
						<DialogClose>
							<Button
								variant="destructive"
								onClick={() => {
									deleteSelectedMembers();
								}}
							>
								Confirm
							</Button>
							<Button variant="ghost" onClick={onClose}>
								Cancel
							</Button>
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
