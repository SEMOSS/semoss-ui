import type {
	ProfileStyle,
	StyleAudience,
	StyleVariant,
} from "./collaboration.types";

export const styleAudiences: readonly StyleAudience[] = [
	"internal",
	"external",
];

/** What a draft may use: the agreed summary, examples, and variants, never a proposal still to review. */
export function agreedStyle(style: ProfileStyle): ProfileStyle {
	const variants: Partial<Record<StyleAudience, StyleVariant>> = {};
	for (const audience of styleAudiences) {
		const variant = style.variants?.[audience];
		if (variant?.summary.trim()) variants[audience] = variant;
	}
	return {
		summary: style.summary,
		source: style.source,
		confirmed: style.confirmed,
		examples: style.examples,
		...(Object.keys(variants).length ? { variants } : {}),
	};
}
