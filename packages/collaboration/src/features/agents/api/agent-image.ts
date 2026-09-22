import { Env, post } from "@semoss/sdk";

/**
 * Agents are backed by SEMOSS WORKSPACE projects, so an agent's picture is just
 * its project image, served and stored by the Monolith exactly like any other
 * project icon (`ProjectResource.downloadProjectImage` /
 * `ImageUploader.uploadProjectImage`). These helpers build the same URLs the
 * SDK uses, `${Env.MODULE}/api/...`, and go through the SDK's `post` so the
 * shared auth/CSRF interceptor applies.
 */

/**
 * Direct URL to an agent's project image.
 *
 * `fallback=false` makes the endpoint return 404 when the agent has no custom
 * image, rather than a random default. That pairs with `AgentAvatar`, which
 * renders the agent's derived icon when the `<img>` errors.
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
	const form = new FormData();
	form.append("file", file);
	form.append("projectId", id);
	await post(`${Env.MODULE}/api/images/projectImage/upload`, form);
}

/**
 * Remove an agent's project image, so its avatar falls back to the derived icon.
 *
 * @param id - The agent id (its project id).
 */
export async function deleteAgentImage(id: string): Promise<void> {
	const form = new FormData();
	form.append("projectId", id);
	await post(`${Env.MODULE}/api/images/projectImage/delete`, form);
}
