import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildColorSection,
    buildListener,
    buildBorderSection,
} from '../block-defaults.shared';

import { CheckboxBlockDef, CheckboxBlock } from './CheckboxBlock';
import { CheckBox } from '@mui/icons-material';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';

// export the config for the block
export const config: BlockConfig<CheckboxBlockDef> = {
    widget: 'checkbox',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {},
        label: 'Example Checkbox',
        required: false,
        disabled: false,
        value: false,
    },
    listeners: {
        onChange: [],
    },
    slots: {},
    render: CheckboxBlock,
    icon: CheckBox,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Label',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Label" path="label" />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        buildColorSection(),
        buildBorderSection(),
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
    ],
};
