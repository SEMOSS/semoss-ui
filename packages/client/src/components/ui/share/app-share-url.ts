import { resolvePath } from "react-router";

/**
 * The link that opens an app's shared view in this client (`#/s/:appId`),
 * built from the page the client is served from.
 *
 * @param appId - The app to share.
 * @returns The absolute link.
 */
export const getAppShareUrl = (appId: string): string => {
	const base = window.location.href.replace(window.location.hash, "#");
	return resolvePath(`./s/${appId}`, base).pathname;
};
