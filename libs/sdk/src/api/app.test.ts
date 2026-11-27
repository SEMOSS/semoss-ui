import { beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "../env";
import { getText } from "../utility";
import { getProjectInfo, isPortalPublished, reloadApp } from "./app";
import { runPixel } from "./base";

vi.mock("./base", () => ({
	runPixel: vi.fn(),
}));
vi.mock("../utility", async (original) => ({
	...(await original<typeof import("../utility")>()),
	getText: vi.fn(),
}));

const mockGetText = vi.mocked(getText);

/** A page read with the given status and text. */
const page = (data: string, status = 200) =>
	({ response: { status: status }, data: data }) as unknown as Awaited<
		ReturnType<typeof getText>
	>;

const mockRunPixel = vi.mocked(runPixel);

/** A pixel response with the given statements and errors. */
const answer = (
	pixelReturn: { output: unknown; additionalOutput?: unknown }[],
	errors: string[] = [],
) =>
	({
		errors: errors,
		insightId: "insight-1",
		pixelReturn: pixelReturn,
	}) as unknown as Awaited<ReturnType<typeof runPixel>>;

beforeEach(() => {
	mockRunPixel.mockReset();
});

describe("reloadApp", () => {
	it("reloads the app's python files and returns what the backend reported", async () => {
		mockRunPixel.mockResolvedValue(
			answer([
				{
					output: true,
					additionalOutput: [
						{
							output: "Reloaded the python files. Cleared 3 cached modules.",
							operationType: ["SUCCESS"],
						},
					],
				},
			]),
		);

		await expect(reloadApp("app-1", "insight-1")).resolves.toEqual({
			success: ["Reloaded the python files. Cleared 3 cached modules."],
			warnings: [],
		});
		expect(mockRunPixel).toHaveBeenCalledWith(
			'ReloadProject(project=["app-1"]);',
			"insight-1",
		);
	});

	it("fails when the backend refuses the reload", async () => {
		mockRunPixel.mockResolvedValue(
			answer([], ["Project does not exist or user does not have access"]),
		);

		await expect(reloadApp("app-1")).rejects.toThrow(
			"Project does not exist or user does not have access",
		);
	});
});

describe("getProjectInfo", () => {
	it("reads an app's details", async () => {
		mockRunPixel.mockResolvedValue(
			answer([{ output: { project_type: "BLOCKS" } }]),
		);

		await expect(getProjectInfo("insight-1", "app-1")).resolves.toEqual({
			project_type: "BLOCKS",
		});
		expect(mockRunPixel).toHaveBeenCalledWith(
			'ProjectInfo(project=["app-1"]);',
			"insight-1",
		);
	});

	it("throws the backend's errors", async () => {
		mockRunPixel.mockResolvedValue(answer([], ["No access"]));

		await expect(getProjectInfo("insight-1", "app-1")).rejects.toThrow(
			"No access",
		);
	});
});

describe("isPortalPublished", () => {
	beforeEach(() => {
		mockGetText.mockReset();
		Env.update({ MODULE: "/Monolith" });
	});

	it("reads the app's portal page", async () => {
		mockGetText.mockResolvedValue(page("<html></html>"));

		await expect(isPortalPublished("app-1")).resolves.toBe(true);
		expect(mockGetText).toHaveBeenCalledWith(
			"/Monolith/public_home/app-1/portals/",
		);
	});

	it("is false for the backend's unpublished page, an empty page, and a failed read", async () => {
		mockGetText.mockResolvedValueOnce(
			page(
				"Publish is not enabled on this project or there was an error publishing this project",
			),
		);
		await expect(isPortalPublished("app-1")).resolves.toBe(false);

		mockGetText.mockResolvedValueOnce(page(""));
		await expect(isPortalPublished("app-1")).resolves.toBe(false);

		mockGetText.mockRejectedValueOnce(
			new Error("Request failed with status 404"),
		);
		await expect(isPortalPublished("app-1")).resolves.toBe(false);
	});
});
