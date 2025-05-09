import { PictureAsPdf } from "@mui/icons-material";

import { BlockConfig } from "../../../store";
import { PDFViewerBlock, PDFViewerBlockDef } from "./PDFViewerBlock";
import { PDFViewerSettings } from "../../block-settings/shared/PDFViewerSettings";
import { buildShowField, buildListener } from "../block-defaults.shared";

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
