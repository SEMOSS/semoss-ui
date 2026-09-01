import { runPixel } from "@semoss/sdk/react";
import { z } from "@semoss/ui/next";
import { uploadFile } from "@/api";

/** Catalog names may only contain alphanumerics, dashes, and spaces. */
export const CATALOG_NAME_PATTERN = /^[\w\-\s]+$/;

/** Shared zod schema for every connector's "Catalog Name" field. */
export const catalogNameSchema = z
	.string()
	.min(1, "Catalog name is required")
	.regex(
		CATALOG_NAME_PATTERN,
		"Catalog names can only contain alphanumeric characters and dashes.",
	)
	.refine(async (name) => !(await isEngineNameTaken(name)), {
		message: "This Catalog name has already been used, please try another.",
	});

/** Reusable zod fragment for the FUNCTION_PARAMETERS metadata field. */
export const parameterListSchema = z.array(
	z.object({
		parameterName: z.string().optional(),
		parameterType: z.string().optional(),
		parameterDescription: z.string().optional(),
	}),
);

/** Reusable zod fragment for the FUNCTION_REQUIRED_PARAMETERS metadata field. */
export const stringListSchema = z.array(z.string());

/**
 * Check whether a catalog name is already taken (CheckEngineName pixel).
 */
export const isEngineNameTaken = async (name: string): Promise<boolean> => {
	const response = await runPixel<[{ exists: boolean }]>(
		`CheckEngineName ( "${name}") ;`,
	);
	return Boolean(response.pixelReturn[0]?.output?.exists);
};

/**
 * Structured-list fields are arrays in form state for the UI, but the
 * backend reads FUNCTION_PARAMETERS / FUNCTION_REQUIRED_PARAMETERS as JSON
 * strings, so encode any array value before it goes on the pixel.
 */
const encodeListFields = (
	values: Record<string, unknown>,
): Record<string, unknown> => {
	const encoded: Record<string, unknown> = { ...values };
	for (const key of Object.keys(encoded)) {
		if (Array.isArray(encoded[key])) {
			const list = encoded[key] as unknown[];
			encoded[key] = list.length === 0 ? "" : JSON.stringify(list);
		}
	}
	return encoded;
};

/**
 * Create a Function engine (CreateRestFunctionEngine) and return its new id.
 * Uploads `file` first (if provided) and attaches its location as filePaths.
 *
 * @param name - The catalog name (also the pixel's `function` argument).
 * @param functionDetails - Every other field's values, keyed by pixel field name.
 * @param file - Optional file to upload and attach (e.g. a service-account JSON).
 * @param insightId - The active SEMOSS insight ID, for the file upload.
 * @returns The newly created engine's id.
 */
export const createFunctionEngine = async (
	name: string,
	functionDetails: Record<string, unknown>,
	file: File | null | undefined,
	insightId: string,
): Promise<string> => {
	const createReactor =
		functionDetails.FUNCTION_TYPE === "LOCAL_PYTHON"
			? "CreatePythonFunctionEngine"
			: "CreateFunctionEngine";
	let pixel = `${createReactor}(function=["${name}"],functionDetails=[${JSON.stringify(
		encodeListFields(functionDetails),
	)}]);`;

	if (file) {
		const uploadedFiles = await uploadFile([file], insightId);
		if (!uploadedFiles || !Array.isArray(uploadedFiles)) {
			throw new Error("Upload failed or returned invalid response.");
		}
		pixel = pixel.replace(
			");",
			`,filePaths=["${uploadedFiles[0].fileLocation}"]);`,
		);
	}

	const response =
		await runPixel<[{ engine_id?: string; database_id?: string }]>(pixel);
	const { output, operationType } = response.pixelReturn[0];
	if (operationType.includes("ERROR")) {
		throw new Error(output as unknown as string);
	}

	const id = output?.engine_id || output?.database_id;
	if (!id) {
		throw new Error("CreateRestFunctionEngine did not return an engine id");
	}
	return id;
};
