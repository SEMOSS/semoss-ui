import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildStyleSection,
    buildTypographySection,
} from '../block-defaults.shared';

import { InputBlockDef, InputBlock } from './InputBlock';

// export the config for the block
export const config: BlockConfig<InputBlockDef> = {
    widget: 'input',
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
    menu: [
        {
            name: 'Input',
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
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildStyleSection(),
        buildTypographySection(),
    ],
};
