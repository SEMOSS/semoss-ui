/**
 * The one size scale the workbench chrome draws itself at.
 *
 * Rails, tab strips, the mobile header, and every icon button read from here
 * so the surfaces stay dimensionally in step — a rail icon and a tab are the
 * same height, and a rail is exactly a button plus its padding.
 *
 * Glyphs are sized with a Tailwind class rather than lucide's `size` prop:
 * `Button` sets `[&_svg:not([class*='size-'])]:size-4`, so an attribute-sized
 * icon inside a Button is overridden back to 16px and the prop reads as a lie.
 */

/** Border rail thickness: width on a left/right rail, height on top/bottom. */
export const RAIL_THICKNESS = { vertical: "w-10", horizontal: "h-10" } as const;

/** Padding inside a rail. Leaves exactly `CHROME_BUTTON` of content. */
export const RAIL_PADDING = "p-1";

/** Square hit target for chrome: rail icons, tab-strip and header controls. */
export const CHROME_BUTTON = "size-7";

/** Hit target for a control that sits *inside* a tab, like pin and close. */
export const CHROME_BUTTON_SM = "size-5";

/** The glyph in a `CHROME_BUTTON`, and any inline header icon. */
export const CHROME_ICON = "size-3.5";

/** The glyph in a `CHROME_BUTTON_SM`. */
export const CHROME_ICON_SM = "size-3";

/**
 * A card's *inner* corner radius: the `rounded-lg` outer curve less the 1px
 * border it sits behind. Matches the `calc(var(--radius) - Npx)` idiom the
 * design system already uses for nested surfaces.
 */
const SLOT_RADIUS = "calc(var(--radius) - 1px)";

/**
 * The `border-radius` shorthand a slot hands its panel body, naming only the
 * corners where the slot actually meets its card's rounded edge. Bodies are
 * drawn in the overlay, so the card cannot clip them — without this their
 * square corners paint over the card's curve.
 *
 * @param corners - Which corners meet the card's outer edge.
 * @return A four-value `border-radius`, in CSS corner order.
 */
export const slotRadius = (corners: {
	tl?: boolean;
	tr?: boolean;
	br?: boolean;
	bl?: boolean;
}): string =>
	[corners.tl, corners.tr, corners.br, corners.bl]
		.map((round) => (round ? SLOT_RADIUS : "0"))
		.join(" ");
