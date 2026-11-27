/** The subject Outlook gives a reply or forward; it adds the prefix itself, once. */
export function answerSubject(
	mode: "reply" | "forward",
	subject: string,
): string {
	const prefix = mode === "reply" ? "RE:" : "FW:";
	const already = mode === "reply" ? /^re\s*:/i : /^(fw|fwd)\s*:/i;
	return already.test(subject) ? subject : `${prefix} ${subject}`;
}

/**
 * The subject a reply draft is saved with when its owner (or the assistant) changed it.
 *
 * @param subject - The subject now in the editor.
 * @param sourceSubject - The subject of the email being answered.
 * @returns The new subject, or undefined when it is still the one Outlook gives the reply.
 */
export function replySubjectOverride(
	subject: string,
	sourceSubject: string | undefined,
): string | undefined {
	const next = subject.trim();
	if (!next) return undefined;
	const original = (sourceSubject ?? "").trim();
	if (next === original || next === answerSubject("reply", original))
		return undefined;
	return next;
}
