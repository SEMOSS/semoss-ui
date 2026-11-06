import type { DownloadHandler } from "@semoss/sdk";
import { encodeBytesToBase64 } from "@semoss/utility/encoding";
import { invokeCommand } from "./tauri";

/**
 * The file name a download's response names, or its key's last part.
 *
 * @param disposition - The `Content-Disposition` header, if any.
 * @param fileKey - The file's key.
 * @returns The name to offer in the save dialog.
 */
export const getDownloadFileName = (
	disposition: string | null,
	fileKey: string,
): string => {
	const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
	if (encoded) {
		try {
			return decodeURIComponent(encoded);
		} catch {
			// a malformed name falls through to the plain one
		}
	}
	const plain = disposition?.match(/filename="?([^";]+)"?/i)?.[1];
	return plain ?? fileKey.split(/[\\/]/).pop() ?? fileKey;
};

/**
 * Saves the SDK's downloads (`setDownloadHandler`) through the native save
 * dialog: the file is read through the bridge, and the Rust side asks where
 * to save it and writes it there, so the page never picks a path. Closing the
 * dialog saves nothing and is not an error.
 *
 * @param request - The file the backend has ready.
 */
export const saveDownloadWithDialog: DownloadHandler = async ({
	url,
	fileKey,
}) => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`The download failed (${response.status}).`);
	}
	const bytes = new Uint8Array(await response.arrayBuffer());
	await invokeCommand<boolean>("save_file_with_dialog", {
		defaultName: getDownloadFileName(
			response.headers.get("content-disposition"),
			fileKey,
		),
		dataBase64: encodeBytesToBase64(bytes),
	});
};
