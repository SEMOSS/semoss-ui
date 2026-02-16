import { post as apiPost, Env } from "@semoss/sdk";
import { useNotification } from "@semoss/ui";
import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
	toast,
} from "@semoss/ui/next";

/**
 * DeleteMembersOverlay is a component that allows users to delete members from the app or engine.
 *
 * @param {string} id - the id of the app or engine
 * @param {ALL_TYPES} type - the type of the app or engine (e.g. "PROJECT", "ENGINE")
 * @param {boolean} open - whether the overlay is open or not
 * @param {function} onClose - callback to close the overlay
 * @param {string[]} idsToDelete - the ids of the members to delete
 *
 * @returns {ReactElement} - the DeleteMembersOverlay component
 */
export const DeleteMembersOverlay = ({
	id,
	type,
	open,
	onClose,
	idsToDelete,
}) => {
	const notification = useNotification();
	const usersUrl =
		type === "PROJECT" || type === "WORKSPACE"
			? "removeProjectUserPermissions"
			: "removeEngineUserPermissions";
	const typeId =
		type === "PROJECT" || type === "WORKSPACE" ? "projectId" : "engineId";

	/**
	 * Delete the selected members from the app or engine.
	 *
	 * @throws {Error} - an error occurred while deleting the selected members
	 */
	function deleteSelectedMembers() {
		// Logic to delete members
		apiPost(`${Env.MODULE}/api/auth/project/${usersUrl}`, {
			[typeId]: id,
			ids: idsToDelete,
		})
			.then(() => {
				if (type === "WORKSPACE") {
					toast.success(
						"Selected members have been deleted successfully.",
					);
				} else {
					notification.add({
						id: "success",
						color: "success",
						message:
							"Selected members have been deleted successfully.",
					});
				}
				onClose();
			})
			.catch(() => {
				if (type === "WORKSPACE") {
					toast.error(
						"There was an error deleting the selected members.",
					);
				} else {
					notification.add({
						id: "error",
						color: "error",
						message:
							"There was an error deleting the selected members.",
					});
				}
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
