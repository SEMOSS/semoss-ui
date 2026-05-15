export type TokenLimitResourceType = "MODEL" | "PROJECT" | "WORKSPACE";

export interface TokenLimitState {
	maxTokens: string;
	maxInputTokens: string;
	maxOutputTokens: string;
	maxResponseTime: string;
	frequency: string;
}

export interface TokenLimitServerValues {
	max_tokens?: number | null;
	max_input_tokens?: number | null;
	max_output_tokens?: number | null;
	max_response_time?: number | null;
	usage_frequency?: string | null;
	usage_restriction?: string | null;
}

export const TOKEN_LIMIT_TYPES = new Set<string>([
	"MODEL",
	"PROJECT",
	"WORKSPACE",
]);

export const FREQUENCY_OPTIONS = [
	{ value: "DAY", label: "Daily" },
	{ value: "WEEK", label: "Weekly" },
	{ value: "MONTH", label: "Monthly" },
	{ value: "YEAR", label: "Yearly" },
	{ value: "ALL_TIME", label: "All time" },
] as const;

export const DEFAULT_FREQUENCY = "DAY";

export function parseNum(val: string): string {
	return val.replace(/[^0-9]/g, "");
}

export function formatNum(val: string): string {
	const digits = val.replace(/[^0-9]/g, "");
	if (!digits) return "";
	return Number(digits).toLocaleString();
}

export function formatServerValue(val?: number | null): string {
	if (val == null) return "—";
	return val.toLocaleString();
}

export function formatFrequency(val?: string | null): string {
	if (!val) return "—";
	return (
		FREQUENCY_OPTIONS.find((o) => o.value === val.toUpperCase())?.label ??
		val
	);
}

export function supportsTokenLimits(
	type: string,
): type is TokenLimitResourceType {
	return TOKEN_LIMIT_TYPES.has(type);
}

export function buildTokenLimitPayload(
	type: string,
	state: TokenLimitState,
): Record<string, unknown> {
	if (!supportsTokenLimits(type)) return {};

	const hasAnyLimit = !!(
		state.maxTokens ||
		state.maxInputTokens ||
		state.maxOutputTokens
	);
	const hasComputeTime = !!state.maxResponseTime;
	if (!hasAnyLimit && !hasComputeTime) return {};

	const result: Record<string, unknown> = {
		usageRestriction: hasAnyLimit ? "token" : "compute",
		usageFrequency: state.frequency,
	};
	if (state.maxTokens) result.maxTokens = Number(state.maxTokens);
	if (state.maxInputTokens)
		result.maxInputTokens = Number(state.maxInputTokens);
	if (state.maxOutputTokens)
		result.maxOutputTokens = Number(state.maxOutputTokens);
	if (state.maxResponseTime)
		result.maxResponseTime = Number(state.maxResponseTime);
	return result;
}

export function buildTokenLimitPayloadFromServer(
	type: string,
	user: TokenLimitServerValues,
): Record<string, unknown> {
	if (!supportsTokenLimits(type)) return {};

	const hasAnyLimit =
		user.max_tokens != null ||
		user.max_input_tokens != null ||
		user.max_output_tokens != null;
	const hasComputeTime = user.max_response_time != null;
	if (!hasAnyLimit && !hasComputeTime) return {};

	const result: Record<string, unknown> = {};
	if (hasAnyLimit) {
		result.usageRestriction = "token";
		result.usageFrequency = user.usage_frequency;
		if (user.max_tokens != null) result.maxTokens = user.max_tokens;
		if (user.max_input_tokens != null)
			result.maxInputTokens = user.max_input_tokens;
		if (user.max_output_tokens != null)
			result.maxOutputTokens = user.max_output_tokens;
	}
	if (hasComputeTime) {
		if (!hasAnyLimit) {
			result.usageRestriction = "compute";
			result.usageFrequency = user.usage_frequency;
		}
		result.maxResponseTime = user.max_response_time;
	}
	return result;
}

export const EMPTY_TOKEN_LIMIT_STATE: TokenLimitState = {
	maxTokens: "",
	maxInputTokens: "",
	maxOutputTokens: "",
	maxResponseTime: "",
	frequency: DEFAULT_FREQUENCY,
};

export function tokenLimitStateFromServer(
	user: TokenLimitServerValues,
): TokenLimitState {
	return {
		maxTokens: user.max_tokens?.toString() ?? "",
		maxInputTokens: user.max_input_tokens?.toString() ?? "",
		maxOutputTokens: user.max_output_tokens?.toString() ?? "",
		maxResponseTime: user.max_response_time?.toString() ?? "",
		frequency: user.usage_frequency ?? DEFAULT_FREQUENCY,
	};
}
