import {
	FileArchiveIcon,
	FileAudioIcon,
	FileBadgeIcon,
	FileChartPieIcon,
	FileCodeIcon,
	FileIcon,
	FileJsonIcon,
	FileSpreadsheetIcon,
	FileTerminalIcon,
	FileTextIcon,
	FileTypeIcon,
	FileVideoIcon,
} from "lucide-react";
import { getFileExtension } from "@semoss/utility/file";
import { getImageMimeType } from "@semoss/utility/image";
import type { PixelMessageMediaPart } from "../../../types";

/**
 * The icon for an attachment that shows no preview, picked by its extension.
 *
 * @param fileName - The attachment's name.
 * @returns The icon component and the extension it was picked by.
 */
export const getAttachmentIcon = (fileName: string) => {
	const ext = getFileExtension(fileName);
	if (["xls", "xlsx", "csv"].includes(ext))
		return { Icon: FileSpreadsheetIcon, ext };
	if (
		[
			"py",
			"js",
			"ts",
			"tsx",
			"jsx",
			"java",
			"cpp",
			"c",
			"go",
			"rs",
		].includes(ext)
	)
		return { Icon: FileCodeIcon, ext };
	if (["sh", "bash", "zsh", "bat", "ps1"].includes(ext))
		return { Icon: FileTerminalIcon, ext };
	if (ext === "json") return { Icon: FileJsonIcon, ext };
	if (["zip", "tar", "gz", "rar", "7z"].includes(ext))
		return { Icon: FileArchiveIcon, ext };
	if (["ppt", "pptx"].includes(ext)) return { Icon: FileChartPieIcon, ext };
	if (["mp3", "wav", "ogg", "flac", "aac"].includes(ext))
		return { Icon: FileAudioIcon, ext };
	if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext))
		return { Icon: FileVideoIcon, ext };
	if (["html", "xml", "md", "mdx", "rtf"].includes(ext))
		return { Icon: FileTypeIcon, ext };
	if (ext === "pdf") return { Icon: FileBadgeIcon, ext };
	if (["doc", "docx", "msg", "txt"].includes(ext))
		return { Icon: FileTextIcon, ext };
	return { Icon: FileIcon, ext };
};

/** What a message knows of an attached file. */
type AttachmentMediaInfo = PixelMessageMediaPart["mediaInfo"];

/** Extensions shown as images when a file names no image MIME type. */
const IMAGE_EXTENSIONS = new Set([
	"png",
	"jpg",
	"jpeg",
	"gif",
	"webp",
	"svg",
	"bmp",
	"img",
]);

/**
 * The image MIME type an attachment shows with: its own when that is an
 * image's, else the one its extension names.
 *
 * @param mediaInfo - The attachment.
 * @returns The MIME type, or null when the attachment is no image.
 */
export const getAttachmentImageMimeType = (
	mediaInfo: AttachmentMediaInfo,
): string | null => {
	if (mediaInfo.mimeType?.startsWith("image/")) return mediaInfo.mimeType;
	const ext = getFileExtension(mediaInfo.fileName);
	return IMAGE_EXTENSIONS.has(ext) ? getImageMimeType(ext) : null;
};

/** An inline attachment opened in {@link AttachmentPreviewDialog}. */
export type AttachmentPreview =
	| {
			kind: "image";
			fileName: string;
			/** The image's data URI. */
			src: string;
	  }
	| {
			kind: "pdf";
			fileName: string;
			/** The document's data URI. */
			src: string;
	  };

/**
 * How an attachment sent inline previews: as an image when it is one, else
 * as a PDF.
 *
 * @param mediaInfo - The attachment.
 * @returns The preview, or null when the attachment carries no bytes.
 */
export const readAttachmentPreview = (
	mediaInfo: AttachmentMediaInfo,
): AttachmentPreview | null => {
	if (!mediaInfo.base64Data) return null;
	const imageMimeType = getAttachmentImageMimeType(mediaInfo);
	return imageMimeType
		? {
				kind: "image",
				fileName: mediaInfo.fileName,
				src: `data:${imageMimeType};base64,${mediaInfo.base64Data}`,
			}
		: {
				kind: "pdf",
				fileName: mediaInfo.fileName,
				src: `data:application/pdf;base64,${mediaInfo.base64Data}`,
			};
};
