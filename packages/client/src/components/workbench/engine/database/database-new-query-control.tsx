import { PlusIcon } from "lucide-react";
import type { FC } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useDatabaseWorkbench } from "@/hooks";
import type { WorkbenchChromeProps } from "@/stores/workbench";
import { WORKBENCH_STYLES } from "../../core/workbench.chrome";

/**
 * The query panel's chrome control. New Query is the query surface's own
 * action, so it rides the panel header rather than the workbench toolbar — it
 * appears beside whichever query tab is front, which is also the one it opens
 * a sibling of.
 */
export const DatabaseNewQueryControl: FC<WorkbenchChromeProps> = () => {
	const addQueryPanel = useDatabaseWorkbench((state) => state.addQueryPanel);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="New query"
					data-testid="workbench-new-query-button"
					onClick={() => addQueryPanel("")}
					className={cn(
						"flex-none text-muted-foreground",
						WORKBENCH_STYLES.chromeButton,
					)}
				>
					<PlusIcon className={WORKBENCH_STYLES.chromeIcon} />
				</Button>
			</TooltipTrigger>
			<TooltipContent>New query</TooltipContent>
		</Tooltip>
	);
};
