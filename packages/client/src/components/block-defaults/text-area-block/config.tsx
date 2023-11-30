import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';

import { TextAreaBlockDef, TextAreaBlock } from './TextAreaBlock';
import { FormatShapes } from '@mui/icons-material';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';
import {
    buildTypographySection,
    buildTextAlignSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildStyleSection,
} from '../block-defaults.shared';

// export the config for the block
export const config: BlockConfig<TextAreaBlockDef> = {
    widget: 'text-area',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {
            width: '100%',
            padding: '8px',
        },
        value: '',
        label: 'Example Input',
        multiline: false,
        rows: 4,
        type: '',
    },
    listeners: {
        onChange: [],
    },
    slots: {
        content: [],
    },
    render: TextAreaBlock,
    icon: FormatShapes,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Value',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Value" path="value" />
                    ),
                },
                {
                    description: 'Label',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Label" path="label" />
                    ),
                },
                {
                    description: 'Rows',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Rows" path="rows" />
                    ),
                },
                {
                    description: 'Multiline',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Multiline"
                            path="multiline"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        buildTypographySection(),
        buildTextAlignSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildStyleSection(),
    ],
};
