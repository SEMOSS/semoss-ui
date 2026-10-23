import { post } from "../lib/fetch";
import { sendRequest } from "../utility/request";
import { url as apiUrl } from "../utility/url";

/**
 * Upload file(s) to the backend
 * @param files
 * @param insightId
 * @param projectId
 * @param path
 * @returns
 * @deprecated Use `baseUpload` from `@semoss/sdk/api/monolith/upload-file` with object parameters.
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
	const url = apiUrl("/api/uploadFile/baseUpload", {
		insightId: insightId || undefined,
		projectId: projectId || undefined,
		path: path || undefined,
	});

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
	const url = apiUrl("/api/engine/downloadFile", { insightId, fileKey });

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
		const response = await sendRequest(url, { method: "GET" });
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
