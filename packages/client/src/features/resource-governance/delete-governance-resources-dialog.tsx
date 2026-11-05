import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Spinner,
} from "@semoss/ui/next";
import { capitalize } from "@semoss/utility/text";
import { GovernanceResourceIcon } from "./governance-resource-icon";
import { GOVERNANCE_NOUNS, type GovernanceType } from "./governance-types";
import { useDeleteGovernanceResources } from "./use-delete-governance-resources";
import type { GovernanceResource } from "./use-governance-resources";

export interface DeleteGovernanceResourcesDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** The type of the resources */
	entry: GovernanceType;
	/** The resources to delete, kept while the dialog closes */
	resources: GovernanceResource[];
	/** Called when the dialog closes without deleting */
	onCancel: () => void;
	/** Called with the ids deleted, once every delete has finished */
	onDeleted: (ids: string[]) => void;
}

/**
 * Confirms deleting the projects or engines picked in the list, names each
 * one, then deletes them.
 */
export const DeleteGovernanceResourcesDialog = ({
	open,
	entry,
	resources,
	onCancel,
	onDeleted,
}: DeleteGovernanceResourcesDialogProps) => {
	const { isDeleting, deleteResources } = useDeleteGovernanceResources(entry);
	const nouns = GOVERNANCE_NOUNS[entry.kind];
	const count = resources.length;
	const noun = count === 1 ? nouns.singular : nouns.plural;

	const handleDelete = async () => {
		onDeleted(await deleteResources(resources));
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen && !isDeleting) {
					onCancel();
				}
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						Delete {count} {capitalize(noun)}
					</DialogTitle>
					<DialogDescription>
						{count === 1 ? "It is" : "Each one is"} deleted for
						everyone, with its access and its files. This action
						cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<ul
					aria-label={`The ${noun} to delete`}
					className="max-h-60 overflow-y-auto rounded-md border border-border/60"
				>
					{resources.map((resource) => (
						<li
							key={resource.id}
							className="flex items-center gap-2.5 border-border/40 border-b px-3 py-2 last:border-b-0"
						>
							<GovernanceResourceIcon
								entry={entry}
								resource={resource}
								className="size-6"
							/>
							<span className="flex min-w-0 flex-col">
								<span className="truncate font-medium text-sm">
									{resource.name}
								</span>
								<span className="truncate text-muted-foreground text-xs">
									id: {resource.id}
								</span>
							</span>
						</li>
					))}
				</ul>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						disabled={isDeleting}
						onClick={onCancel}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						disabled={isDeleting}
						onClick={handleDelete}
					>
						{isDeleting ? <Spinner /> : null}
						{isDeleting ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
