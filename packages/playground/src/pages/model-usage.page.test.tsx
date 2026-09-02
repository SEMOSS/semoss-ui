import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getPreviousMonthDateRange, ModelUsagePage } from "./model-usage.page";

const mocks = vi.hoisted(() => ({
	getUsageModels: vi.fn(),
	getUserModelCreditInfo: vi.fn(),
}));

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { language: "en", resolvedLanguage: "en" },
	}),
}));

vi.mock("@/api", () => mocks);

vi.mock("@/hooks", () => ({
	useGlobalBreadcrumbs: vi.fn(),
}));

describe("ModelUsagePage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.getUsageModels.mockResolvedValue([
			{
				engine_id: "model-1",
				engine_name: "Test Model",
				engine_type: "MODEL",
			},
		]);
		mocks.getUserModelCreditInfo.mockResolvedValue({
			engineId: "model-1",
			userId: "user-1",
			restrictionEnabled: true,
			restrictionType: "credit",
			frequency: "MONTH",
			maxCredits: 10,
			creditsUsed: 4,
			creditsRemaining: null,
			limitExceeded: null,
			periodStart: "2026-09-01T00:00:00Z",
			periodEnd: "2026-09-30T23:59:59Z",
			trackingEnabled: true,
			rangeType: "CUSTOM",
			inputTokenCredit: 0.000002,
			outputTokenCredit: 0.000008,
			inputCreditsPerMillion: 2,
			outputCreditsPerMillion: 8,
			cacheReadMultiplier: 0.25,
			cacheWriteMultiplier: 1.25,
			pricingConfigured: true,
		});
	});

	test("loads the first model and displays its credit usage", async () => {
		render(<ModelUsagePage />);

		expect(await screen.findByText("Test Model")).toBeInTheDocument();
		await waitFor(() => {
			expect(mocks.getUserModelCreditInfo).toHaveBeenCalledWith(
				"model-1",
				expect.stringMatching(/^\d{4}-\d{2}-01$/),
				expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
			);
		});
		expect(screen.getByText("4")).toBeInTheDocument();
		expect(screen.queryByText("40%")).not.toBeInTheDocument();
	});

	test("shows an empty state when the user has no models", async () => {
		mocks.getUsageModels.mockResolvedValue([]);

		render(<ModelUsagePage />);

		expect(
			await screen.findByText("usage:empty.title"),
		).toBeInTheDocument();
		expect(mocks.getUserModelCreditInfo).not.toHaveBeenCalled();
	});

	test("defaults the custom range to the previous calendar month", () => {
		expect(getPreviousMonthDateRange(new Date(2026, 0, 15))).toEqual({
			startDate: "2025-12-01",
			endDate: "2025-12-31",
		});
	});

	test("does not render NaN when no credit limit is assigned", async () => {
		mocks.getUserModelCreditInfo.mockResolvedValue({
			engineId: "model-1",
			userId: "user-1",
			restrictionEnabled: false,
			restrictionType: null,
			frequency: null,
			limitExceeded: null,
			trackingEnabled: true,
			rangeType: "CUSTOM",
			pricingConfigured: false,
		});

		render(<ModelUsagePage />);

		expect(
			await screen.findByText("usage:noRestriction.title"),
		).toBeInTheDocument();
		expect(screen.queryByText("NaN")).not.toBeInTheDocument();
		expect(screen.queryByText("NaN%")).not.toBeInTheDocument();
		expect(
			screen.queryByText("usage:period.title"),
		).not.toBeInTheDocument();
	});
});
