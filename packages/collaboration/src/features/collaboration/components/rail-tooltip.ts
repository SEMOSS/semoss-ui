import type { FocusEvent } from "react";

// a rail link refocused by a click or a tab switch should not pop its label open; keyboard focus still does
export function openOnKeyboardFocusOnly(event: FocusEvent<HTMLElement>) {
	if (!event.currentTarget.matches(":focus-visible")) event.preventDefault();
}

// close at once: an exit animation in a background tab never ends, so the label stays stuck on screen
export const RAIL_TOOLTIP_CONTENT = "data-[state=closed]:animate-none";
