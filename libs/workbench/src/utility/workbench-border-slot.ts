import type { ReactNode } from "react";
import type { WorkbenchBorderSlot, WorkbenchBorderSlotCtx } from "../types";

/**
 * External rail content: a node as-is, or a function of the border's state.
 *
 * Lives out here rather than beside the border it feeds because three shells
 * resolve slots — the desktop border, the shell's own header row, and the
 * mobile drawer, which has no rails at all and would otherwise import a border
 * component for a one-line function.
 */
export const resolveBorderSlot = (
	slot: WorkbenchBorderSlot | undefined,
	ctx: WorkbenchBorderSlotCtx,
): ReactNode => (typeof slot === "function" ? slot(ctx) : slot);
