import { PictureAsPdf } from "@mui/icons-material";
import { PDFViewerSettings } from "../../settings/shared/PDFViewerSettings";
import { buildListener, buildShowField } from "../block-defaults.shared";
import type { BlockSettingsConfig } from "../settings.types";

export const config: BlockSettingsConfig = {
	type: "display",
	icon: PictureAsPdf,
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
};
