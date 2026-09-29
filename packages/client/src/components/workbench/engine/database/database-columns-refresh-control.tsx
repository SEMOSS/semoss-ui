import { RefreshCw } from "lucide-react";
import type { FC } from "react";
import { cn } from "@semoss/ui/next";
import type { WorkbenchPanelProps } from "@semoss/workbench";
import { WorkbenchChromeButton } from "@semoss/workbench";
import { useDatabaseWorkbench } from "@/hooks";

/** The refresh glyph, mid-pull. Sized by the chrome button, spun by us. */
const SpinningRefreshIcon = ({ className }: { className?: string }) => (
	<RefreshCw className={cn(className, "animate-spin")} />
);

/**
 * The columns panel's chrome control. Refresh acts on the whole structure the
 * panel shows, not on anything inside it, so it belongs to the panel's chrome
 * rather than the body's search row.
 *
 * It reads the structure's status itself: a control draws in the chrome's
 * subtree, which does not re-render when its panel does, so a spinner closed
 * over the panel's render would never turn.
 */
export const DatabaseColumnsRefreshControl: FC<WorkbenchPanelProps> = () => {
	const isLoading = useDatabaseWorkbench(
		(state) => state.structure.status === "LOADING",
	);
	const refreshStructure = useDatabaseWorkbench(
		(state) => state.structure.refresh,
	);

	return (
		<WorkbenchChromeButton
			icon={isLoading ? SpinningRefreshIcon : RefreshCw}
			label="Refresh database structure"
			onClick={() => refreshStructure()}
			disabled={isLoading}
			data-testid="database-columns--refresh-btn"
		/>
	);
};
