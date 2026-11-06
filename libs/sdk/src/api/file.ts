import { Env } from "../env";
import { post } from "../utility";

/**
 * Upload file(s) to the backend
 * @param files
 * @param insightId
 * @param projectId
 * @param path
 * @returns
 */
export const upload = async (
	files: File | File[],
	insightId: string | null,
	projectId: string | null,
	path: string,
): Promise<
	{
		fileName: string;
		fileLocation: string;
	}[]
> => {
	let param = "";

	path = path || "";
	if (insightId || projectId || path) {
		if (insightId) {
			if (param.length > 0) {
				param += "&";
			}
			param += `insightId=${insightId}`;
		}

		if (projectId) {
			if (param.length > 0) {
				param += "&";
			}
			param += `projectId=${projectId}`;
		}

		if (path) {
			if (param.length > 0) {
				param += "&";
			}
			param += `path=${path}`;
		}

		param = `?${param}`;
	}

	const url = `${Env.MODULE}/api/uploadFile/baseUpload${param}`;

	const fd: FormData = new FormData();
	if (Array.isArray(files)) {
		for (let i = 0; i < files.length; i++) {
			fd.append("file", files[i]);
		}
	} else {
		// pasted data
		fd.append("file", files);
	}

	const response = await post<
		{
			fileName: string;
			fileLocation: string;
		}[]
	>(url, fd, {});

	return response.data;
};

/** A file the backend has ready to download, as {@link download} hands it on. */
export interface DownloadRequest {
	/** The file's download address, under `Env.MODULE`. */
	url: string;
	/** The insight the file was exported in. */
	insightId: string;
	/** The file's key in that insight. */
	fileKey: string;
}

/**
 * Saves a file the backend has ready, such as through a desktop app's save
 * dialog. Rejects when the file could not be saved.
 */
export type DownloadHandler = (request: DownloadRequest) => Promise<void>;

let downloadHandler: DownloadHandler | null = null;

/**
 * Choose how {@link download} saves files, such as a desktop app's native
 * save dialog in place of a browser link, which a webview cannot follow
 * across origins.
 *
 * @param handler - The handler, or null to go back to the browser link.
 */
export const setDownloadHandler = (handler: DownloadHandler | null): void => {
	downloadHandler = handler;
};

/**
 * Download a file by using a unique key. In a browser it follows a link to
 * the file, unless a host chose its own handler ({@link setDownloadHandler});
 * elsewhere it resolves with the file's bytes.
 *
 * @param insightId - insightId to download the file
 * @param fileKey - id for the file to download
 */
export const download = async (insightId: string, fileKey: string) => {
	if (!insightId) {
		throw Error("No Insight ID provided for download.");
	}

	// create the download url
	const url = `${
		Env.MODULE
	}/api/engine/downloadFile?insightId=${insightId}&fileKey=${encodeURIComponent(
		fileKey,
	)}`;

	if (downloadHandler) {
		return downloadHandler({
			url: url,
			insightId: insightId,
			fileKey: fileKey,
		});
	}

	// only works in browser
	if (typeof window !== "undefined" && typeof document !== "undefined") {
		return new Promise<void>((resolve) => {
			// fake clicking a link
			const link: HTMLAnchorElement = document.createElement("a");

			link.href = url;
			link.target = "_blank";
			document.body.appendChild(link);
			link.click();

			document.body.removeChild(link);

			// resolve the promise
			resolve();
		});
	} else {
		const response = await fetch(url);
		if (!response.ok) {
			const errorData = await response.json();
			const errorMessage =
				errorData.message ||
				errorData.error ||
				`Request failed with status ${response.status}`;
			throw new Error(errorMessage);
		}

		// Get the response as an ArrayBuffer
		const arrayBuffer = await response.arrayBuffer();

		return arrayBuffer;
	}
};
