import { runPixel } from "@semoss/sdk";
import { encodeTextToBase64 } from "@semoss/utility/encoding";
import { isRecord } from "@semoss/utility/object";

export interface ApiTestResponse {
	status: number;
	headers: Record<string, string>;
	body: unknown;
	truncated: boolean;
	durationMs: number;
}

function isTestResponse(value: unknown): value is ApiTestResponse {
	return (
		isRecord(value) &&
		typeof value.status === "number" &&
		isRecord(value.headers) &&
		typeof value.truncated === "boolean" &&
		typeof value.durationMs === "number"
	);
}

/**
 * Sends one API Request node's configuration once through the server, which
 * applies the same checks and credentials as a real run.
 *
 * @param config backend-shaped node configuration
 * @param samples values for any `${...}` references in the configuration
 */
export async function testAutomationRequest(
	project: string,
	config: Record<string, unknown>,
	samples: Record<string, unknown>,
): Promise<ApiTestResponse> {
	const configPayload = encodeTextToBase64(JSON.stringify(config));
	const samplesPayload = encodeTextToBase64(JSON.stringify(samples));
	const response = await runPixel(
		`TestAutomationRequest(project=${JSON.stringify([project])}, config=${JSON.stringify([configPayload])}, inputs=${JSON.stringify([samplesPayload])});`,
	);
	if (response.errors.length > 0) {
		throw new Error(response.errors.join("\n"));
	}
	const output: unknown = response.pixelReturn?.[0]?.output;
	if (!isTestResponse(output)) {
		throw new Error("SEMOSS returned an unexpected test response.");
	}
	return output;
}
