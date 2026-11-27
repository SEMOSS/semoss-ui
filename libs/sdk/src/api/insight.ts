import { Env } from "../env";
import { post } from "../utility";
import { runPixel } from "./base";
import { throwOnPixelErrors } from "./playground-room";

/**
 * Upload file(s) to an insight
 * @param insightId
 * @param path
 * @param files
 * @returns
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
		`${Env.MODULE}/api/uploadFile/baseUpload?insightId=${insightId}&path=${encodeURIComponent(path)}&userSpace=false`,
		fd,
		{},
	);
};

/**
 * Drop an insight (`DropInsight`), such as a closed room's, so the backend
 * stops keeping it.
 *
 * @param insightId - The insight.
 * @throws When the backend reports an error.
 */
export const dropInsight = async (insightId: string): Promise<void> => {
	throwOnPixelErrors(await runPixel("DropInsight()", insightId));
};
