import type { ComponentProps } from "react";
import type { Code } from "@semoss/ui/next";

type CodeLanguage = ComponentProps<typeof Code>["language"];

const SUPPORTED_LANGUAGES = new Set<NonNullable<CodeLanguage>>([
	"text",
	"txt",
	"jsx",
	"tsx",
	"javascript",
	"js",
	"typescript",
	"ts",
	"html",
	"css",
	"python",
	"py",
	"json",
	"java",
	"markdown",
	"md",
	"yaml",
	"yml",
	"xml",
	"sh",
	"bash",
	"csv",
	"tsv",
]);

/** Keep partial or unknown fence labels away from Shiki's finite language set. */
export function normalizeCodeLanguage(language?: string | null): {
	language: CodeLanguage;
	label: string;
} {
	const normalized = language?.trim().toLowerCase() || "txt";
	return {
		language: SUPPORTED_LANGUAGES.has(
			normalized as NonNullable<CodeLanguage>,
		)
			? (normalized as CodeLanguage)
			: "txt",
		label: normalized.toUpperCase(),
	};
}
