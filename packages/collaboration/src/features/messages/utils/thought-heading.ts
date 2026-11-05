/** The newest bold heading a reasoning summary opens a section with, e.g. "**Searching mail**". */
export function thoughtHeading(text: string): string | undefined {
	const headings = [...text.matchAll(/^\s*\*\*([^*\n]{2,80})\*\*\s*$/gm)];
	const heading = headings.at(-1)?.[1]?.trim();
	return heading || undefined;
}
