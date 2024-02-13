import { CSSProperties } from 'react';
import { BlockConfig } from '@/stores';
import {
    QuerySelectionSettings,
    InputSettings,
    SelectInputSettings,
} from '@/components/block-settings';

import { ToggleButtonBlockDef, ToggleButtonBlock } from './ToggleButtonBlock';
import { SmartButton } from '@mui/icons-material';
import { BLOCK_TYPE_ACTION } from '../block-defaults.constants';

export const DefaultStyles: CSSProperties = {};

// export the config for the block
export const config: BlockConfig<ToggleButtonBlockDef> = {
    widget: 'toggle-button',
    type: BLOCK_TYPE_ACTION,
    data: {
        disabled: false,
        color: 'primary',
        size: 'medium',
        options: [],
        value: null,
        mandatory: false,
    },
    listeners: {},
    slots: {},
    render: ToggleButtonBlock,
    icon: SmartButton,
    isBlocksMenuEnabled: true,
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
                {
                    description: 'Loading',
                    render: ({ id }) => (
                        <QuerySelectionSettings
                            id={id}
                            label="Loading"
                            path="loading"
                            queryPath="isLoading"
                        />
                    ),
                },
            ],
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
            ],
        },
    ],
};
