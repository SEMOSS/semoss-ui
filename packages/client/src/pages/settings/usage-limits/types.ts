export type TimePeriod = "DAY" | "WEEK" | "MONTH" | "YEAR" | "ALL_TIME";

export interface TokenLimitEntry {
	id: string;
	period: TimePeriod;
	maxTokens: number | null;
	maxInputTokens: number | null;
	maxOutputTokens: number | null;
	maxResponseTime?: number | null;
	isActive: boolean;
	_saved: {
		period: TimePeriod;
		maxTokens: number | null;
		maxInputTokens: number | null;
		maxOutputTokens: number | null;
		maxResponseTime?: number | null;
		isActive: boolean;
	};
}
