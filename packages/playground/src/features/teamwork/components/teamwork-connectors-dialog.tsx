import { observer } from "mobx-react-lite";
import { Dialog, DialogContent } from "@semoss/ui/next";
import type { TeamworkStore } from "../teamwork.store";
import { TeamworkConnectorsForm } from "./teamwork-connectors-form";

/** Props for {@link TeamworkConnectorsDialog}. */
export interface TeamworkConnectorsDialogProps {
	/** The room's teamwork state, which also owns whether the dialog is open. */
	teamwork: TeamworkStore;
}

/**
 * The dialog that switches connectors for a chat. The form inside mounts fresh
 * each time, so it starts from the chat's current services.
 */
export const TeamworkConnectorsDialog = observer(
	({ teamwork }: TeamworkConnectorsDialogProps) => (
		<Dialog
			open={teamwork.isConnectorsDialogOpen}
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					teamwork.closeConnectorsDialog();
				}
			}}
		>
			{/* design-lint-disable-next-line arbitrary-size -- keeps the dialog inside short viewports */}
			<DialogContent className="flex max-h-[85vh] w-full flex-col gap-4 sm:max-w-lg">
				<TeamworkConnectorsForm
					teamwork={teamwork}
					onDone={teamwork.closeConnectorsDialog}
				/>
			</DialogContent>
		</Dialog>
	),
);
