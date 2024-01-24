import { BlockConfig } from '@/stores';
import {
    buildSpacingSection,
    buildDimensionsSection,
    buildColorSection,
    buildTypographySection,
    buildTextAlignSection,
    buildBorderSection,
} from '../block-defaults.shared';
import { TextBlockDef, TextBlock } from './TextBlock';
import { TextFields } from '@mui/icons-material';
import { BLOCK_TYPE_DISPLAY } from '../block-defaults.constants';
import { InputModalSettings } from '@/components/block-settings/shared/InputModalSettings';

// export the config for the block
export const config: BlockConfig<TextBlockDef> = {
    widget: 'text',
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: {},
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
                        <InputModalSettings id={id} label="Text" path="text" />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        buildTypographySection(),
        buildTextAlignSection(),
        buildColorSection(),
        buildBorderSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
    ],
};
