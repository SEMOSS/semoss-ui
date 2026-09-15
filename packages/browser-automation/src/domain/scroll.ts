/**
 * How far one scroll gesture moves, as a fraction of the viewport height.
 *
 * The backend planner applies the same fraction when it proposes scroll
 * actions (PlanNextPlaywrightActionReactor), so changing this value alone
 * makes the viewer and the planner disagree about how far a step scrolled.
 */
export const SCROLL_SCREEN_FRACTION = 0.3;

/** {@link SCROLL_SCREEN_FRACTION} as a percentage, for step descriptions. */
export const SCROLL_SCREEN_PERCENT = Math.round(SCROLL_SCREEN_FRACTION * 100);

/** Pixels one scroll gesture moves inside a viewport of the given height. */
export function scrollDeltaForViewport(viewportHeight: number): number {
	return Math.max(1, Math.round(viewportHeight * SCROLL_SCREEN_FRACTION));
}
