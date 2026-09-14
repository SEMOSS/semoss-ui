import { RotateCcw } from "lucide-react";
import type { FC } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { WORKBENCH_STYLES } from "../../constants/workbench.constants";
import { useWorkbench } from "../../hooks";
import type { WorkbenchSnapshot } from "../../types";

/** Props of the reset button. */
interface WorkbenchResetButtonProps {
	/**
	 * The arrangement to go back to — the host's own default, the layout its
	 * dock was defined with.
	 *
	 * The host passes it because only the host has it: the store is handed
	 * whatever was restored from the cache, so a default it kept for itself
	 * would be the cached arrangement and a reset would be a no-op.
	 */
	snapshot: WorkbenchSnapshot;
}

/** Same copy the store applies snapshots through. */
const deepCopy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * Rail button that puts the dock back to the arrangement it is given.
 *
 * Applied through `loadSnapshot`, so a host that persists on `onChange` has
 * the reset written to storage like any other change and it survives a
 * reload.
 */
export const WorkbenchResetButton: FC<WorkbenchResetButtonProps> = ({
	snapshot,
}) => {
	const loadSnapshot = useWorkbench((s) => s.layout.actions.loadSnapshot);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Reset workbench"
					data-testid="workbench-reset-button"
					// A copy per click: `loadSnapshot` applies an arrangement
					// once per identity, and the host's default is one stable
					// object, so a second press would otherwise do nothing.
					onClick={() => loadSnapshot(deepCopy(snapshot))}
					className={cn(
						"border border-transparent text-muted-foreground",
						WORKBENCH_STYLES.chromeButton,
					)}
				>
					<RotateCcw className={WORKBENCH_STYLES.chromeIcon} />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right">Reset workbench</TooltipContent>
		</Tooltip>
	);
};
