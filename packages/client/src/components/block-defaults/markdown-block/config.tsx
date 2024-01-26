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
import { InputModalSettings } from '@/components/block-settings/shared/InputModalSettings';

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
    isBlocksMenuEnabled: true,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Markdown',
                    render: ({ id }) => (
                        <InputModalSettings
                            id={id}
                            label="Markdown"
                            path="markdown"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [buildTypographySection(), buildTextAlignSection()],
};
