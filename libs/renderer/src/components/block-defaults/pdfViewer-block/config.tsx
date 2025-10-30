import type { BlockConfig } from "../../../store";
import { PDFViewerBlock, type PDFViewerBlockDef } from "./PDFViewerBlock";

export const config: BlockConfig<PDFViewerBlockDef> = {
	widget: "pdfViewer",
	type: "display",
	data: {
		style: {
			width: "100%",
			height: "auto",
			padding: "8px",
		},
		selectedPdf: null,
		engineId: "",
		show: "true",
	},
	listeners: {
		preProcess: {
			type: "sync",
			order: [],
		},
	},
	slots: {},
	render: PDFViewerBlock,
};
