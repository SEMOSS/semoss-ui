import { z } from "@semoss/ui/next";
import type { StyleAudience, StyleVariant } from "../state/collaboration.types";

/** Matches the server's caps so a saved style is never silently trimmed. */
export const MAX_STYLE_EXAMPLES = 5;
const MAX_SUMMARY = 1500;
const MAX_EXAMPLE = 600;

const exampleSchema = z.object({
	text: z
		.string()
		.max(MAX_EXAMPLE, `Keep an example under ${MAX_EXAMPLE} characters`),
});

const variantSchema = z.object({
	summary: z
		.string()
		.max(MAX_SUMMARY, `Keep this under ${MAX_SUMMARY} characters`),
	examples: z.array(exampleSchema).max(MAX_STYLE_EXAMPLES),
});

export const styleFormSchema = z
	.object({
		summary: z
			.string()
			.trim()
			.min(1, "Describe how you write")
			.max(MAX_SUMMARY, `Keep this under ${MAX_SUMMARY} characters`),
		examples: z.array(exampleSchema).max(MAX_STYLE_EXAMPLES),
		internal: variantSchema,
		external: variantSchema,
	})
	.superRefine((values, context) => {
		for (const audience of ["internal", "external"] as const) {
			const variant = values[audience];
			const hasExamples = variant.examples.some((example) =>
				example.text.trim(),
			);
			if (hasExamples && !variant.summary.trim())
				context.addIssue({
					code: "custom",
					path: [audience, "summary"],
					message: "Describe this style, or remove its examples",
				});
		}
	});

export type StyleFormValues = z.infer<typeof styleFormSchema>;

/** The agreed or proposed style a form edits and returns. */
export interface StyleDraft {
	summary: string;
	examples: string[];
	variants: Partial<Record<StyleAudience, StyleVariant>>;
}

const toFields = (examples: string[]) => examples.map((text) => ({ text }));

/** Form values for a style; every field has a value so the form is never uncontrolled. */
export function toStyleFormValues(draft: StyleDraft): StyleFormValues {
	const variant = (audience: StyleAudience) => ({
		summary: draft.variants[audience]?.summary ?? "",
		examples: toFields(draft.variants[audience]?.examples ?? []),
	});
	return {
		summary: draft.summary,
		examples: toFields(draft.examples),
		internal: variant("internal"),
		external: variant("external"),
	};
}

const toExamples = (fields: { text: string }[]): string[] =>
	fields.map((field) => field.text.trim()).filter(Boolean);

/** The draft to keep: blank examples are dropped, and a variant with no summary is not kept. */
export function fromStyleFormValues(values: StyleFormValues): StyleDraft {
	const variants: StyleDraft["variants"] = {};
	for (const audience of ["internal", "external"] as const) {
		const summary = values[audience].summary.trim();
		if (summary)
			variants[audience] = {
				summary,
				examples: toExamples(values[audience].examples),
			};
	}
	return {
		summary: values.summary.trim(),
		examples: toExamples(values.examples),
		variants,
	};
}
