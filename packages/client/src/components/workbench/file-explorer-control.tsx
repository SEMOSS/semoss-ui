import { FilePlus2Icon, RefreshCwIcon } from "lucide-react";
import type { FC } from "react";
import type { FileExplorerApi } from "@semoss/shared";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui";
import type {
	WorkbenchChromeProps,
	WorkbenchPanelParams,
} from "@/stores/workbench";
import { WORKBENCH_STYLES } from "./core/workbench.chrome";

/**
 * The chrome control shared by every file-explorer panel: refresh, and a `+`
 * that opens the explorer's new-file overlay.
 *
 * A control draws in the chrome's subtree rather than its panel's, so it gets
 * the explorer through the panel's never-persisted scratch `value` — the
 * channel `components/workbench/AGENTS.md` prescribes. That works because
 * `useFileExplorer` returns an identity-stable api, so the panel publishes it
 * once. The flip side is that this control does **not** re-render when the
 * explorer does; it draws only fixed glyphs and calls `commands`, and both
 * pieces are the same components the explorer's own header uses.
 *
 * `+` deliberately passes no action, so the overlay opens on its action picker
 * and the user chooses upload / new file / new folder there — the same overlay
 * the right-click menu opens straight into a specific action.
 *
 * Lives at `components/workbench/` rather than under `project/` or `engine/`
 * because both families' explorers use it.
 */
export const FileExplorerControl: FC<
	WorkbenchChromeProps<WorkbenchPanelParams, FileExplorerApi>
> = ({ value }) => {
	if (!value) {
		return null;
	}

	return (
		<>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						data-testid="file-explorer-new-button"
						variant="ghost"
						size="icon-sm"
						className={`flex-none text-muted-foreground ${WORKBENCH_STYLES.chromeButton}`}
						aria-label="New"
						onClick={() => value.commands.openNewFile()}
					>
						<FilePlus2Icon
							aria-hidden
							className={WORKBENCH_STYLES.chromeIcon}
						/>
					</Button>
				</TooltipTrigger>
				<TooltipContent>New</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						data-testid="file-explorer-refresh-button"
						variant="ghost"
						size="icon-sm"
						className={`flex-none text-muted-foreground ${WORKBENCH_STYLES.chromeButton}`}
						aria-label="Refresh"
						onClick={() => value.commands.refresh()}
					>
						<RefreshCwIcon
							aria-hidden
							className={cn(WORKBENCH_STYLES.chromeIcon)}
						/>
					</Button>
				</TooltipTrigger>
				<TooltipContent>Refresh {value.header.path}</TooltipContent>
			</Tooltip>
		</>
	);
};
