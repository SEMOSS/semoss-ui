import { useCallback } from "react";
import { findPptxTemplateFile } from "@semoss/automation";
import { toast } from "@semoss/ui/next";
import { WORKBENCH_COMPONENTS } from "@/stores/workbench/workbench.constants";

/** The dock actions picking shapes needs, so tests can supply fakes. */
export interface PickPptxShapesLayout {
	selectPanel: (
		type: string,
		config?: Record<string, unknown>,
		opts?: { name?: string },
	) => unknown;
	collapseBorder: (side: "left" | "bottom") => void;
}

export interface UsePickPptxShapesOptions {
	/** The automation project */
	appId: string;
	/** The insight of the run whose files are searched for the template, if one is open */
	runInsightId?: string;
	/** Panel type of the inspector, which stays in view while picking */
	inspectorPanelType: string;
	layout: PickPptxShapesLayout;
}

/**
 * Opens a TemplatePPTX step's template for shape picking: the PPTX becomes the
 * active main tab, the inspector the open right panel, and the left and bottom
 * borders collapse so only those two stay in view. The template is looked up
 * in the shown run's files, then the project assets.
 *
 * @return A function taking the step's template path. It shows an error toast
 * and leaves the layout alone when the template cannot be found.
 */
export function usePickPptxShapes({
	appId,
	runInsightId,
	inspectorPanelType,
	layout,
}: UsePickPptxShapesOptions): (templateFile: string) => Promise<void> {
	return useCallback(
		async (templateFile: string) => {
			const template = await findPptxTemplateFile(
				appId,
				runInsightId,
				templateFile,
			);
			if (!template) {
				toast.error(
					"Could not find the template in the project assets or the selected run's files.",
				);
				return;
			}
			// A run template is only returned when a run insight was searched.
			const mode =
				template.source === "run" && runInsightId
					? { type: "INSIGHT" as const, insightId: runInsightId }
					: { type: "APP" as const, app: appId };
			layout.selectPanel(
				WORKBENCH_COMPONENTS.FILE_PPTX_VIEWER,
				{ mode, name: template.name, path: `/${template.path}` },
				{ name: template.name },
			);
			layout.collapseBorder("left");
			layout.collapseBorder("bottom");
			layout.selectPanel(inspectorPanelType);
		},
		[appId, runInsightId, inspectorPanelType, layout],
	);
}
