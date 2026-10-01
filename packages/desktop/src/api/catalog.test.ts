import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DesktopInstanceProfile } from "@/types";
import { fetchCatalog } from "./catalog";
import { runPixel } from "./pixel";

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

describe("catalog loading", () => {
	beforeEach(() => {
		vi.mocked(runPixel).mockReset();
	});

	it("normalizes engine metadata for desktop cards", async () => {
		vi.mocked(runPixel).mockResolvedValue({
			insightId: "insight",
			output: [
				{
					engine_id: "model-1",
					engine_name: "internal-name",
					engine_display_name: "Primary Model",
					engine_type: "MODEL",
					engine_subtype: "OPEN_AI",
					engine_favorite: 1,
					description: "A model.",
				},
			],
			outputs: [],
		});

		await expect(fetchCatalog(profile, {}, "models")).resolves.toEqual([
			{
				id: "model-1",
				name: "Primary Model",
				type: "MODEL",
				subtype: "OPEN_AI",
				description: "A model.",
				favorite: true,
			},
		]);
		expect(runPixel).toHaveBeenCalledWith(
			profile,
			{},
			'MyEngines(metaKeys=["description"], metaFilters=[{}], engineTypes=[\'MODEL\'], sort=[{"ENGINENAME":"ASC"}], userT=[true], limit=[100], offset=[0]);',
		);
	});
});
