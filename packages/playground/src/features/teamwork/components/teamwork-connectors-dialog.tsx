import { observer } from "mobx-react-lite";
import { Dialog, DialogContent } from "@semoss/ui/next";
import type { TeamworkStore } from "../teamwork.store";
import { TeamworkConnectorsForm } from "./teamwork-connectors-form";

/** Props for {@link TeamworkConnectorsDialog}. */
export interface TeamworkConnectorsDialogProps {
	/** The room's teamwork state, which also owns whether the dialog is open. */
	teamwork: TeamworkStore;
	/** Restores focus when the dialog was opened outside a DialogTrigger. */
	onReturnFocus?: () => void;
}

/**
 * The dialog that switches connectors for a chat. The form inside mounts fresh
 * each time, so it starts from the chat's current services.
 */
export const TeamworkConnectorsDialog = observer(
	({ teamwork, onReturnFocus }: TeamworkConnectorsDialogProps) => (
		<Dialog
			open={teamwork.isConnectorsDialogOpen}
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					teamwork.closeConnectorsDialog();
				}
			}}
		>
			{/* design-lint-disable-next-line arbitrary-size -- keeps the dialog inside short viewports */}
			<DialogContent
				className="flex max-h-[85vh] w-full flex-col gap-4 sm:max-w-lg"
				onCloseAutoFocus={(event) => {
					if (!onReturnFocus) return;
					event.preventDefault();
					onReturnFocus();
				}}
			>
				<TeamworkConnectorsForm
					teamwork={teamwork}
					onDone={teamwork.closeConnectorsDialog}
				/>
			</DialogContent>
		</Dialog>
	),
);
