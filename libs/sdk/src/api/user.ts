import { Env } from "../env";
import { post } from "../utility";

/**
 * Upload file(s) to the current user's user space
 * @param path
 * @param files
 * @param insightId
 * @returns
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
	>(
		`${Env.MODULE}/api/uploadFile/userAssetsUpload?insightId=${insightId}&path=${encodeURIComponent(path)}`,
		fd,
		{},
	);
};
