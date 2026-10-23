import { post } from "../lib/fetch";
import { url as apiUrl } from "../utility/url";

/**
 * Upload file(s) to the current user's user space
 * @param path
 * @param files
 * @param insightId
 * @returns
 * @deprecated Use `userAssetsUpload` from `@semoss/sdk/api/monolith/upload-file` with object parameters.
 */
export const uploadUser = async (
	path: string,
	files: File | File[],
	insightId: string | null,
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
	>(apiUrl("/api/uploadFile/userAssetsUpload", { insightId, path }), fd, {});
};
