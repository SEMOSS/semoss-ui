import { Env, post } from "@semoss/sdk/react";

/**
 * Saves new SMSS content for an engine, which opens again with it.
 *
 * @param databaseId - The engine's id.
 * @param smssProps - The new content of the SMSS file.
 * @param admin - Whether to save in admin mode, where an admin can update any
 * engine; outside it the user must own the engine.
 * @returns The response, whose `success` says the save went through.
 */
export const updateDatabaseSmssProperties = async (
	databaseId: string,
	smssProps: string,
	admin = false,
) => {
	return await post<{
		success: boolean;
	}>(
		admin
			? `${Env.MODULE}/api/auth/admin/engine/updateSmssFile`
			: `${Env.MODULE}/api/e-${databaseId}/updateSmssFile`,
		{
			smss: smssProps,
			engineId: databaseId,
		},
		{},
	);
};
