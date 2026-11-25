import { createContext } from "react";

/** A shape-selection event stamped with a token so selecting the same shape
 *  twice fires the effect a second time. */
export interface PptxShapeSelection {
	shapeName: string;
	shapeType: string;
	/** Monotonically increasing; bumped on every selection event. */
	token: number;
}

interface PptxPickContextValue {
	/** The latest shape selected in an open PPTX panel. The TemplatePPTX form adds it as a
	 *  replacement while pick mode is on. */
	shapeSelection: PptxShapeSelection | null;
	/** Called when pick mode turns on, so a host that can show the template opens it for
	 *  shape selection. Absent when the host has no PPTX panel. */
	onPickShapes?: (templateFile: string) => void;
	/** The insight of the run whose persisted files are shown, searched for templates
	 *  alongside the project assets. Absent when no run is open. */
	runInsightId?: string;
}

/** Links the TemplatePPTX form to the host's PPTX panel. Without a provider the form
 *  still works, it just has no panel to pick shapes from. */
export const PptxPickContext = createContext<PptxPickContextValue>({
	shapeSelection: null,
});
