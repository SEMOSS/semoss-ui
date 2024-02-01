import { BlockConfig } from '@/stores';
import {
    InputSettings,
    SelectInputSettings,
} from '@/components/block-settings';

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
    isBlocksMenuEnabled: true,
    contentMenu: [],
    styleMenu: [],
};
