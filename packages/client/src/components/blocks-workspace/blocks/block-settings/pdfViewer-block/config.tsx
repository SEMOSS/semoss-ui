import { FileText } from "lucide-react";
import { PDFViewerSettings } from "../../settings/shared/PDFViewerSettings";
import {
	buildDimensionsSection,
	buildListener,
	buildShowField,
	buildSpacingSection,
} from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

export const config: BlockSettingsConfig = {
	type: "display",
	icon: FileText,
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Files",
					render: ({ id }) => (
						<PDFViewerSettings path="selectedPdf" id={id} />
					),
				},
			],
		},
		{
			name: "Conditional",
			children: [...buildShowField()],
		},
		{
			name: "Pre Process",
			children: [...buildListener("preProcess")],
		},
	],
	styleMenu: [buildDimensionsSection(), buildSpacingSection()],
};
