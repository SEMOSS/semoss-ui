import { Env } from "../env";
import { post } from "../utility/fetch";

/** Maximum encoded file size accepted by catalog image upload endpoints. */
export const CATALOG_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

/** File-picker formats supported by catalog image upload endpoints. */
export const CATALOG_IMAGE_ACCEPT = "image/png,image/jpeg,image/gif";

/** Successful replacement of an engine or project catalog image. */
export interface CatalogImageUploadResult {
	/** Server confirmation of the upload. */
	message: string;
	/** Canonical engine or project ID. */
	id: string;
	/** Resource display name. */
	name: string;
	/** Download path relative to the backend origin. */
	imageUrl: string;
	/** Format detected by the server from the image bytes. */
	contentType: "image/png" | "image/jpeg" | "image/gif";
}

/**
 * Check file-picker metadata before uploading. The server additionally validates
 * the actual bytes and limits decoded images to 25 million pixels.
 */
export function getCatalogImageValidationError(file: File): string | null {
	if (file.size === 0) return "Choose an image that is not empty.";
	if (file.size > CATALOG_IMAGE_MAX_BYTES) {
		return "Choose an image no larger than 10 MiB.";
	}
	const hasSupportedFormat = file.type
		? CATALOG_IMAGE_ACCEPT.split(",").includes(file.type.toLowerCase())
		: /\.(png|jpe?g|gif)$/i.test(file.name);
	return hasSupportedFormat ? null : "Choose a PNG, JPEG, or GIF image.";
}

/** Validate the upload response instead of treating any successful HTTP reply as a saved image. */
function isUploadResult(data: unknown): data is CatalogImageUploadResult {
	return (
		typeof data === "object" &&
		data !== null &&
		"message" in data &&
		typeof data.message === "string" &&
		"id" in data &&
		typeof data.id === "string" &&
		"name" in data &&
		typeof data.name === "string" &&
		"imageUrl" in data &&
		typeof data.imageUrl === "string" &&
		data.imageUrl.length > 0 &&
		"contentType" in data &&
		(data.contentType === "image/png" ||
			data.contentType === "image/jpeg" ||
			data.contentType === "image/gif")
	);
}

/** Send a single file through the SDK transport, including its authentication and CSRF handling. */
async function uploadCatalogImage(
	resource: "e" | "project",
	id: string,
	file: File,
): Promise<CatalogImageUploadResult> {
	if (!id.trim())
		throw new Error("A saved resource ID is required to upload an image.");
	const validationError = getCatalogImageValidationError(file);
	if (validationError) throw new Error(validationError);

	const form = new FormData();
	form.append("file", file);
	const { data } = await post<unknown>(
		`${Env.MODULE}/api/${resource}-${encodeURIComponent(id)}/image/upload`,
		form,
	);
	if (!isUploadResult(data) || data.id !== id) {
		throw new Error(
			"The server did not confirm the image upload. Please try again.",
		);
	}
	return data;
}

/** Replace an engine's image. Requires a saved engine ID and edit permission. */
export function uploadEngineImage(
	engineId: string,
	file: File,
): Promise<CatalogImageUploadResult> {
	return uploadCatalogImage("e", engineId, file);
}

/**
 * Replace a project's image, including agent workspaces, skills, notebooks, and
 * apps. Create the project first, then pass its server-assigned ID.
 */
export function uploadProjectImage(
	projectId: string,
	file: File,
): Promise<CatalogImageUploadResult> {
	return uploadCatalogImage("project", projectId, file);
}
