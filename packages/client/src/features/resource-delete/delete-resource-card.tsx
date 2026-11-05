import { Trash2 } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Card,
	CardAction,
	CardDescription,
	CardHeader,
	CardTitle,
	Spinner,
} from "@semoss/ui/next";
import { DeleteEntityDialog } from "@/components/shared/delete-entity-dialog";
import { useSession } from "@/hooks/use-session";
import type { ALL_TYPES } from "@/types";
import { useDeleteResource } from "./use-delete-resource";

export interface DeleteResourceCardProps {
	/** The resource's type: an engine type, or PROJECT */
	type: ALL_TYPES;
	/** The resource's id */
	id: string;
	/** The resource's name */
	name: string;
	/** What the catalog calls the resource, such as "Database" or "Agent" */
	label: string;
	/** For a project, its project type, which picks the delete pixel */
	projectType?: string;
	/** Called after the resource is deleted */
	onDeleted: () => void;
}

/**
 * The card in a Settings tab's Dangerous section that deletes the engine or
 * project, after the user confirms. The dialog stays open when the delete
 * fails.
 */
export const DeleteResourceCard = ({
	type,
	id,
	name,
	label,
	projectType,
	onDeleted,
}: DeleteResourceCardProps) => {
	const isEngineOperationAvailable = useSession(
		(state) => state.isEngineOperationAvailable,
	);
	const { isDeleting, deleteResource } = useDeleteResource({
		type,
		id,
		projectType,
	});
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);

	const handleConfirm = async () => {
		if (await deleteResource()) {
			setIsConfirmOpen(false);
			onDeleted();
		}
	};

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Delete {label}</CardTitle>
					<CardDescription>
						Permanently delete {name} for everyone who has access to
						it. This cannot be undone.
					</CardDescription>
					<CardAction className="self-center">
						<Button
							type="button"
							variant="destructive"
							size="sm"
							disabled={
								isDeleting ||
								!isEngineOperationAvailable(type, "delete")
							}
							onClick={() => setIsConfirmOpen(true)}
							data-testid="deleteResourceCard-delete-btn"
						>
							{isDeleting ? (
								<Spinner className="size-4" />
							) : (
								<Trash2 aria-hidden />
							)}
							{isDeleting ? "Deleting..." : `Delete ${label}`}
						</Button>
					</CardAction>
				</CardHeader>
			</Card>
			<DeleteEntityDialog
				open={isConfirmOpen}
				onOpenChange={(open) => {
					if (!isDeleting) {
						setIsConfirmOpen(open);
					}
				}}
				entityLabel={label}
				entityName={name}
				entityId={id}
				onConfirm={handleConfirm}
				isLoading={isDeleting}
				cancelButtonTestId="deleteResourceCard-cancel-btn"
				confirmButtonTestId="deleteResourceCard-confirm-btn"
			/>
		</>
	);
};
