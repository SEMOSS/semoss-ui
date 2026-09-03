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

/** Token, request, and credit totals returned for one model. */
export interface ModelUsageSummary {
	ENGINE_ID: string;
	ENGINE_NAME: string | null;
	INPUT_TOKENS: number;
	RESPONSE_TOKENS: number;
	TOTAL_TOKENS: number;
	TOTAL_REQUESTS: number;
	TOTAL_CREDITS: number;
	HAS_RESTRICTION: boolean;
	RESTRICTION_TYPE: string | null;
	RESTRICTION_FREQUENCY: string | null;
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

const getFollowingDate = (value: string): string => {
	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day + 1));
	return date.toISOString().slice(0, 10);
};

/** Return usage totals for all requested models over an inclusive UI range. */
export const getUserModelUsage = async (
	modelIds: string[],
	startDate: string,
	endDate: string,
): Promise<ModelUsageSummary[]> => {
	if (modelIds.length === 0) return [];
	const response = await runPixel<[ModelUsageSummary[]]>(
		`META | GetUserModelUsage(engine=${JSON.stringify(modelIds)}, startDate=${JSON.stringify(startDate)}, endDate=${JSON.stringify(getFollowingDate(endDate))});`,
	);
	assertPixelSuccess(response.errors);

	const output = response.pixelReturn[0]?.output;
	if (!Array.isArray(output)) {
		throw new Error("No model usage response");
	}
	return output;
};

/** Return the current user's credit usage for a model. */
export const getUserModelCreditInfo = async (
	modelId: string,
	startDate?: string,
	endDate?: string,
): Promise<ModelCreditInfo> => {
	const dateArguments =
		startDate && endDate
			? `, startDate=${JSON.stringify(startDate)}, endDate=${JSON.stringify(endDate)}`
			: "";
	const response = await runPixel<[ModelCreditInfo]>(
		`META | GetUserModelCreditInfo(engine=${JSON.stringify(modelId)}${dateArguments});`,
	);
	assertPixelSuccess(response.errors);

	const output = response.pixelReturn[0]?.output;
	if (!output) {
		throw new Error("No model credit usage response");
	}
	return output;
};
