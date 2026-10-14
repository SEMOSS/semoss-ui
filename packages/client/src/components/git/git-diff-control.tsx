import { Columns2Icon, Rows2Icon } from "lucide-react";
import type { FC } from "react";
import type { WorkbenchPanelProps } from "@semoss/workbench";
import { useWorkbenchPanel, WorkbenchChromeButton } from "@semoss/workbench";

/** Value shape stored in diff panel state for the chrome control. */
export interface GitDiffControlValue {
	renderSideBySide: boolean;
	setRenderSideBySide: (value: boolean) => void;
}

/** Render layout mode toggle (side-by-side vs inline) in workbench chrome. */
export const GitDiffControl: FC<WorkbenchPanelProps> = ({ id }) => {
	const { value } = useWorkbenchPanel<unknown, GitDiffControlValue>(id);

	if (!value) return null;

	const isSideBySide = value.renderSideBySide;

	return (
		<WorkbenchChromeButton
			icon={isSideBySide ? Columns2Icon : Rows2Icon}
			label={
				isSideBySide
					? "Switch to inline view"
					: "Switch to side-by-side view"
			}
			onClick={() => value.setRenderSideBySide(!isSideBySide)}
		/>
	);
};
