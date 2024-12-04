import { CSSProperties } from 'react';
import { BlockConfig } from '@/stores';
import {
    QuerySelectionSettings,
    SelectInputSettings,
    OptionsSettings,
} from '@/components/block-settings';

import { ToggleButtonBlockDef, ToggleButtonBlock } from './ToggleButtonBlock';
import { SmartButton } from '@mui/icons-material';
import { buildListener } from '../block-defaults.shared';
import { BLOCK_TYPE_ACTION } from '../block-defaults.constants';
import { SwitchSettings } from '@/components/block-settings/shared/SwitchSettings';

export const DefaultStyles: CSSProperties = {};

// export the config for the block
export const config: BlockConfig<ToggleButtonBlockDef> = {
    widget: 'toggle-button',
    type: BLOCK_TYPE_ACTION,
    data: {
        disabled: false,
        color: 'primary',
        size: 'small',
        options: [
            {
                display: 'on',
                value: 'on',
            },
            {
                display: 'off',
                value: 'off',
            },
        ],
        value: null,
        mandatory: true,
        multiple: false,
    },
    listeners: {
        onChange: [],
    },
    slots: {},
    render: ToggleButtonBlock,
    icon: SmartButton,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Options',
                    render: ({ id }) => (
                        <OptionsSettings id={id} path="options" />
                    ),
                },
                {
                    description: 'Mandatory',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Mandatory"
                            path="mandatory"
                        />
                    ),
                },
                {
                    description: 'Multiple',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Multiple"
                            path="multiple"
                            resetValueOnChange
                        />
                    ),
                },
            ],
        },
        {
            name: 'on Change',
            children: [...buildListener('onChange')],
        },
    ],
    styleMenu: [
        {
            name: 'Style',
            children: [
                {
                    description: 'Color',
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            label="Color"
                            path="color"
                            options={[
                                {
                                    value: 'primary',
                                    display: 'primary',
                                },
                                {
                                    value: 'secondary',
                                    display: 'secondary',
                                },
                            ]}
                        />
                    ),
                },
                {
                    description: 'Size',
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            label="Size"
                            path="size"
                            options={[
                                {
                                    value: 'small',
                                    display: 'small',
                                },
                                {
                                    value: 'medium',
                                    display: 'medium',
                                },
                                {
                                    value: 'large',
                                    display: 'large',
                                },
                            ]}
                        />
                    ),
                },
            ],
        },
    ],
};
