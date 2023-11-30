import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';
import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildStyleSection,
    buildTypographySection,
} from '../block-defaults.shared';
import { TextBlockDef, TextBlock } from './TextBlock';
import {
    FormatAlignCenter,
    FormatAlignJustify,
    FormatAlignLeft,
    FormatAlignRight,
    TextFields,
} from '@mui/icons-material';
import { BLOCK_TYPE_DISPLAY } from '../block-defaults.constants';
import { ButtonGroupSettings } from '@/components/block-settings/ButtonGroupSettings';

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
                        <ButtonGroupSettings
                            id={id}
                            path="style.textAlign"
                            label="Text Align"
                            options={[
                                {
                                    value: 'left',
                                    icon: FormatAlignLeft,
                                    title: 'Left',
                                    isDefault: true,
                                },
                                {
                                    value: 'right',
                                    icon: FormatAlignRight,
                                    title: 'Right',
                                    isDefault: false,
                                },
                                {
                                    value: 'center',
                                    icon: FormatAlignCenter,
                                    title: 'Center',
                                    isDefault: false,
                                },
                                {
                                    value: 'justify',
                                    icon: FormatAlignJustify,
                                    title: 'Justify',
                                    isDefault: false,
                                },
                            ]}
                        />
                    ),
                },
            ],
        },
        buildSpacingSection(),
        buildDimensionsSection(),
        buildStyleSection(),
    ],
};
