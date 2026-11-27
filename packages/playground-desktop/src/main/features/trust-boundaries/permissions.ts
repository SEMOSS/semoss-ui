import type { Session, WebContents } from "electron";
import { isAppPage, originOf } from "./zones";

/**
 * Boundary: every page → the machine's features (camera, microphone,
 * location, clipboard, devices, other apps).
 * Enforces: only the app page, in the app's own window, gets the few
 * permissions it uses; everything else is denied without asking. A browser
 * would prompt; Electron grants by default, so without this a tool view or a
 * sign in page would get more on the desktop than on the web.
 * Exceptions: none.
 */

/**
 * What the app page may use: paste and copy in the editors, the microphone
 * for dictation, and full screen for media.
 */
const APP_PAGE_PERMISSIONS: ReadonlySet<string> = new Set([
	"clipboard-read",
	"clipboard-sanitized-write",
	"media",
	"fullscreen",
]);

/** One permission request, as the policy reads it. */
export interface PermissionAsk {
	/** The permission, as Electron names it. */
	readonly permission: string;
	/** The URL of the frame that asks. */
	readonly requestingUrl: string;
	/** Whether that frame is its window's top frame. */
	readonly isMainFrame: boolean;
	/** Whether it asks from the app's own window. */
	readonly isAppWindow: boolean;
	/** For `media`, what it wants; anything but audio is refused. */
	readonly mediaTypes?: readonly string[];
}

/**
 * Whether a permission is granted: only to the app page, in its window's top
 * frame, and only the app page's own few. The microphone only, never the
 * camera.
 *
 * @param ask - The request.
 * @param appOrigin - The app's origin.
 * @returns True to grant it.
 */
export const isPermissionAllowed = (
	{
		permission,
		requestingUrl,
		isMainFrame,
		isAppWindow,
		mediaTypes,
	}: PermissionAsk,
	appOrigin: string,
): boolean => {
	if (!isAppWindow || !isMainFrame || !isAppPage(requestingUrl, appOrigin)) {
		return false;
	}
	if (!APP_PAGE_PERMISSIONS.has(permission)) return false;
	if (permission === "media") {
		return (
			!!mediaTypes &&
			mediaTypes.length > 0 &&
			mediaTypes.every((type) => type === "audio")
		);
	}
	return true;
};

/**
 * Lock a session's permissions to {@link isPermissionAllowed}, and refuse
 * every USB, HID and serial device.
 *
 * @param session - A server's session, or the default one.
 * @param appOrigin - The app's origin.
 * @param getAppWebContents - The app's window's contents, while it is open.
 */
export const lockPermissions = (
	session: Session,
	appOrigin: string,
	getAppWebContents: () => WebContents | undefined,
): void => {
	const isAppWindow = (contents: WebContents | null): boolean =>
		!!contents && contents === getAppWebContents();

	session.setPermissionRequestHandler(
		(contents, permission, callback, details) => {
			callback(
				isPermissionAllowed(
					{
						permission,
						requestingUrl: details.requestingUrl,
						isMainFrame: details.isMainFrame,
						isAppWindow: isAppWindow(contents),
						mediaTypes:
							"mediaTypes" in details
								? details.mediaTypes
								: undefined,
					},
					appOrigin,
				),
			);
		},
	);
	session.setPermissionCheckHandler(
		(contents, permission, requestingOrigin, details) =>
			isPermissionAllowed(
				{
					permission,
					// a check names an origin; the app page is the only page there
					requestingUrl:
						details.requestingUrl ??
						(originOf(requestingOrigin) === appOrigin
							? `${appOrigin}/`
							: requestingOrigin),
					isMainFrame: details.isMainFrame,
					isAppWindow: isAppWindow(contents),
					mediaTypes: details.mediaType
						? [details.mediaType]
						: undefined,
				},
				appOrigin,
			),
	);
	session.setDevicePermissionHandler(() => false);
};
