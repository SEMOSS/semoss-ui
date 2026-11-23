import { Env, post } from "@semoss/sdk/react";

/**
 * Saves new SMSS content for an engine, which opens again with it.
 *
 * @param databaseId - The engine's id.
 * @param smssProps - The new content of the SMSS file.
 * @param smssHash - The hash the SMSS was read with. The save is refused with
 * a 409 and the error code `SMSS_CHANGED` when the SMSS changed since.
 * @param admin - Whether to save in admin mode, where an admin can update any
 * engine; outside it the user must own the engine.
 * @returns The response, whose `success` says the save went through and whose
 * `smssHash` is the hash of the SMSS as saved.
 */
export const updateDatabaseSmssProperties = async (
	databaseId: string,
	smssProps: string,
	smssHash: string,
	admin = false,
) => {
	return await post<{
		success: boolean;
		smssHash?: string;
	}>(
		admin
			? `${Env.MODULE}/api/auth/admin/engine/updateSmssFile`
			: `${Env.MODULE}/api/e-${databaseId}/updateSmssFile`,
		{
			smss: smssProps,
			smssHash,
			engineId: databaseId,
		},
		{},
	);
};
