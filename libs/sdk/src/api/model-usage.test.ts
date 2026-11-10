import { beforeEach, describe, expect, it, vi } from "vitest";
import { get, post } from "../utility";
import type { ModelUsageLimit } from "./access";
import {
	getPlatformDefaultLimit,
	getTeamTotalLimit,
	setPlatformDefaultLimit,
	setTeamTotalLimit,
} from "./model-usage";

vi.mock("../utility", async (importOriginal) => ({
	...(await importOriginal<typeof import("../utility")>()),
	get: vi.fn(),
	post: vi.fn(),
}));

const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);

/** Makes the next read answer with data */
const answerGet = (data: unknown) =>
	mockGet.mockResolvedValue({ data } as unknown as Awaited<
		ReturnType<typeof get>
	>);

/** Makes the next save answer with data */
const answerPost = (data: unknown) =>
	mockPost.mockResolvedValue({ data } as unknown as Awaited<
		ReturnType<typeof post>
	>);

/** The URL of the only read made */
const requestedUrl = (): URL => {
	expect(mockGet).toHaveBeenCalledTimes(1);
	return new URL(mockGet.mock.calls[0][0], "http://localhost");
};

const LIMIT: ModelUsageLimit = {
	unlimited: false,
	rules: [
		{
			metric: "COST",
			amount: 5000000,
			window: "DAY",
			counts: "EACH_PERSON",
		},
	],
};

describe("the platform default", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("reads it through the admin endpoint", async () => {
		answerGet({ usageLimit: LIMIT });

		await expect(getPlatformDefaultLimit()).resolves.toEqual(LIMIT);
		expect(requestedUrl().pathname).toContain(
			"/api/auth/admin/modelUsage/getPlatformDefault",
		);
	});

	it("reads no limit defined, which the backend sends with no usageLimit, and fails on no answer", async () => {
		answerGet({});
		await expect(getPlatformDefaultLimit()).resolves.toBeNull();

		answerGet(null);
		await expect(getPlatformDefaultLimit()).rejects.toThrow(
			"No Response to read the platform default",
		);
	});

	it("sends the limit as JSON, and empty to remove it, and returns the limit saved", async () => {
		answerPost({ usageLimit: LIMIT });
		await expect(setPlatformDefaultLimit(LIMIT)).resolves.toEqual(LIMIT);

		answerPost({});
		await expect(setPlatformDefaultLimit(null)).resolves.toBeNull();

		expect(mockPost.mock.calls[0]).toEqual([
			expect.stringContaining(
				"/api/auth/admin/modelUsage/setPlatformDefault",
			),
			{ usageLimit: JSON.stringify(LIMIT) },
			{},
		]);
		expect(mockPost.mock.calls[1][1]).toEqual({ usageLimit: "" });
	});

	it("fails when the save fails or has no answer", async () => {
		mockPost.mockRejectedValue(new Error("Only admins can do this"));
		await expect(setPlatformDefaultLimit(LIMIT)).rejects.toThrow(
			"Only admins can do this",
		);

		answerPost(null);
		await expect(setPlatformDefaultLimit(LIMIT)).rejects.toThrow(
			"No Response to set the platform default",
		);
	});
});

describe("a team's total", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("reads it by team name and type", async () => {
		answerGet({ usageLimit: { unlimited: false, rules: [] } });

		await expect(
			getTeamTotalLimit("Data & AI", "CUSTOM"),
		).resolves.toBeNull();
		const url = requestedUrl();
		expect(url.pathname).toContain(
			"/api/auth/admin/modelUsage/getTeamTotal",
		);
		expect(url.searchParams.get("groupId")).toBe("Data & AI");
		expect(url.searchParams.get("type")).toBe("CUSTOM");
	});

	it("sends the team and its limit, and returns the limit saved", async () => {
		answerPost({ usageLimit: LIMIT });

		await expect(
			setTeamTotalLimit("Data", "CUSTOM", LIMIT),
		).resolves.toEqual(LIMIT);

		expect(mockPost).toHaveBeenCalledExactlyOnceWith(
			expect.stringContaining("/api/auth/admin/modelUsage/setTeamTotal"),
			{
				groupId: "Data",
				type: "CUSTOM",
				usageLimit: JSON.stringify(LIMIT),
			},
			{},
		);
	});

	it("fails when the save fails", async () => {
		mockPost.mockRejectedValue(new Error("No such team"));

		await expect(
			setTeamTotalLimit("Data", "CUSTOM", LIMIT),
		).rejects.toThrow("No such team");
	});
});
