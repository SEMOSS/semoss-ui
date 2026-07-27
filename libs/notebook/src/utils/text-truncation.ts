// A runaway print loop or a huge printed object can produce output that
// would otherwise render as a multi-megabyte <pre> block; capping it (with a
// visible notice) mirrors Jupyter's own "output exceeds size limit" guard.
export const MAX_TEXT_OUTPUT_LENGTH = 20_000;

export interface TruncatedText {
	text: string;
	truncated: boolean;
	originalLength: number;
}

export const truncateTextOutput = (text: string): TruncatedText => {
	if (text.length <= MAX_TEXT_OUTPUT_LENGTH) {
		return { text, truncated: false, originalLength: text.length };
	}

	return {
		text: text.slice(0, MAX_TEXT_OUTPUT_LENGTH),
		truncated: true,
		originalLength: text.length,
	};
};
