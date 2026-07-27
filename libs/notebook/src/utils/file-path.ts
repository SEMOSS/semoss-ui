/**
 * Builds a safe, unique-enough .ipynb file path from a user-supplied name
 * (sanitizing path-separator/reserved characters), or a timestamped default
 * when no name is given.
 */
export const createNotebookFilePath = (requestedName?: string): string => {
	if (!requestedName || !requestedName.trim()) {
		return `save-notebook-response-${Date.now()}.ipynb`;
	}

	const sanitizedBase = requestedName
		.trim()
		.replace(/[\\/:*?"<>|]/g, "-")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

	const normalizedBase =
		sanitizedBase || `save-notebook-response-${Date.now()}`;

	if (normalizedBase.toLowerCase().endsWith(".ipynb")) {
		return normalizedBase;
	}

	return `${normalizedBase}.ipynb`;
};
