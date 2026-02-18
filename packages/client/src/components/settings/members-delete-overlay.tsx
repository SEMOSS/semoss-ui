import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	toast,
} from "@semoss/ui/next";
import {
	removeEngineUserPermissions,
	removeProjectUserPermissions,
} from "@/api";
import { useSettings } from "@/hooks";
import type { ALL_TYPES, ApiResponse } from "@/types";
import type { SETTINGS_PROVISIONED_USER } from "./settings.types";

interface MembersDeleteOverlayProps {
	/**
	 * Type of engine
	 */
	type: ALL_TYPES;

	/**
	 * ID of the app or engine being edited
	 */
	id: string;

	/**
	 * Members
	 */
	members: SETTINGS_PROVISIONED_USER[];

	/**
	 * Track if the model is open or close
	 */
	open: boolean;

	/**
	 * Called on close
	 *
	 * @returns - method that is called onClose
	 */
	onClose: (success: boolean) => void;
}

export const MembersDeleteOverlay = (props: MembersDeleteOverlayProps) => {
	const {
		type,
		id,
		members = [],
		open = false,
		onClose = () => null,
	} = props;

	const { adminMode } = useSettings();

	/**
	 * @name deleteSelectedMembers
	 * @param members - members that will be deleted
	 *
	 * delete the selected members from the app or engine
	 */
	const deleteSelectedMembers = async (
		members: SETTINGS_PROVISIONED_USER[],
	) => {
		let success = false;

		try {
			// construct requests for post data
			const requests = members.map((m) => {
				return m.id;
			});

			let response:
				| ApiResponse<{ success: boolean }>
				| {
						response: Response;
						data: {
							success: boolean;
						};
				  }
				| null = null;
			if (
				type === "DATABASE" ||
				type === "STORAGE" ||
				type === "MODEL" ||
				type === "VECTOR" ||
				type === "FUNCTION"
			) {
				response = await removeEngineUserPermissions(
					adminMode,
					id,
					requests,
				);
			} else if (type === "PROJECT") {
				response = await removeProjectUserPermissions(
					adminMode,
					id,
					requests,
				);
			}

			if (!response) {
				return;
			}

			// ignore if there is no response
			if (response.data.success) {
				toast.success(
					`Successfully removed ${
						requests.length > 1 ? "members" : "member"
					}`,
				);

				success = true;
			} else {
				toast.error(`Error changing user permissions`);
			}
		} catch (e) {
			toast.error(String(e));
		} finally {
			// close the overlay
			onClose(success);
		}
	};

	return (
		<Dialog open={open} onOpenChange={(open) => !open && onClose(false)}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Are you sure?</DialogTitle>
				</DialogHeader>
				<p className="text-sm">
					Would you like to delete all selected members
				</p>
				<DialogFooter>
					<Button variant="outline" onClick={() => onClose(false)}>
						Close
					</Button>
					<Button
						variant="destructive"
						onClick={() => {
							deleteSelectedMembers(members);
						}}
					>
						Confirm
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
