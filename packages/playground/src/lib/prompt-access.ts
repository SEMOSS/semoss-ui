type MetaMap = Record<string, string[]>;

type PromptLike = {
	CREATED_BY?: string;
	GLOBAL?: boolean;
	metaKeys?: MetaMap;
};

type UserLike = {
	userId: string;
	metaMap: MetaMap;
};

const hasNoRequirements = (metaMap?: MetaMap): boolean => {
	if (!metaMap) return true;
	const keys = Object.keys(metaMap);
	if (keys.length === 0) return true;
	return keys.every((k) => (metaMap[k] ?? []).length === 0);
};

const matchesMetaMap = (required: MetaMap, user: MetaMap): boolean => {
	for (const key of Object.keys(required)) {
		const reqVals = required[key] ?? [];
		if (reqVals.length === 0) continue;
		const userVals = new Set(user[key] ?? []);
		if (!reqVals.some((v) => userVals.has(v))) return false;
	}
	return true;
};

export const canViewPrompt = (user: UserLike, prompt: PromptLike): boolean => {
	if (prompt.CREATED_BY && prompt.CREATED_BY === user.userId) return true;
	if (!prompt.GLOBAL) return false;

	const required = prompt.metaKeys ?? {};
	if (hasNoRequirements(required)) return true;

	return matchesMetaMap(required, user.metaMap);
};
