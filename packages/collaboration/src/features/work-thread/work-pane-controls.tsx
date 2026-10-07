import { PanelLeftClose, PanelLeftOpen, PanelRightOpen } from "lucide-react";
import { WorkbenchChromeButton } from "@semoss/workbench";

/** The header stays quiet; source panes use their own close buttons and rails. */
export function WorkPaneControls({
	isChatVisible,
	isWorkbenchOpen,
	onToggleChat,
	isCompact,
}: {
	isChatVisible: boolean;
	isWorkbenchOpen: boolean;
	onToggleChat: () => void;
	isCompact: boolean;
}) {
	if (isCompact && !isChatVisible) return null;
	return (
		<WorkbenchChromeButton
			icon={
				!isWorkbenchOpen
					? PanelRightOpen
					: isChatVisible
						? PanelLeftClose
						: PanelLeftOpen
			}
			label={
				!isWorkbenchOpen
					? "Show workbench"
					: isChatVisible
						? "Collapse chat"
						: "Show chat"
			}
			aria-expanded={isWorkbenchOpen && isChatVisible}
			className="pointer-coarse:size-11"
			onClick={onToggleChat}
		/>
	);
}
