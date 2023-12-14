import { BlockConfig } from '@/stores';
import {
    AutocompleteQuerySettings,
    InputSettings,
} from '@/components/block-settings';

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
                    description: 'Test Setting',
                    render: ({ id }) => (
                        <AutocompleteQuerySettings
                            id={id}
                            label="Test Setting"
                            path="test-setting"
                        />
                    ),
                },
                // {
                //     description: 'Test Setting 2',
                //     render: ({ id }) => (
                //         <AutocompleteQuerySettings
                //             id={id}
                //             label="Test Setting 2"
                //             path="test-setting-2"
                //         />
                //     ),
                // },
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
                        <InputSettings
                            id={id}
                            label="Required"
                            path="required"
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
        buildColorSection(),
        buildBorderSection(),
        buildTypographySection(),
    ],
};
