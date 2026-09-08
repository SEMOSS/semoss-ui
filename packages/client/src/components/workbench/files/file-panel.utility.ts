import type { FileMode } from "@semoss/shared";

interface FilePanelPathParams {
	type: "ENGINE" | "PROJECT" | "INSIGHT";
	id: string;
	path: string;
}

/** Translate workbench resource params into the shared file API's scope. */
export const getFileMode = ({
	type,
	id,
}: {
	type: "ENGINE" | "PROJECT" | "INSIGHT";
	id: string;
}): FileMode => {
	switch (type) {
		case "PROJECT":
			return { type: "APP", app: id };
		case "ENGINE":
			return { type: "ENGINE", engine: id };
		case "INSIGHT":
			return { type: "INSIGHT", insightId: id };
	}
};

/** Build a scoped asset read pixel. */
export const getFileReadPixel = (
	{ type, id, path }: FilePanelPathParams,
	base64 = false,
): string => {
	const operation = base64 ? "AssetsBase64" : "Assets";
	if (type === "PROJECT") {
		return `GetApp${operation}(filePath=[${JSON.stringify(path)}], project=[${JSON.stringify(id)}]);`;
	}
	if (type === "ENGINE") {
		return `GetEngine${operation}(filePath=[${JSON.stringify(path)}], engine=[${JSON.stringify(id)}]);`;
	}
	return `GetInsight${operation}(filePath=[${JSON.stringify(path)}]);`;
};

/** Build a scoped asset save pixel. */
export const getFileSavePixel = (
	{ type, id, path }: FilePanelPathParams,
	content: string,
): string => {
	const encodedContent = `"<encode>${content}</encode>"`;
	if (type === "PROJECT") {
		return `SaveAppAssets(project=[${JSON.stringify(id)}], filePath=[${JSON.stringify(path)}], content=[${encodedContent}]);`;
	}
	if (type === "ENGINE") {
		return `SaveEngineAssets(engine=[${JSON.stringify(id)}], filePath=[${JSON.stringify(path)}], content=[${encodedContent}]);`;
	}
	return `SaveInsightAssets(filePath=[${JSON.stringify(path)}], content=[${encodedContent}]);`;
};

/** Build a scoped asset download pixel. */
export const getFileDownloadPixel = ({
	type,
	id,
	path,
}: FilePanelPathParams): string => {
	if (type === "PROJECT") {
		return `DownloadAppAsset(project=[${JSON.stringify(id)}], filePath=[${JSON.stringify(path)}]);`;
	}
	if (type === "ENGINE") {
		return `DownloadEngineAsset(engine=[${JSON.stringify(id)}], filePath=[${JSON.stringify(path)}]);`;
	}
	return `DownloadInsightAsset(filePath=[${JSON.stringify(path)}]);`;
};
