import { Env } from "../env";
import { getText, post } from "../utility";
import { runPixel } from "./base";
import { type PixelMessages, readPixelMessages } from "./pixel-messages";
import { throwOnPixelErrors } from "./playground-room";

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

/** What {@link getProjectInfo} reads. Field names are the backend's. */
export interface ProjectInfo {
	/** What the app is built with; empty or missing for a plain project. */
	project_type?: "BLOCKS" | "CODE" | "INSIGHT" | "";
	[key: string]: unknown;
}

/**
 * Read an app's details (`ProjectInfo`), such as what it is built with.
 *
 * @param insightId - The insight to run in.
 * @param appId - The app.
 * @returns Its details.
 * @throws When the backend reports an error, as when the user cannot see it.
 */
export const getProjectInfo = async (
	insightId: string,
	appId: string,
): Promise<ProjectInfo> => {
	const { pixelReturn } = throwOnPixelErrors(
		await runPixel<[ProjectInfo]>(
			`ProjectInfo(project=["${appId}"]);`,
			insightId,
		),
	);
	return pixelReturn[0]?.output ?? {};
};

/** What the backend serves at an app's portal when it has none. */
const UNPUBLISHED_PORTAL_TEXT =
	"Publish is not enabled on this project or there was an error publishing this project";

/**
 * Whether an app has a published portal, the page at
 * `public_home/<app>/portals/`. The backend answers 200 either way, so the
 * page's text tells them apart.
 *
 * @param appId - The app.
 * @returns True when the portal is there; false when it is not, or cannot be read.
 */
export const isPortalPublished = async (appId: string): Promise<boolean> => {
	try {
		const { response, data } = await getText(
			`${Env.MODULE}/public_home/${appId}/portals/`,
		);
		return (
			response.status === 200 &&
			Boolean(data) &&
			data !== UNPUBLISHED_PORTAL_TEXT
		);
	} catch {
		return false;
	}
};
