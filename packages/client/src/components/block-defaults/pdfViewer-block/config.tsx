import { BlockConfig } from '@/stores';
import { PDFViewerBlock, PDFViewerBlockDef } from './PDFViewerBlock';
import { PDFViewerSettings } from '@/components/block-settings';
import { PictureAsPdf } from '@mui/icons-material';

export const config: BlockConfig<PDFViewerBlockDef> = {
    widget: 'pdfViewer',
    type: 'display',
    data: {
        style: {
            width: '100%',
            height: 'auto',
            padding: '8px',
        },
        selectedPdf: null,
    },
    render: PDFViewerBlock,
    icon: PictureAsPdf,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Files',
                    render: ({ id }) => (
                        <PDFViewerSettings path="selectedPdf" id={id} />
                    ),
                },
            ],
        },
    ],
    listeners: {
        onClick: [],
    },
    slots: {},
};
