import { SaveIcon } from "lucide-react";
import type { FC } from "react";
import {
	Button,
	cn,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type {
	WorkbenchChromeProps,
	WorkbenchPanelParams,
} from "@/stores/workbench";
import { WORKBENCH_STYLES } from "../../core/workbench.chrome";
import type { AgentEditorSaveValue } from "./agent-editor-panel";

/**
 * The agent editor's chrome control. `AgentEditorPanel` publishes its save
 * state through the panel's scratch `value` (see its `setValue` call) rather
 * than rendering an in-body toolbar, so Save rides the tab strip like every
 * other panel's control.
 */
export const AgentEditorSaveControl: FC<
	WorkbenchChromeProps<WorkbenchPanelParams, AgentEditorSaveValue>
> = ({ value }) => {
	const isLoading = value?.isLoading ?? false;
	const isFetching = value?.isFetching ?? false;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Save agent"
					data-testid="agent-editor-save-button"
					disabled={!value || isLoading || isFetching}
					onClick={() => value?.onSave()}
					className={cn(
						"flex-none text-muted-foreground",
						WORKBENCH_STYLES.chromeButton,
					)}
				>
					{isLoading ? (
						<Spinner className={WORKBENCH_STYLES.chromeIcon} />
					) : (
						<SaveIcon className={WORKBENCH_STYLES.chromeIcon} />
					)}
				</Button>
			</TooltipTrigger>
			<TooltipContent>Save agent</TooltipContent>
		</Tooltip>
	);
};
