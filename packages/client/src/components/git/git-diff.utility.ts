import { parsePatch } from "diff";

export interface GitDiffCodeModels {
	/** Reconstructed reference-side hunk content. */
	original: string;
	/** Reconstructed changed-side hunk content. */
	modified: string;
}

const OMITTED_LINES_MARKER = "... unchanged lines omitted ...";

/** Convert a unified patch into aligned hunk snippets for CodeDiffEditor. */
export const getGitDiffCodeModels = (
	diff: string,
): GitDiffCodeModels | null => {
	try {
		const patches = parsePatch(diff);
		const original: string[] = [];
		const modified: string[] = [];
		let hasHunk = false;

		for (const patch of patches) {
			let previousOldEnd: number | null = null;
			let previousNewEnd: number | null = null;

			for (const hunk of patch.hunks) {
				if (
					previousOldEnd !== null &&
					previousNewEnd !== null &&
					(hunk.oldStart > previousOldEnd ||
						hunk.newStart > previousNewEnd)
				) {
					original.push(OMITTED_LINES_MARKER);
					modified.push(OMITTED_LINES_MARKER);
				}

				for (const line of hunk.lines) {
					if (line.startsWith("\\")) {
						continue;
					}

					const content = line.slice(1);
					if (line.startsWith(" ")) {
						original.push(content);
						modified.push(content);
					} else if (line.startsWith("-")) {
						original.push(content);
					} else if (line.startsWith("+")) {
						modified.push(content);
					}
				}

				previousOldEnd = hunk.oldStart + hunk.oldLines;
				previousNewEnd = hunk.newStart + hunk.newLines;
				hasHunk = true;
			}
		}

		if (!hasHunk) {
			return null;
		}

		return {
			original: original.join("\n"),
			modified: modified.join("\n"),
		};
	} catch {
		return null;
	}
};
