import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findPptxTemplateFile } from "@semoss/automation";
import { toast } from "@semoss/ui/next";
import { WORKBENCH_COMPONENTS } from "@/stores/workbench/workbench.constants";
import {
	type PickPptxShapesLayout,
	usePickPptxShapes,
} from "./use-pick-pptx-shapes";

vi.mock("@semoss/automation", () => ({ findPptxTemplateFile: vi.fn() }));
vi.mock("@semoss/ui/next", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/ui/next")>()),
	toast: { error: vi.fn() },
}));

const INSPECTOR = "automation-inspector";
const PPTX_VIEWER = WORKBENCH_COMPONENTS.FILE_PPTX_VIEWER;

const layout = {
	selectPanel: vi.fn(),
	collapseBorder: vi.fn(),
} satisfies PickPptxShapesLayout;

const pickShapes = (insightId: string | null = "insight-1") =>
	renderHook(() =>
		usePickPptxShapes({
			appId: "app-1",
			insightId: insightId ?? undefined,
			inspectorPanelType: INSPECTOR,
			layout,
		}),
	).result.current;

describe("usePickPptxShapes", () => {
	beforeEach(() => vi.clearAllMocks());

	it("opens an insight template, collapses the other borders, then shows the inspector", async () => {
		vi.mocked(findPptxTemplateFile).mockResolvedValue({
			name: "a.pptx",
			path: "decks/a.pptx",
			source: "insight",
		});

		await pickShapes()("decks/a.pptx");

		expect(findPptxTemplateFile).toHaveBeenCalledWith(
			"app-1",
			"insight-1",
			"decks/a.pptx",
		);
		expect(layout.selectPanel).toHaveBeenNthCalledWith(
			1,
			PPTX_VIEWER,
			{
				mode: { type: "INSIGHT", insightId: "insight-1" },
				name: "a.pptx",
				path: "/decks/a.pptx",
			},
			{ name: "a.pptx" },
		);
		expect(layout.collapseBorder.mock.calls).toEqual([
			["left"],
			["bottom"],
		]);
		expect(layout.selectPanel).toHaveBeenNthCalledWith(2, INSPECTOR);
		expect(toast.error).not.toHaveBeenCalled();
	});

	it("opens a project template in the project's scope", async () => {
		vi.mocked(findPptxTemplateFile).mockResolvedValue({
			name: "a.pptx",
			path: "a.pptx",
			source: "project",
		});

		await pickShapes()("a.pptx");

		expect(layout.selectPanel).toHaveBeenNthCalledWith(
			1,
			PPTX_VIEWER,
			{
				mode: { type: "APP", app: "app-1" },
				name: "a.pptx",
				path: "/a.pptx",
			},
			{ name: "a.pptx" },
		);
	});

	it("falls back to the project scope when an insight template has no insight id", async () => {
		vi.mocked(findPptxTemplateFile).mockResolvedValue({
			name: "a.pptx",
			path: "a.pptx",
			source: "insight",
		});

		await pickShapes(null)("a.pptx");

		expect(layout.selectPanel).toHaveBeenNthCalledWith(
			1,
			PPTX_VIEWER,
			expect.objectContaining({ mode: { type: "APP", app: "app-1" } }),
			expect.anything(),
		);
	});

	it("shows an error and leaves the layout alone when the template is not found", async () => {
		vi.mocked(findPptxTemplateFile).mockResolvedValue(null);

		await pickShapes()("missing.pptx");

		expect(toast.error).toHaveBeenCalledOnce();
		expect(layout.selectPanel).not.toHaveBeenCalled();
		expect(layout.collapseBorder).not.toHaveBeenCalled();
	});
});
