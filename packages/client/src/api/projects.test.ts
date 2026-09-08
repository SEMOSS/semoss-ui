import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel } from "@semoss/sdk";
import { createAppFromTemplate } from "./projects";

vi.mock("@semoss/sdk", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@semoss/sdk")>();
	return { ...actual, runPixel: vi.fn() };
});

const runPixelMock = vi.mocked(runPixel);

const pixelResponse = (output: unknown, errors: string[] = []) =>
	({
		errors,
		pixelReturn: [{ output }],
	}) as never;

describe("createAppFromTemplate", () => {
	beforeEach(() => {
		runPixelMock.mockReset();
	});

	it("creates a private project and returns its ID", async () => {
		runPixelMock.mockResolvedValueOnce(
			pixelResponse({ project_id: "project-1" }),
		);

		await expect(
			createAppFromTemplate({
				name: 'Starter "Workspace"',
				templateId: "template-1",
				isGlobal: false,
			}),
		).resolves.toBe("project-1");
		expect(runPixelMock).toHaveBeenCalledWith(
			'CreateAppFromTemplate(project=["Starter \\"Workspace\\""], projectTemplate=["template-1"], global=["false"]);',
		);
	});

	it("sets a trimmed description after cloning", async () => {
		runPixelMock
			.mockResolvedValueOnce(pixelResponse({ project_id: "project-1" }))
			.mockResolvedValueOnce(pixelResponse(true));

		await createAppFromTemplate({
			name: "Starter",
			templateId: "template-1",
			isGlobal: false,
			description: "  Description  ",
		});

		expect(runPixelMock).toHaveBeenNthCalledWith(
			2,
			'SetProjectMetadata(project=["project-1"], meta=[{"description":"Description"}]);',
		);
	});

	it("throws backend errors", async () => {
		runPixelMock.mockResolvedValueOnce(
			pixelResponse(null, ["Clone failed"]),
		);

		await expect(
			createAppFromTemplate({
				name: "Starter",
				templateId: "template-1",
				isGlobal: false,
			}),
		).rejects.toThrow("Clone failed");
	});

	it("rejects a clone response without a project ID", async () => {
		runPixelMock.mockResolvedValueOnce(pixelResponse({}));

		await expect(
			createAppFromTemplate({
				name: "Starter",
				templateId: "template-1",
				isGlobal: false,
			}),
		).rejects.toThrow("did not return a project ID");
	});
});
