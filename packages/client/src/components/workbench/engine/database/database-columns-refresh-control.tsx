import { RefreshCw } from "lucide-react";
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
 * The columns panel's chrome control. Refresh acts on the whole structure the
 * panel shows, not on anything inside it, so it belongs to the panel's chrome
 * rather than the body's search row.
 *
 * It reads the structure's status itself: a control draws in the chrome's
 * subtree, which does not re-render when its panel does, so a spinner closed
 * over the panel's render would never turn.
 */
export const DatabaseColumnsRefreshControl: FC<WorkbenchChromeProps> = () => {
	const isLoading = useDatabaseWorkbench(
		(state) => state.structure.status === "LOADING",
	);
	const refreshStructure = useDatabaseWorkbench(
		(state) => state.structure.refresh,
	);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={() => refreshStructure()}
					disabled={isLoading}
					aria-label="Refresh database structure"
					data-testid="database-columns--refresh-btn"
					className={cn(
						"flex-none text-muted-foreground",
						WORKBENCH_STYLES.chromeButton,
					)}
				>
					<RefreshCw
						className={cn(
							WORKBENCH_STYLES.chromeIcon,
							isLoading && "animate-spin",
						)}
					/>
				</Button>
			</TooltipTrigger>
			<TooltipContent>Refresh database structure</TooltipContent>
		</Tooltip>
	);
};
