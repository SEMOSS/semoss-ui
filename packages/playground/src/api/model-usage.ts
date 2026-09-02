import { runPixel } from "@semoss/sdk/react";
import type { Engine } from "@/types";

/** Credit usage and pricing returned for one user-model assignment. */
export interface ModelCreditInfo {
	engineId: string;
	userId: string;
	restrictionEnabled: boolean;
	restrictionType: string | null;
	frequency: "DAY" | "WEEK" | "MONTH" | "YEAR" | "ALL_TIME" | null;
	maxCredits: number | null;
	creditsUsed: number | null;
	creditsRemaining: number | null;
	limitExceeded: boolean | null;
	periodStart: string | null;
	periodEnd: string | null;
	trackingEnabled: boolean;
	rangeType: "CUSTOM" | "RESTRICTION";
	inputTokenCredit: number | null;
	outputTokenCredit: number | null;
	inputCreditsPerMillion: number | null;
	outputCreditsPerMillion: number | null;
	cacheReadMultiplier: number;
	cacheWriteMultiplier: number;
	pricingConfigured: boolean;
}

/** Throw when a Pixel execution reports one or more backend errors. */
const assertPixelSuccess = (errors: string[]): void => {
	if (errors.length > 0) {
		throw new Error(errors.join(""));
	}
};

/** Return the text-generation models available to the current user. */
export const getUsageModels = async (): Promise<Engine[]> => {
	const response = await runPixel<[Engine[]]>(
		'META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"]);',
	);
	assertPixelSuccess(response.errors);

	const output = response.pixelReturn[0]?.output;
	if (!Array.isArray(output)) {
		throw new Error("No model response");
	}
	return output;
};

/** Return the current user's credit usage for a model. */
export const getUserModelCreditInfo = async (
	modelId: string,
	startDate: string,
	endDate: string,
): Promise<ModelCreditInfo> => {
	const response = await runPixel<[ModelCreditInfo]>(
		`META | GetUserModelCreditInfo(engine=${JSON.stringify(modelId)}, startDate=${JSON.stringify(startDate)}, endDate=${JSON.stringify(endDate)});`,
	);
	assertPixelSuccess(response.errors);

	const output = response.pixelReturn[0]?.output;
	if (!output) {
		throw new Error("No model credit usage response");
	}
	return output;
};
