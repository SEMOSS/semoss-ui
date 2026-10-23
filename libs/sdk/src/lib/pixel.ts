import { Env } from "../env";
import { post } from "./fetch";
import type { ResolvePixelOutput } from "./pixel-types";

/**
 * Run a Pixel string, inferring successful output types for buildPixel results.
 * Explicit output generics retain their existing override behavior. These types
 * do not validate backend responses; error and delayed entries remain unchanged.
 *
 * @param pixel - pixel
 * @param insightId - id of the insight to run
 */
export const runPixel = async <
	O extends unknown[] | [],
	P extends string = string,
>(
	pixel: P,
	insightId?: string,
) => {
	if (!pixel) {
		throw new Error("Missing Pixel");
	}

	const body: Record<string, unknown> = {
		expression: pixel,
	};

	if (insightId) {
		body.insightId = insightId;
	}

	// try to add the timezone
	try {
		body.tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
	} catch {}

	const response = await post<{
		insightID: string;
		pixelReturn: {
			isMeta: boolean;
			operationType: string[];
			output: ResolvePixelOutput<P, O[number]>;
			pixelExpression: string;
			pixelId: string;
			additionalOutput?: unknown;
			timeToRun: number;
		}[];
	}>(`${Env.MODULE}/api/engine/runPixel`, body, {});

	// collect the errors
	const errors: string[] = [];
	for (const p of response.data.pixelReturn) {
		const { output, operationType } = p;

		if (operationType.indexOf("ERROR") > -1) {
			// output isn't always a string - avoid "[object Object]"
			errors.push(
				typeof output === "string" ? output : JSON.stringify(output),
			);
		}
	}

	return {
		errors: errors,
		insightId: response.data.insightID,
		pixelReturn: response.data.pixelReturn,
	};
};
