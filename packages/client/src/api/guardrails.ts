import { runPixel } from "@semoss/sdk/react";

interface CreateGuardrailEngineOutput {
	engine_id?: string;
	database_id?: string;
}

/**
 * Creates a guardrail engine whose configuration is persisted as SMSS
 * properties and returns its catalog identifier.
 *
 * @param insightId - Insight used to execute the Pixel request.
 * @param name - Catalog name for the guardrail.
 * @param details - Guardrail type and engine-specific SMSS properties.
 * @returns The created guardrail engine identifier.
 */
export const createGuardrailEngine = async (
	insightId: string | undefined,
	name: string,
	details: Record<string, unknown>,
): Promise<string> => {
	const pixel = `CreateGuardrailEngine(guardrail=[${JSON.stringify(name)}],guardrailDetails=[${JSON.stringify(details)}]);`;
	const response = await runPixel<[CreateGuardrailEngineOutput]>(
		pixel,
		insightId,
	).catch((error) => {
		throw Error(error);
	});

	if (response.errors.length > 0) {
		throw Error(response.errors.join("\n"));
	}

	const output = response.pixelReturn[0]?.output;
	const engineId = output?.engine_id ?? output?.database_id;
	if (!engineId) {
		throw Error("No guardrail engine identifier was returned");
	}

	return engineId;
};
