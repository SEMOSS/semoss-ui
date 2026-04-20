import { observer } from "mobx-react-lite";
import { Dialog, DialogContent } from "@semoss/ui/next";
import { useWorkspace } from "@/hooks";

/**
 * WorkspaceOverlay can update the overlay in the workspace
 */
export const WorkspaceOverlay = observer((): JSX.Element => {
	const { workspace } = useWorkspace();

	return (
		<Dialog
			open={workspace.overlay.open}
			onOpenChange={(o) => {
				if (!o) workspace.closeOverlay();
			}}
		>
			<DialogContent
				className="max-h-[90vh] overflow-auto p-0 sm:max-w-[90vw]"
				showCloseButton={false}
			>
				{workspace.overlay.content ? workspace.overlay.content() : null}
			</DialogContent>
		</Dialog>
	);
});
