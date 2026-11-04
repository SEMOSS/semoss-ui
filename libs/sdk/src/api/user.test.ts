import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel } from "./base";
import { getUserInfo } from "./user";

vi.mock("./base", async (importOriginal) => ({
	...(await importOriginal<typeof import("./base")>()),
	runPixel: vi.fn(),
}));

const mockRunPixel = vi.mocked(runPixel);

/** One pixel's answer, as `runPixel` returns it. */
const answer = (output: unknown, operationType = ["USER_INFO"]) => ({
	output: output,
	operationType: operationType,
	pixelExpression: "",
	pixelId: "",
	isMeta: true,
	timeToRun: 0,
});

describe("getUserInfo", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("reads the user and their metadata in one request", async () => {
		mockRunPixel.mockResolvedValue({
			insightId: "insight-1",
			errors: [],
			pixelReturn: [
				answer({
					NATIVE: {
						id: "ada",
						name: "Ada",
						username: "ada",
						email: "null",
						userEpoch: "1",
						meta: { "text-generation-model": ["from-token"] },
					},
				}),
				answer({
					"text-generation-model": ["from-database"],
					markdown: ["# Ada"],
				}),
			],
		});

		const info = await getUserInfo("insight-1");

		expect(mockRunPixel).toHaveBeenCalledWith(
			"META | GetUserInfo(); META | GetUserMetadata();",
			"insight-1",
		);
		expect(info).toMatchObject({
			insightId: "insight-1",
			logins: {
				NATIVE: {
					id: "ada",
					email: "",
					meta: { "text-generation-model": "from-token" },
				},
			},
			meta: {
				"text-generation-model": "from-database",
				markdown: "# Ada",
			},
		});
	});

	it("keeps the user when only the metadata cannot be read", async () => {
		mockRunPixel.mockResolvedValue({
			insightId: "insight-1",
			errors: ["no metadata"],
			pixelReturn: [
				answer({ NATIVE: { id: "ada", name: "Ada" } }),
				answer("no metadata", ["ERROR"]),
			],
		});

		const info = await getUserInfo();

		expect(info.logins.NATIVE?.id).toBe("ada");
		expect(info.meta).toBeNull();
	});

	it("throws when the user cannot be read", async () => {
		mockRunPixel.mockResolvedValue({
			insightId: "insight-1",
			errors: ["no user"],
			pixelReturn: [answer("no user", ["ERROR"]), answer({})],
		});

		await expect(getUserInfo()).rejects.toThrow("no user");
	});
});
