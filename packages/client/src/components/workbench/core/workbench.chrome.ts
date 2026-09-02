/**
 * A card's *inner* corner radius: the `rounded-lg` outer curve less the 1px
 * border it sits behind. Matches the `calc(var(--radius) - Npx)` idiom the
 * design system already uses for nested surfaces.
 */
const SLOT_RADIUS = "calc(var(--radius) - 1px)";

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
export const WORKBENCH_STYLES = {
	/** Border rail thickness: width on a left/right rail, height on top/bottom. */
	railThickness: { vertical: "w-10", horizontal: "h-10" },

	/** Padding inside a rail. Leaves exactly `chromeButton` of content. */
	railPadding: "p-1",

	/**
	 * The header row the shell draws over an open border body — a border has
	 * no tab strip, so this is where its label and control sit. A
	 * `chromeButton` plus the same padding a rail gives one.
	 */
	borderHeader: "h-9",

	/** Square hit target for chrome: rail icons, tab-strip and header controls. */
	chromeButton: "size-7",

	/** Hit target for a control that sits *inside* a tab, like pin and close. */
	chromeButtonSm: "size-5",

	/** A selected/showing chrome control: tabs, panel toggles. */
	chromeButtonActive: "bg-accent font-medium text-foreground",

	/** Its resting state — muted until hovered. */
	chromeButtonInactive:
		"text-muted-foreground hover:bg-accent/50 hover:text-foreground",

	/** The glyph in a `chromeButton`, and any inline header icon. */
	chromeIcon: "size-3.5",

	/** The glyph in a `chromeButtonSm`. */
	chromeIconSm: "size-3",

	/** Compact select trigger used by mode controls in the workbench header. */
	chromeSelect:
		"h-6! border-0 bg-transparent py-0 px-1.5 text-xs text-muted-foreground shadow-none",

	/** A mobile tab: touch target with a floor for short labels. */
	mobileTab: "h-8 min-w-16",

	/** The glyph in a mobile-scale control (pager chevrons, drawer trigger). */
	mobileIcon: "size-4",

	/**
	 * The `border-radius` shorthand a slot hands its panel body, naming only
	 * the corners where the slot actually meets its card's rounded edge.
	 * Bodies are drawn in the overlay, so the card cannot clip them — without
	 * this their square corners paint over the card's curve.
	 *
	 * @param corners - Which corners meet the card's outer edge.
	 * @return A four-value `border-radius`, in CSS corner order.
	 */
	slotRadius: (corners: {
		tl?: boolean;
		tr?: boolean;
		br?: boolean;
		bl?: boolean;
	}): string =>
		[corners.tl, corners.tr, corners.br, corners.bl]
			.map((round) => (round ? SLOT_RADIUS : "0"))
			.join(" "),
} as const;
