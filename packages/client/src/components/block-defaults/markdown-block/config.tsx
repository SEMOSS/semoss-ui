import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';
import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildStyleSection,
    buildTypographySection,
} from '../block-defaults.shared';

import { MarkdownBlockDef, MarkdownBlock } from './Markdown';
import { FormatListBulleted } from '@mui/icons-material';
import { BLOCK_TYPE_DISPLAY } from '../block-defaults.constants';

// export the config for the block
export const config: BlockConfig<MarkdownBlockDef> = {
    widget: 'markdown',
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: {},
        markdown: '**Hello world**',
    },
    listeners: {},
    slots: {
        test: [],
    },
    render: MarkdownBlock,
    icon: FormatListBulleted,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Markdown',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Markdown"
                            path="markdown"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildStyleSection(),
        buildTypographySection(),
    ],
};
