import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DesktopInstanceProfile, InstanceConfig } from "@/types";
import { runPixel } from "./pixel";
import { fetchCurrentUser } from "./user";

vi.mock("./pixel", () => ({
	runPixel: vi.fn(),
}));

const profile: DesktopInstanceProfile = {
	id: "test",
	displayName: "Test",
	endpoint: "https://example.com",
	module: "/Monolith",
	platformPath: "/SemossWeb/",
	allowInsecureHttp: false,
};

describe("authenticated user loading", () => {
	beforeEach(() => {
		vi.mocked(runPixel).mockReset();
	});

	it("uses the first provider returned by the Playground user pixels", async () => {
		vi.mocked(runPixel).mockResolvedValue({
			insightId: "insight",
			output: {
				API_USER: { id: "api", name: "API User" },
			},
			outputs: [
				{
					MS: {
						id: "ms",
						name: "Parth Patel",
						email: "parth@example.com",
						lastLogin: "2026-10-01",
					},
					NATIVE: { id: "native", name: "Native User" },
				},
				{ "text-generation-model": ["model-1"] },
			],
		});

		await expect(
			fetchCurrentUser(profile, {} as InstanceConfig),
		).resolves.toEqual({
			id: "ms",
			name: "Parth Patel",
			email: "parth@example.com",
			provider: "MS",
			lastLogin: "2026-10-01",
			defaultTextGenerationModelId: "model-1",
		});
		expect(runPixel).toHaveBeenCalledWith(
			profile,
			{},
			"META | GetUserInfo(); META | GetUserMetadata();",
		);
	});
});
