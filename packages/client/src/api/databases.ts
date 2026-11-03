import { Env, post } from "@semoss/sdk/react";

export const updateDatabaseSmssProperties = async (
	databaseId: string,
	smssProps: string,
) => {
	return await post<{
		success: boolean;
	}>(
		`${Env.MODULE}/api/e-${databaseId}/updateSmssFile`,
		{
			smss: smssProps,
			engineId: databaseId,
		},
		{},
	);
};
