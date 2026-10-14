import { Env, post, uploadProjectImage } from "@semoss/sdk";

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

/**
 * Upload (or replace) an agent's project image. The server keeps a single image
 * per project, so this overwrites any existing one.
 *
 * @param id - The agent id (its project id). Must be a saved agent.
 * @param file - The image file to store.
 */
export async function uploadAgentImage(id: string, file: File): Promise<void> {
	await uploadProjectImage(id, file);
}

/**
 * Remove an agent's project image using the legacy deletion endpoint.
 *
 * @param id - The agent id (its project id).
 */
export async function deleteAgentImage(id: string): Promise<void> {
	await post(`${Env.MODULE}/api/images/projectImage/delete`, {
		projectId: id,
	});
}
