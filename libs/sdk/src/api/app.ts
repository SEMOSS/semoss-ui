import { Env } from "../env";
import { post } from "../utility";
import { runPixel } from "./base";
import { type PixelMessages, readPixelMessages } from "./pixel-messages";

/**
 * Upload file(s) to an app
 * @param appId
 * @param path
 * @param files
 * @param insightId
 * @returns
 */
export const uploadApp = async (
	appId: string,
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
		`${Env.MODULE}/api/uploadFile/projectAssetsUpload?insightId=${insightId}&projectId=${appId}&path=${encodeURIComponent(path)}`,
		fd,
		{},
	);
};

/**
 * Reload an app's python files (ReloadProject) without restarting any python
 * process: clears the app's modules cached in the app's python process and in
 * the signed in user's, so the next import reads the current .py files. In a
 * cluster every server clears its cached imports. Anyone who can edit the app
 * can reload it.
 *
 * @param appId - The app to reload.
 * @param insightId - Insight to run the pixel against.
 * @returns What the backend reported, such as how many modules were cleared,
 * and a warning when python is off or the other servers could not be told.
 * @throws Error when the backend refuses the reload.
 */
export const reloadApp = async (
	appId: string,
	insightId?: string,
): Promise<PixelMessages> => {
	const response = await runPixel<[unknown]>(
		`ReloadProject(project=${JSON.stringify([appId])});`,
		insightId,
	);

	if (response.errors.length > 0) {
		throw new Error(response.errors.join(""));
	}

	return readPixelMessages(response.pixelReturn[0]);
};
