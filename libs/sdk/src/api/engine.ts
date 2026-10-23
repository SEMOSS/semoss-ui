import { post } from "../lib/fetch";
import { url as apiUrl } from "../utility/url";

/**
 * Upload file(s) to an engine
 * @param engineId
 * @param path
 * @param files
 * @param insightId
 * @returns
 *
 * @deprecated Use `engineAssetsUpload({ file: files, insightId, engineId, path })` from
 * `@semoss/sdk/api/monolith/upload-file`. Supply a non-null active insightId. The route
 * returns upload records directly, not { response, data }.
 */
export const uploadEngine = async (
	engineId: string,
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
		apiUrl("/api/uploadFile/engineAssetsUpload", {
			insightId,
			engineId,
			path,
		}),
		fd,
		{},
	);
};
