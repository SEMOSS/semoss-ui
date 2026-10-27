import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";

export interface ExportEngineDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** What the catalog calls the engine, such as "Database" */
	engineLabel: string;
	/** Called with the choice to export with or without the data */
	onExport: (includeData: boolean) => void;
	/** Called when the dialog closes without an export */
	onClose: () => void;
}

/**
 * Asks whether to include the data when exporting an engine that holds its
 * data in a file, such as an H2 database.
 */
export const ExportEngineDialog = ({
	open,
	engineLabel,
	onExport,
	onClose,
}: ExportEngineDialogProps) => (
	<Dialog
		open={open}
		onOpenChange={(isOpen) => {
			if (!isOpen) {
				onClose();
			}
		}}
	>
		<DialogContent>
			<DialogHeader>
				<DialogTitle className="font-medium text-base leading-6">
					Export {engineLabel}
				</DialogTitle>
				<DialogDescription>
					Do you want to include the data in the export?
				</DialogDescription>
			</DialogHeader>
			<DialogFooter>
				<Button type="button" variant="outline" onClick={onClose}>
					Cancel
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => onExport(false)}
				>
					Without Data
				</Button>
				<Button type="button" onClick={() => onExport(true)}>
					With Data
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
);
