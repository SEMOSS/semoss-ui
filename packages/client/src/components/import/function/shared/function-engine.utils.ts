import { runPixel } from "@semoss/sdk/react";
import { z } from "@semoss/ui/next";
import { uploadFile } from "@/api";

/** Shared description for every connector's "Function Metadata" section. */
export const FUNCTION_METADATA_DESCRIPTION =
	"What a model sees when it picks this function out of a tool list: the name it calls, what the function says it does, and the parameters it takes. Every function type fills these in for itself, so set them only to override that wording.";

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
