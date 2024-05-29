import { BlockConfig } from '@/stores';
import {
    InputSettings,
    SelectInputSettings,
} from '@/components/block-settings';
import { SwitchSettings } from '@/components/block-settings/shared/SwitchSettings';
import { buildListener } from '../block-defaults.shared';
import { CheckboxBlockDef, CheckboxBlock } from './CheckboxBlock';
import { CheckBox } from '@mui/icons-material';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';

// export the config for the block
export const config: BlockConfig<CheckboxBlockDef> = {
    widget: 'checkbox',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {
            padding: 'none',
        },
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
                    description: 'Checked',
                    render: ({ id }) => (
                        <SwitchSettings id={id} label="Checked" path="value" />
                    ),
                },
            ],
        },
        {
            name: 'on Change',
            children: [...buildListener('onChange')],
        },
    ],
    styleMenu: [],
};
