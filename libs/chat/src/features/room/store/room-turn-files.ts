import { uploadInsight } from "@semoss/sdk/react";
import type { PixelMessageMediaPart } from "../../../types";

/** A file a turn sends, by where it is in the room's insight. */
export interface TurnFile {
	/** The file's name. */
	fileName: string;
	/** Where it is in the room's insight. */
	fileLocation: string;
}

/**
 * The error a caller shows as "file is in use": a file the browser or the
 * server could not read, most likely locked by another program (a .docx open
 * in Word).
 *
 * @returns The error, named `UploadError`.
 */
export const createUploadError = (): Error => {
	const error = new Error("File is in use");
	error.name = "UploadError";
	return error;
};

/**
 * Upload a turn's files to the room's insight.
 *
 * @param insightId - The room's insight.
 * @param files - The files; none uploads nothing.
 * @returns Where each file landed.
 * @throws An `UploadError` when files were sent but the server read none.
 */
export const uploadTurnFiles = async (
	insightId: string,
	files: readonly File[],
): Promise<TurnFile[]> => {
	if (files.length === 0) {
		return [];
	}
	const { data } = await uploadInsight(insightId, "", [...files]);
	if (data.length === 0) {
		throw createUploadError();
	}
	return data;
};

/**
 * Whether a file goes to the model with the message. The host may limit this
 * to some extensions, compared without case, spaces, or a leading dot.
 *
 * @param fileName - The file's name.
 * @param allowedFileTypes - The host's extensions; none allows every file.
 * @returns True when the file is sent to the model.
 */
export const isAttachedToModel = (
	fileName: string,
	allowedFileTypes: readonly string[] | undefined,
): boolean => {
	if (!allowedFileTypes || allowedFileTypes.length === 0) {
		return true;
	}
	const normalize = (value: string) =>
		value.trim().toLowerCase().replace(/^\./, "");
	const extension = normalize(fileName.split(".").pop() ?? "");
	return (
		extension !== "" &&
		allowedFileTypes.some((type) => normalize(type) === extension)
	);
};

/**
 * The media parts a user's message carries for its files. Files the model is
 * not sent stay in the room for tools.
 *
 * @param files - The turn's files.
 * @param isSent - Whether a file goes to the model.
 * @returns One part per file sent.
 */
export const toMediaParts = (
	files: readonly TurnFile[],
	isSent: (fileName: string) => boolean,
): PixelMessageMediaPart[] =>
	files
		.filter((file) => isSent(file.fileName))
		.map((file) => ({
			type: "MEDIA",
			mediaInfo: {
				base64Data: "",
				fileFormat: "",
				fileName: file.fileName,
				fileLocation: file.fileLocation,
				mediaInputType: "FILE",
				mimeType: "",
			},
		}));
