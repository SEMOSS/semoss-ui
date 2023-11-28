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

// export the config for the block
export const config: BlockConfig<MarkdownBlockDef> = {
    widget: 'markdown',
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
    menu: [
        {
            name: 'Content',
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
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildStyleSection(),
        buildTypographySection(),
    ],
};
