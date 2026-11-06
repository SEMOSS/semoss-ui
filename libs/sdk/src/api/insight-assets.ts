/**
 * The pixels for an insight's own assets — its folder, which is a room's
 * folder once the room is bound to the insight. Each runs against the insight
 * it is sent with. The same strings the shared file explorer's `INSIGHT`
 * adapter builds, so the room engine and the explorer agree.
 */
export const insightAssetPixels = {
	/** List a directory's direct children. */
	browse: (path: string): string =>
		`BrowseInsightAssets(filePath=["${path}"]);`,
	/** Search under a directory; empty searches everything. */
	search: (path: string, term: string): string =>
		`SearchInsightAssets(filePath=["${path}"], search=["${term}"]);`,
	/** Read a file as text, or as base64 for bytes that are not text. */
	read: (path: string, base64 = false): string =>
		`${base64 ? "GetInsightAssetsBase64" : "GetInsightAssets"}(filePath=[${JSON.stringify(path)}]);`,
	/** Overwrite a file, as text or as base64. */
	save: (path: string, content: string, base64 = false): string =>
		`${base64 ? "SaveInsightAssetsBase64" : "SaveInsightAssets"}(filePath=[${JSON.stringify(path)}], content=["<encode>${content}</encode>"]);`,
	/** Make a directory; `path` names it. */
	createDirectory: (path: string): string =>
		`NewInsightAssetsDirectory(filePath=["${path}"]);`,
	/** Move or rename. */
	rename: (oldPath: string, newPath: string): string =>
		`RenameInsightAsset(filePath=["${oldPath}"], newValue=["${newPath}"]);`,
	/**
	 * Delete an entry. Never send it an empty path: with none it clears the
	 * whole space.
	 */
	remove: (path: string): string =>
		`DeleteInsightAssets(filePath=["${path}"]);`,
} as const;
