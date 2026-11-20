import { useEffect, useState } from "react";
import { getEngineAsset, getEngineAssetBase64 } from "@semoss/sdk";
import { useSessionInsight } from "@semoss/sdk/react";
import { decodeBase64ToBytes } from "@semoss/utility/encoding";
import { getFileExtension } from "@semoss/utility/file";
import { getImageMimeType } from "@semoss/utility/image";

/** How a document previews: in a PDF frame, as an image, or as text. */
export type DocumentPreviewKind = "pdf" | "image" | "text";

/** The extensions of each kind of preview. Word files preview as PDFs. */
const PREVIEW_EXTENSIONS: Record<DocumentPreviewKind, readonly string[]> = {
	pdf: ["pdf", "doc", "docx"],
	image: ["png", "jpg", "jpeg", "gif", "webp", "svg"],
	text: ["txt", "md", "csv", "log", "json", "xml", "yaml", "yml"],
};

/**
 * How a document previews, by its extension.
 *
 * @param fileName - The document's file name.
 * @returns Its kind of preview, or null when it has none.
 */
export const getDocumentPreviewKind = (
	fileName: string,
): DocumentPreviewKind | null => {
	const extension = getFileExtension(fileName);
	for (const kind of ["pdf", "image", "text"] as const) {
		if (PREVIEW_EXTENSIONS[kind].includes(extension)) return kind;
	}
	return null;
};

/** What {@link useDocumentPreview} returns. */
export interface DocumentPreview {
	/** How the document previews, or null when it has no preview. */
	kind: DocumentPreviewKind | null;
	/** A blob URL of a PDF or image document, once it loads. */
	blobUrl: string | null;
	/** A text document's content, once it loads. */
	text: string | null;
	/** Whether the document is loading. */
	isLoading: boolean;
	/** Whether the document failed to load. */
	hasError: boolean;
}

/** No document, or one with nothing loaded yet. */
const EMPTY = { blobUrl: null, text: null, isLoading: false, hasError: false };

/**
 * Loads a knowledge source's document for its preview, in the session's
 * insight: text as text, anything else as a blob URL, which is revoked when
 * the document changes or the preview closes.
 *
 * @param engineId - The knowledge source.
 * @param fileName - The document to preview, or null when none is open.
 * @returns The preview's kind, its content, and where loading stands.
 */
export const useDocumentPreview = (
	engineId: string,
	fileName: string | null,
): DocumentPreview => {
	const { withInsight } = useSessionInsight();
	const [state, setState] = useState<Omit<DocumentPreview, "kind">>(EMPTY);
	const kind = fileName ? getDocumentPreviewKind(fileName) : null;

	useEffect(() => {
		if (!fileName || !kind) {
			setState(EMPTY);
			return;
		}
		let isCancelled = false;
		let createdBlobUrl: string | null = null;
		setState({ ...EMPTY, isLoading: true });

		const filePath = `/schema/default/documents/${fileName}`;
		const load = async (): Promise<Omit<DocumentPreview, "kind">> => {
			if (kind === "text") {
				const text = await withInsight((insightId) =>
					getEngineAsset(insightId, engineId, filePath),
				);
				return { ...EMPTY, text: text };
			}
			const base64 = await withInsight((insightId) =>
				getEngineAssetBase64(insightId, engineId, filePath),
			);
			// a preview closed meanwhile makes no URL to revoke
			if (isCancelled) return EMPTY;
			const type =
				kind === "image"
					? getImageMimeType(getFileExtension(fileName))
					: "application/pdf";
			const blob = new Blob([decodeBase64ToBytes(base64)], {
				type: type,
			});
			createdBlobUrl = URL.createObjectURL(blob);
			return { ...EMPTY, blobUrl: createdBlobUrl };
		};

		load()
			.then((next) => {
				if (!isCancelled) setState(next);
			})
			.catch(() => {
				if (!isCancelled) setState({ ...EMPTY, hasError: true });
			});

		return () => {
			isCancelled = true;
			if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
		};
	}, [engineId, fileName, kind, withInsight]);

	return { kind: kind, ...state };
};
