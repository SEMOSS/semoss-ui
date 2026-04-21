import { observer } from "mobx-react-lite";
import { Dialog, DialogContent, DialogTitle } from "@semoss/ui/next";
import { useWorkspace } from "@/hooks";

const MAX_WIDTH_CLASS: Record<string, string> = {
	sm: "sm:max-w-sm",
	md: "sm:max-w-md",
	lg: "sm:max-w-lg",
	xl: "sm:max-w-xl",
};

/**
 * WorkspaceOverlay can update the overlay in the workspace
 */
export const WorkspaceOverlay = observer((): JSX.Element => {
	const { workspace } = useWorkspace();
	const maxWidthClass =
		MAX_WIDTH_CLASS[workspace.overlay.options?.maxWidth ?? ""] ??
		"sm:max-w-[90vw]";

	return (
		<Dialog
			open={workspace.overlay.open}
			onOpenChange={(o) => {
				if (!o) workspace.closeOverlay();
			}}
		>
			<DialogContent
				className={`max-h-[90vh] overflow-auto p-0 ${maxWidthClass}`}
				showCloseButton={false}
			>
				<DialogTitle className="sr-only">Dialog</DialogTitle>
				{workspace.overlay.content ? workspace.overlay.content() : null}
			</DialogContent>
		</Dialog>
	);
});
