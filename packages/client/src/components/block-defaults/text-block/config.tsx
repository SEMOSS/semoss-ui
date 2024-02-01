import { CSSProperties } from 'react';
import { BlockConfig } from '@/stores';
import {
    buildTypographySection,
    buildTextAlignSection,
} from '../block-defaults.shared';
import { TextBlockDef, TextBlock } from './TextBlock';
import { TextFields } from '@mui/icons-material';
import { BLOCK_TYPE_DISPLAY } from '../block-defaults.constants';
import { QueryInputSettings } from '@/components/block-settings';

export const DefaultStyles: CSSProperties = {
    padding: '4px',
    whiteSpace: 'pre-line',
    textOverflow: 'ellipsis',
    overflow: 'auto',
};

// export the config for the block
export const config: BlockConfig<TextBlockDef> = {
    widget: 'text',
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: DefaultStyles,
        text: 'Hello world',
    },
    listeners: {},
    slots: {
        test: [],
    },
    render: TextBlock,
    icon: TextFields,
    isBlocksMenuEnabled: true,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Text',
                    render: ({ id }) => (
                        <QueryInputSettings id={id} label="Text" path="text" />
                    ),
                },
            ],
        },
    ],
    styleMenu: [buildTypographySection(), buildTextAlignSection()],
};
