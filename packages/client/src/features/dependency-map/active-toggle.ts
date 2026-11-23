/**
 * The on state of a view picker on the dependency graphs: the item chosen is
 * filled in the primary colour, so which view is showing reads at a glance.
 * The shared toggle's own on state, a light accent, is too quiet for a mode.
 *
 * It keys off `aria-checked` (a single-choice toggle group's items are radios),
 * not `data-state`: a Tooltip wrapped around an item writes its own
 * `data-state` (closed or open) over the toggle's `on`.
 */
export const ACTIVE_TOGGLE_CLASS =
	"aria-checked:bg-primary aria-checked:text-primary-foreground aria-checked:hover:bg-primary/90 aria-checked:hover:text-primary-foreground";
