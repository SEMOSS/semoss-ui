import { BlockConfig } from '@/stores';
import {
    buildSpacingSection,
    buildDimensionsSection,
    buildColorSection,
    buildTypographySection,
    buildTextAlignSection,
    buildBorderSection,
} from '../block-defaults.shared';

import { MarkdownBlockDef, MarkdownBlock } from './MarkdownBlock';
import { FormatListBulleted } from '@mui/icons-material';
import { BLOCK_TYPE_DISPLAY } from '../block-defaults.constants';
import { SwitchSettings } from '@/components/block-settings/shared/SwitchSettings';
import { QueryInputSettings } from '@/components/block-settings';

// export the config for the block
export const config: BlockConfig<MarkdownBlockDef> = {
    widget: 'markdown',
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: {
            padding: '4px',
        },
        markdown: '**Hello world**',
        isStreaming: false,
    },
    listeners: {},
    slots: {},
    render: MarkdownBlock,
    icon: FormatListBulleted,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Markdown',
                    render: ({ id }) => (
                        <QueryInputSettings
                            id={id}
                            label="Markdown"
                            path="markdown"
                        />
                    ),
                },
                {
                    description: 'Enable Typewriting Effect',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Enable Typewriting Effect"
                            path="isStreaming"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [buildTypographySection(), buildTextAlignSection()],
};
