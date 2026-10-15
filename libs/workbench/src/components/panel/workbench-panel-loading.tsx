import type { FC } from "react";
import { Spinner } from "@semoss/ui/next";

export interface WorkbenchPanelLoadingProps {
	/**
	 * What is being waited on, announced to a screen reader. The dock does not
	 * know why a panel is waiting, so a caller that does (resource access, a
	 * file read) passes its own wording.
	 */
	label?: string;
}

/**
 * The spinner a panel shows in place of a body it cannot draw yet.
 *
 * One mode, and no placement prop: this is only ever the blocking gate before
 * a first render. It deliberately has no overlay form. A *background* refresh
 * over an already-drawn body must not be a full-panel scrim — that hides the
 * stale-but-usable content the refresh exists to preserve, and since every
 * domain workbench refreshes permission on mount, it would flash over every
 * panel on every mount. The repo's own answer for that case is a spinning
 * control button (`isRefreshing` on `GitBranchControl`): only the button
 * spins, so the body stays readable.
 *
 * `WorkbenchPanelError` does keep an `overlay` form, because the asymmetry is
 * real — a refresh that *succeeded* needs no UI, one that failed has to be
 * seen and retried.
 */
export const WorkbenchPanelLoading: FC<WorkbenchPanelLoadingProps> = ({
	label = "Loading",
}) => (
	<output
		aria-label={label}
		className="flex size-full items-center justify-center bg-background"
	>
		<Spinner />
	</output>
);
