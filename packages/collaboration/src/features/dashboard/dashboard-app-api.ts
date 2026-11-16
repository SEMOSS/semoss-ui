import { Env } from "@semoss/sdk/react";

/** Use SEMOSS's published portal route, never a user-supplied embedding URL. */
export function appPortalPath(appId: string): string {
	return `${Env.MODULE}/public_home/${encodeURIComponent(appId)}/portals/`;
}
