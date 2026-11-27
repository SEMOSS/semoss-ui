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

const pickShapes = (runInsightId?: string) =>
	renderHook(() =>
		usePickPptxShapes({
			appId: "app-1",
			runInsightId,
			inspectorPanelType: INSPECTOR,
			layout,
		}),
	).result.current;

describe("usePickPptxShapes", () => {
	beforeEach(() => vi.clearAllMocks());

	it("opens a run's template in the run's insight, collapses the other borders, then shows the inspector", async () => {
		vi.mocked(findPptxTemplateFile).mockResolvedValue({
			name: "a.pptx",
			path: "decks/a.pptx",
			source: "run",
		});

		await pickShapes("run-insight")("decks/a.pptx");

		expect(findPptxTemplateFile).toHaveBeenCalledWith(
			"app-1",
			"run-insight",
			"decks/a.pptx",
		);
		expect(layout.selectPanel).toHaveBeenNthCalledWith(
			1,
			PPTX_VIEWER,
			{
				mode: { type: "INSIGHT", insightId: "run-insight" },
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

	it("opens a project template in the project's scope even while a run is shown", async () => {
		vi.mocked(findPptxTemplateFile).mockResolvedValue({
			name: "a.pptx",
			path: "a.pptx",
			source: "project",
		});

		await pickShapes("run-insight")("a.pptx");

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

	it("shows an error and leaves the layout alone when the template is not found", async () => {
		vi.mocked(findPptxTemplateFile).mockResolvedValue(null);

		await pickShapes()("missing.pptx");

		expect(toast.error).toHaveBeenCalledOnce();
		expect(layout.selectPanel).not.toHaveBeenCalled();
		expect(layout.collapseBorder).not.toHaveBeenCalled();
	});
});
