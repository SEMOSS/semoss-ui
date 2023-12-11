import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildColorSection,
    buildTypographySection,
    buildBorderSection,
} from '../block-defaults.shared';

import { InputBlockDef, InputBlock } from './InputBlock';
import { SettingsInputComponent } from '@mui/icons-material';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';

// export the config for the block
export const config: BlockConfig<InputBlockDef> = {
    widget: 'input',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {},
        disabled: false,
        required: false,
        value: '',
    },
    listeners: {
        onChange: [],
    },
    slots: {
        content: [],
    },
    render: InputBlock,
    icon: SettingsInputComponent,
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
                    description: 'Disabled',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Disabled"
                            path="disabled"
                        />
                    ),
                },
                {
                    description: 'Required',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Value" path="required" />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildColorSection(),
        buildBorderSection(),
        buildTypographySection(),
    ],
};
