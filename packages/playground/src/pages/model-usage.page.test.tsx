import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getLastMonthDateRange, ModelUsagePage } from "./model-usage.page";

const mocks = vi.hoisted(() => ({
	getUsageModels: vi.fn(),
	getUserModelCreditInfo: vi.fn(),
	getUserModelUsage: vi.fn(),
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
			creditsRemaining: 6,
			limitExceeded: false,
			periodStart: "2026-09-01T00:00:00Z",
			periodEnd: "2026-09-30T23:59:59Z",
			trackingEnabled: true,
			rangeType: "RESTRICTION",
			inputTokenCredit: 0.000002,
			outputTokenCredit: 0.000008,
			inputCreditsPerMillion: 2,
			outputCreditsPerMillion: 8,
			cacheReadMultiplier: 0.25,
			cacheWriteMultiplier: 1.25,
			pricingConfigured: true,
		});
		mocks.getUserModelUsage.mockResolvedValue([
			{
				ENGINE_ID: "model-1",
				ENGINE_NAME: "Test Model",
				INPUT_TOKENS: 100,
				RESPONSE_TOKENS: 50,
				TOTAL_TOKENS: 150,
				TOTAL_REQUESTS: 2,
				TOTAL_CREDITS: 4,
			},
		]);
	});

	test("loads the first model and displays its credit usage", async () => {
		render(<ModelUsagePage />);

		expect(await screen.findByText("Test Model")).toBeInTheDocument();
		await waitFor(() => {
			expect(mocks.getUserModelCreditInfo).toHaveBeenCalledWith(
				"model-1",
			);
		});
		expect(screen.getAllByText("4")).toHaveLength(3);
		expect(screen.getByText("6")).toBeInTheDocument();
		expect(screen.getByText("40%")).toBeInTheDocument();
		expect(screen.getAllByText("usage:overview.requests")).toHaveLength(2);
		expect(
			screen.queryByText("usage:pricing.title"),
		).not.toBeInTheDocument();
	});

	test("shows an empty state when the user has no models", async () => {
		mocks.getUsageModels.mockResolvedValue([]);

		render(<ModelUsagePage />);

		expect(
			await screen.findByText("usage:empty.title"),
		).toBeInTheDocument();
		expect(mocks.getUserModelCreditInfo).not.toHaveBeenCalled();
	});

	test("loads limit details when a model row is selected", async () => {
		mocks.getUsageModels.mockResolvedValue([
			{
				engine_id: "model-1",
				engine_name: "Test Model",
				engine_type: "MODEL",
			},
			{
				engine_id: "model-2",
				engine_name: "Second Model",
				engine_type: "MODEL",
			},
		]);
		mocks.getUserModelUsage.mockResolvedValue([
			{
				ENGINE_ID: "model-1",
				ENGINE_NAME: "Test Model",
				INPUT_TOKENS: 100,
				RESPONSE_TOKENS: 50,
				TOTAL_TOKENS: 150,
				TOTAL_REQUESTS: 2,
				TOTAL_CREDITS: 4,
			},
			{
				ENGINE_ID: "model-2",
				ENGINE_NAME: "Second Model",
				INPUT_TOKENS: 20,
				RESPONSE_TOKENS: 10,
				TOTAL_TOKENS: 30,
				TOTAL_REQUESTS: 1,
				TOTAL_CREDITS: 1,
			},
		]);

		render(<ModelUsagePage />);

		fireEvent.click(
			await screen.findByRole("button", { name: "Second Model" }),
		);
		await waitFor(() => {
			expect(mocks.getUserModelCreditInfo).toHaveBeenCalledWith(
				"model-2",
			);
		});
	});

	test("defaults the custom range to the rolling month ending today", () => {
		expect(getLastMonthDateRange(new Date(2026, 8, 2))).toEqual({
			startDate: "2026-08-02",
			endDate: "2026-09-02",
		});
		expect(getLastMonthDateRange(new Date(2026, 2, 31))).toEqual({
			startDate: "2026-02-28",
			endDate: "2026-03-31",
		});
	});

	test("does not render NaN when no credit limit is assigned", async () => {
		mocks.getUserModelCreditInfo.mockResolvedValue({
			engineId: "model-1",
			userId: "user-1",
			restrictionEnabled: false,
			restrictionType: null,
			frequency: null,
			creditsUsed: 4,
			limitExceeded: null,
			trackingEnabled: true,
			rangeType: "CUSTOM",
			pricingConfigured: false,
		});

		render(<ModelUsagePage />);

		await screen.findByLabelText("usage:dateRange.start");
		expect(
			screen.queryByText("usage:noRestriction.title"),
		).not.toBeInTheDocument();
		await waitFor(() => {
			expect(mocks.getUserModelCreditInfo).toHaveBeenCalledWith(
				"model-1",
			);
		});
		expect(screen.queryByText("NaN")).not.toBeInTheDocument();
		expect(screen.queryByText("NaN%")).not.toBeInTheDocument();
		expect(
			screen.queryByText("usage:period.title"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText("usage:metrics.remaining"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText("usage:metrics.limit"),
		).not.toBeInTheDocument();
		await waitFor(() => {
			expect(screen.getAllByText("100")).toHaveLength(2);
			expect(screen.getAllByText("50")).toHaveLength(2);
			expect(screen.getAllByText("2")).toHaveLength(2);
		});
	});

	test("waits for Apply before loading a custom date range", async () => {
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

		const startInput = await screen.findByLabelText(
			"usage:dateRange.start",
		);
		await waitFor(() => expect(mocks.getUserModelUsage).toHaveBeenCalled());
		const callsBeforeEdit = mocks.getUserModelUsage.mock.calls.length;

		fireEvent.change(startInput, { target: { value: "2026-08-01" } });
		expect(mocks.getUserModelUsage).toHaveBeenCalledTimes(callsBeforeEdit);

		fireEvent.click(screen.getByText("usage:dateRange.apply"));
		await waitFor(() => {
			expect(mocks.getUserModelUsage).toHaveBeenLastCalledWith(
				["model-1"],
				"2026-08-01",
				expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
			);
		});
	});
});
