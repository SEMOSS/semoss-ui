import type { JupyterCell } from "../types";
import { isRecordObject } from "./json";

const createCellId = (): string => {
	return `cell-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

export const ensureCellMetadataId = (
	metadata: Record<string, unknown> | undefined,
): Record<string, unknown> => {
	const nextMetadata = { ...(metadata ?? {}) };
	if (typeof nextMetadata.id !== "string" || nextMetadata.id.length === 0) {
		nextMetadata.id = createCellId();
	}

	return nextMetadata;
};

export const getNotebookLanguageFromMetadata = (
	metadata: Record<string, unknown> | undefined,
): string | undefined => {
	if (!metadata) return undefined;
	const languageInfo = metadata.language_info;
	if (!isRecordObject(languageInfo)) return undefined;
	const language = languageInfo.name;
	if (typeof language !== "string" || !language.trim()) return undefined;
	return language.trim().toLowerCase();
};

export const getCellLanguage = (
	cellType: JupyterCell["cell_type"],
	metadata: Record<string, unknown>,
	notebookLanguage?: string,
): string => {
	if (cellType === "markdown") return "markdown";
	if (cellType === "raw") return "raw";

	const metadataLanguage = metadata.language;
	if (typeof metadataLanguage === "string" && metadataLanguage.trim()) {
		return metadataLanguage.trim().toLowerCase();
	}

	return notebookLanguage?.trim()
		? notebookLanguage.trim().toLowerCase()
		: "python";
};

const ensureCellMetadata = (
	cell: JupyterCell,
	notebookLanguage?: string,
): Record<string, unknown> => {
	const metadata = ensureCellMetadataId(cell.metadata);
	return {
		...metadata,
		language: getCellLanguage(cell.cell_type, metadata, notebookLanguage),
	};
};

export const ensureNotebookCellMetadataIds = (
	cells: JupyterCell[],
	notebookLanguage?: string,
): JupyterCell[] => {
	return cells.map((cell) => {
		return {
			...cell,
			metadata: ensureCellMetadata(cell, notebookLanguage),
		};
	});
};
