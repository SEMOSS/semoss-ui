import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DesktopInstanceProfile } from "@/types";
import { runPixel } from "./pixel";
import { request } from "./transport";

vi.mock("./transport", () => ({
	request: vi.fn(),
}));

const profile: DesktopInstanceProfile = {
	id: "test",
	displayName: "Test",
	endpoint: "https://example.com",
	module: "/Monolith",
	platformPath: "/SemossWeb/",
	allowInsecureHttp: false,
};

describe("Pixel execution", () => {
	beforeEach(() => {
		vi.mocked(request).mockReset();
	});

	it("surfaces Pixel operation errors", async () => {
		vi.mocked(request).mockResolvedValue(
			new Response(
				JSON.stringify({
					insightID: "insight",
					pixelReturn: [
						{
							operationType: ["ERROR"],
							output: "Catalog access denied",
						},
					],
				}),
				{ status: 200 },
			),
		);

		await expect(
			runPixel(profile, {}, "META | GetUserInfo();"),
		).rejects.toThrow("Catalog access denied");
	});
});
