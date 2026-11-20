import { useEffect, useState } from "react";
import { isPortalPublished } from "@semoss/sdk";

/** What {@link usePortalPublished} keeps: the last answer, and whose it is. */
interface PortalPublishedState {
	/** The app the answer is for. */
	readonly appId: string;
	/** Whether its portal is published. */
	readonly isPublished: boolean;
}

/**
 * Whether an app's portal page is published, asked with the SDK's
 * `isPortalPublished`. An answer that lands after the app changed is dropped.
 *
 * @param appId - The app, or null when there is nothing to ask.
 * @returns The answer for `appId`, or undefined while it is being asked (and
 * when there is no app).
 */
export const usePortalPublished = (
	appId: string | null,
): boolean | undefined => {
	const [state, setState] = useState<PortalPublishedState | null>(null);

	useEffect(() => {
		if (!appId) {
			return;
		}
		let isCurrent = true;
		isPortalPublished(appId).then((isPublished) => {
			if (isCurrent) {
				setState({ appId: appId, isPublished: isPublished });
			}
		});
		return () => {
			isCurrent = false;
		};
	}, [appId]);

	return appId && state?.appId === appId ? state.isPublished : undefined;
};
