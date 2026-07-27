import type { NotebookMetadataData } from "../types";
import { getNotebookCellConfig } from "./cell-config";

export const DEFAULT_NBFORMAT = 4;
export const DEFAULT_NBFORMAT_MINOR = 5;

/**
 * Backfills/updates a notebook's top-level kernelspec + language_info
 * metadata for the given language. When `preserveExisting` is set (editing
 * an existing file), an already-present kernelspec/language_info is kept
 * as-is aside from a version bump, instead of being overwritten.
 */
export const applyNotebookLanguageMetadata = (
	notebook: {
		metadata?: Record<string, unknown>;
	},
	lang: string,
	metadataData?: NotebookMetadataData,
	options?: { preserveExisting?: boolean },
): void => {
	const config = getNotebookCellConfig(lang);
	const currentMetadata = notebook.metadata ?? {};
	const hasKernelSpec =
		typeof currentMetadata.kernelspec === "object" &&
		currentMetadata.kernelspec !== null;
	const hasLanguageInfo =
		typeof currentMetadata.language_info === "object" &&
		currentMetadata.language_info !== null;

	notebook.metadata = {
		...currentMetadata,
		// Keep existing kernelspec/language_info when editing an existing file,
		// but still backfill required fields for newly created notebooks.
		kernelspec:
			options?.preserveExisting && hasKernelSpec
				? (currentMetadata.kernelspec as Record<string, unknown>)
				: {
						display_name: config.kernelDisplayName,
						language: config.kernelLanguage,
						name: config.kernelName,
					},
		language_info:
			options?.preserveExisting && hasLanguageInfo
				? {
						...(currentMetadata.language_info as Record<
							string,
							unknown
						>),
						...(metadataData?.languageVersion
							? { version: metadataData.languageVersion }
							: {}),
					}
				: {
						name: config.languageInfoName,
						mimetype: config.languageInfoMimetype,
						file_extension: config.languageInfoFileExtension,
						...(metadataData?.languageVersion
							? { version: metadataData.languageVersion }
							: {}),
					},
	};
};

export const ensureNotebookVersion = (notebook: {
	nbformat?: number;
	nbformat_minor?: number;
}) => {
	notebook.nbformat = DEFAULT_NBFORMAT;
	if (typeof notebook.nbformat_minor !== "number") {
		notebook.nbformat_minor = DEFAULT_NBFORMAT_MINOR;
	}
};
