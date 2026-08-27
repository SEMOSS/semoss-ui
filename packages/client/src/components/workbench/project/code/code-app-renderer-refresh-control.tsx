import { RefreshCw } from "lucide-react";
import type { FC } from "react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type {
	WorkbenchChromeProps,
	WorkbenchPanelParams,
} from "@/stores/workbench";
import { WORKBENCH_STYLES } from "../../core/workbench.chrome";

/**
 * The app preview's chrome control. Bumping the panel's scratch value rekeys
 * the iframe, which is what a manual refresh means here.
 *
 * The counter lives on the panel's `value` rather than in the panel's own
 * `useState` because a control draws in the chrome's subtree: it cannot share
 * a setter with its panel, and the store round-trip re-renders both.
 */
export const CodeAppRendererRefreshControl: FC<
	WorkbenchChromeProps<WorkbenchPanelParams, number>
> = ({ setValue }) => (
	<Tooltip>
		<TooltipTrigger asChild>
			<Button
				variant="ghost"
				size="icon-sm"
				className={`flex-none text-muted-foreground ${WORKBENCH_STYLES.chromeButton}`}
				onClick={() => setValue((count = 0) => count + 1)}
				aria-label="Refresh app"
				data-testid="workbench-app-renderer-refresh"
			>
				<RefreshCw className={WORKBENCH_STYLES.chromeIcon} />
			</Button>
		</TooltipTrigger>
		<TooltipContent>Refresh</TooltipContent>
	</Tooltip>
);
