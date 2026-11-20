import { Env } from "../env";
import { post } from "../utility";
import { runPixel } from "./base";
import { throwOnPixelErrors } from "./playground-room";

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

/**
 * Download a file by using a unique key
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

/**
 * Read a file in the signed in user's own assets as text (`GetUserAssets`).
 *
 * @param filePath - The file, from the top of the user's assets.
 * @param insightId - The insight to run in; without one the backend makes one.
 * @returns The file's text, as the backend returns it.
 * @throws When the backend reports an error, as when the file is not there.
 */
export const readUserAsset = async (
	filePath: string,
	insightId?: string,
): Promise<unknown> => {
	const { pixelReturn } = throwOnPixelErrors(
		await runPixel<[unknown]>(
			`GetUserAssets(filePath=[${JSON.stringify(filePath)}]);`,
			insightId,
		),
	);
	return pixelReturn[0]?.output;
};

/** The file formats {@link exportMarkdownDocument} makes. */
export type MarkdownDocumentFormat = "word" | "pdf";

/** What {@link exportMarkdownDocument} made. */
export interface MarkdownDocumentExport {
	/** The insight the file belongs to; download it from there. */
	insightId: string;
	/** The key to {@link download} the file with, or null when none was made. */
	fileKey: string | null;
	/**
	 * The kinds of output the backend reported, such as `FILE_DOWNLOAD`, or
	 * null when it returned nothing at all.
	 */
	operationType: string[] | null;
}

/**
 * Turn markdown into a Word document (`ToDocx`) or a PDF (`ToPdf`) to download.
 *
 * @param insightId - The insight to make the file in, or "new" for a new one.
 * @param markdown - The document's text.
 * @param fileName - The file's name, without its extension.
 * @param format - The file's format.
 * @returns Where the file is, or a null key with what the backend reported
 * when it made none.
 * @throws When the backend reports an error.
 */
export const exportMarkdownDocument = async (
	insightId: string,
	markdown: string,
	fileName: string,
	format: MarkdownDocumentFormat,
): Promise<MarkdownDocumentExport> => {
	const reactor = format === "word" ? "ToDocx" : "ToPdf";
	const response = throwOnPixelErrors(
		await runPixel<[string]>(
			`${reactor}(markdown=["<encode>${markdown}</encode>"], fileName="${fileName}");`,
			insightId,
		),
	);
	const statement = response.pixelReturn[0];
	if (!statement) {
		return {
			insightId: response.insightId,
			fileKey: null,
			operationType: null,
		};
	}
	const operationType = statement.operationType ?? [];
	return {
		insightId: response.insightId,
		fileKey:
			operationType.includes("FILE_DOWNLOAD") &&
			typeof statement.output === "string"
				? statement.output
				: null,
		operationType: operationType,
	};
};
