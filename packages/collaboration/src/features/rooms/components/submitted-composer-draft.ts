import type { ComposerDraft } from "./room-composer.types";

/** Whether the submitted text/document still represents the current editor. */
export function isSubmittedComposerContent(
	current: ComposerDraft,
	submitted: ComposerDraft,
): boolean {
	return (
		current.text === submitted.text &&
		JSON.stringify(current.document) === JSON.stringify(submitted.document)
	);
}

/** Remove a confirmed submission while retaining later edits and attachments. */
export function removeSubmittedComposerDraft(
	current: ComposerDraft,
	submitted: ComposerDraft,
): ComposerDraft {
	const shouldClearContent = isSubmittedComposerContent(current, submitted);
	const submittedFiles = new Set(submitted.files);
	const files = current.files.filter((file) => !submittedFiles.has(file));
	if (
		(!shouldClearContent || (!current.text && !current.document)) &&
		files.length === current.files.length
	)
		return current;
	return {
		document: shouldClearContent ? null : current.document,
		text: shouldClearContent ? "" : current.text,
		files,
	};
}
