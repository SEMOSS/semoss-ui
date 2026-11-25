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
	/** The insight whose folder is searched for the template */
	insightId?: string;
	/** Panel type of the inspector, which stays in view while picking */
	inspectorPanelType: string;
	layout: PickPptxShapesLayout;
}

/**
 * Opens a TemplatePPTX step's template for shape picking: the PPTX becomes the
 * active main tab, the inspector the open right panel, and the left and bottom
 * borders collapse so only those two stay in view.
 *
 * @return A function taking the step's template path. It shows an error toast
 * and leaves the layout alone when the template cannot be found.
 */
export function usePickPptxShapes({
	appId,
	insightId,
	inspectorPanelType,
	layout,
}: UsePickPptxShapesOptions): (templateFile: string) => Promise<void> {
	return useCallback(
		async (templateFile: string) => {
			const template = await findPptxTemplateFile(
				appId,
				insightId,
				templateFile,
			);
			if (!template) {
				toast.error(
					"Could not find the template in the project assets or insight files.",
				);
				return;
			}
			const mode =
				template.source === "insight" && insightId
					? { type: "INSIGHT" as const, insightId }
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
		[appId, insightId, inspectorPanelType, layout],
	);
}
