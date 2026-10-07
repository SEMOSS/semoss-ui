export type RefreshKeys = Record<string, number>;

export function refreshKey(keys: RefreshKeys, key: string): RefreshKeys {
	return { ...keys, [key]: (keys[key] ?? 0) + 1 };
}
