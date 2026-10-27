import { post } from "../lib/fetch";
import { url as apiUrl } from "../utility/url";

/**
 * Upload file(s) to an insight
 * @param insightId
 * @param path
 * @param files
 * @returns
 *
 */
export const uploadInsight = async (
	insightId: string | null,
	path: string,
	files: File | File[],
) => {
	const fd: FormData = new FormData();
	if (Array.isArray(files)) {
		for (let i = 0; i < files.length; i++) {
			fd.append("file", files[i]);
		}
	} else {
		// pasted data
		fd.append("file", files);
	}

	return await post<
		{
			fileName: string;
			fileLocation: string;
		}[]
	>(
		apiUrl("/api/uploadFile/baseUpload", {
			insightId,
			path,
			userSpace: false,
		}),
		fd,
		{},
	);
};
