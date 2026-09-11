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

/** Decode a base64 asset payload (e.g. from a Get*AssetsBase64 pixel) into raw bytes. */
export const decodeBase64Asset = (data: string): Uint8Array | null => {
	if (!data) return null;
	try {
		const binary = atob(data.replace(/\s/g, ""));
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	} catch (error) {
		console.error("Failed to decode asset bytes", error);
		return null;
	}
};

/** Encode raw bytes as base64 (e.g. for a Save*AssetsBase64 pixel), chunked so
 * large files don't overflow the argument limit of String.fromCharCode. */
export const encodeBase64Asset = (bytes: Uint8Array): string => {
	const CHUNK = 0x8000;
	let binary = "";
	for (let i = 0; i < bytes.length; i += CHUNK) {
		binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
	}
	return btoa(binary);
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
