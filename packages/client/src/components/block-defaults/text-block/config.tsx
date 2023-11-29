import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';
import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildStyleSection,
    buildTypographySection,
} from '../block-defaults.shared';
import { TextAlignSettings } from '@/components/block-settings/TextAlignSettings';
import { TextBlockDef, TextBlock } from './TextBlock';
import { TextFields } from '@mui/icons-material';
import { BLOCK_TYPE_DISPLAY } from '../block-defaults.constants';

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
    menu: [
        {
            name: 'Content',
            children: [
                {
                    description: 'Text',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Text" path="text" />
                    ),
                },
            ],
        },
        buildTypographySection(),
        {
            name: 'Layout',
            children: [
                {
                    description: 'Text Align',
                    render: ({ id }) => (
                        <TextAlignSettings id={id} path="style.textAlign" />
                    ),
                },
            ],
        },
        buildSpacingSection(),
        buildDimensionsSection(),
        buildStyleSection(),
    ],
};
