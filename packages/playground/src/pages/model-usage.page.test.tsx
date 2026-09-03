import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
	formatCredits,
	getPresetDateRange,
	ModelUsagePage,
} from "./model-usage.page";

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
	test("formats credits without storage-level precision", () => {
		expect(formatCredits(12483.000216, "en-US")).toBe("12,483");
		expect(formatCredits(12.345, "en-US")).toBe("12.35");
	});

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
				TOKEN_DETAIL: {
					INPUT_TOKENS: 100,
					OUTPUT_TOKENS: 50,
					CACHE_READ_TOKENS: 25,
					CACHE_CREATION_TOKENS: 10,
					THINKING_TOKENS: 5,
				},
				HAS_RESTRICTION: true,
				RESTRICTION_TYPE: "credit",
				RESTRICTION_FREQUENCY: "MONTH",
			},
		]);
	});

	test("loads the first model and displays its credit usage", async () => {
		render(<ModelUsagePage />);

		expect(
			await screen.findByRole("button", { name: "Test Model" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Test Model" }),
		).toBeInTheDocument();
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
			screen.getByText("usage:restriction.restricted"),
		).toBeInTheDocument();
		expect(
			screen.queryByText("usage:overview.tokenBreakdown"),
		).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Test Model" }));
		expect(
			screen.getByText("usage:overview.tokenBreakdown"),
		).toBeInTheDocument();
		expect(
			screen.getByText("usage:overview.cacheReadTokens"),
		).toBeInTheDocument();
		expect(
			screen.getByText("usage:overview.cacheWriteTokens"),
		).toBeInTheDocument();
		expect(
			screen.getByText("usage:overview.thinkingTokens"),
		).toBeInTheDocument();
		expect(screen.getByText("65")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Test Model" }));
		expect(
			screen.queryByText("usage:overview.tokenBreakdown"),
		).not.toBeInTheDocument();
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
				HAS_RESTRICTION: true,
				RESTRICTION_TYPE: "credit",
				RESTRICTION_FREQUENCY: "MONTH",
			},
			{
				ENGINE_ID: "model-2",
				ENGINE_NAME: "Second Model",
				INPUT_TOKENS: 20,
				RESPONSE_TOKENS: 10,
				TOTAL_TOKENS: 30,
				TOTAL_REQUESTS: 1,
				TOTAL_CREDITS: 1,
				HAS_RESTRICTION: false,
				RESTRICTION_TYPE: null,
				RESTRICTION_FREQUENCY: null,
			},
		]);

		render(<ModelUsagePage />);

		const secondModelRow = (
			await screen.findByRole("button", { name: "Second Model" })
		).closest("tr");
		expect(secondModelRow).not.toBeNull();
		fireEvent.click(secondModelRow as HTMLTableRowElement);
		await waitFor(() => {
			expect(mocks.getUserModelCreditInfo).toHaveBeenCalledWith(
				"model-2",
			);
		});
		expect(
			screen.getByRole("heading", { name: "Second Model" }),
		).toBeInTheDocument();
	});

	test("builds calendar-based preset ranges ending today", () => {
		const reference = new Date(2026, 8, 3);
		expect(getPresetDateRange("today", reference)).toEqual({
			startDate: "2026-09-03",
			endDate: "2026-09-03",
		});
		expect(getPresetDateRange("week", reference)).toEqual({
			startDate: "2026-08-30",
			endDate: "2026-09-03",
		});
		expect(getPresetDateRange("month", reference)).toEqual({
			startDate: "2026-09-01",
			endDate: "2026-09-03",
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

		await screen.findByRole("button", { name: "Test Model" });
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
		fireEvent.click(await screen.findByText("usage:dateRange.custom"));

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
