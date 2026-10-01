import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DesktopInstanceProfile } from "@/types";
import { runPixel } from "./pixel";
import { request } from "./transport";
import { fetchCatalogWorkbench } from "./workbench";

vi.mock("./pixel", () => ({
	runPixel: vi.fn(),
}));

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

describe("catalog workbench loading", () => {
	beforeEach(() => {
		vi.mocked(runPixel).mockReset();
		vi.mocked(request).mockReset();
		vi.mocked(request).mockResolvedValue(
			new Response(JSON.stringify({ permission: "OWNER" }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);
	});

	it("loads project metadata, dependencies, and permission", async () => {
		vi.mocked(runPixel).mockResolvedValue({
			insightId: "insight",
			output: {
				project_id: "app-1",
				description: "A useful app.",
			},
			outputs: [
				{
					project_id: "app-1",
					description: "A useful app.",
				},
				{
					engines: [
						{
							engine_id: "model-1",
							engine_name: "Model",
							engine_type: "MODEL",
						},
					],
				},
			],
		});

		const result = await fetchCatalogWorkbench(
			profile,
			{ projectMetaKeys: [{ metakey: "owner" }] },
			"apps",
			{
				id: "app-1",
				name: "App",
				type: "APP",
				subtype: "",
				description: "",
				favorite: false,
			},
		);

		expect(result.permission).toBe("OWNER");
		expect(result.resource.description).toBe("A useful app.");
		expect(result.dependencies).toHaveLength(1);
		expect(runPixel).toHaveBeenCalledWith(
			profile,
			{ projectMetaKeys: [{ metakey: "owner" }] },
			'GetProjectMetadata(project=["app-1"], metaKeys=["description","markdown","tag","owner"]); GetProjectDependencies(project=["app-1"]);',
		);
		expect(request).toHaveBeenCalledWith(
			profile,
			"https://example.com/Monolith/api/auth/project/getUserProjectPermission?projectId=app-1",
			expect.any(Object),
		);
	});

	it("loads model-specific metadata for the model workbench", async () => {
		vi.mocked(runPixel).mockResolvedValue({
			insightId: "insight",
			output: {
				engine_id: "model-1",
				description: "Model description.",
			},
			outputs: [
				{
					engine_id: "model-1",
					description: "Model description.",
				},
				{
					context_window: 128000,
					supports_tools: true,
				},
			],
		});

		const result = await fetchCatalogWorkbench(profile, {}, "models", {
			id: "model-1",
			name: "Model",
			type: "MODEL",
			subtype: "OPEN_AI",
			description: "",
			favorite: false,
		});

		expect(result.modelMetadata).toEqual({
			context_window: 128000,
			supports_tools: true,
		});
		expect(runPixel).toHaveBeenCalledWith(
			profile,
			{},
			'GetEngineMetadata(engine=["model-1"], metaKeys=[["markdown","description"]]); GetModelMetadata(engine=["model-1"]);',
		);
	});
});
