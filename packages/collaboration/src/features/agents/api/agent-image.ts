import { Env } from "@semoss/sdk";

/**
 * Direct URL to an agent's project image.
 *
 * The server may supply a default image when no custom image exists. The
 * avatar component falls back to a derived icon when the request fails.
 *
 * @param id - The agent id (its project id).
 */
export function agentImageUrl(id: string): string {
	return `${Env.MODULE}/api/project-${encodeURIComponent(id)}/projectImage/download?fallback=false`;
}
