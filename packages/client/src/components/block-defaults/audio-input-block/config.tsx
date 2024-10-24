import { CSSProperties } from 'react';
import { BlockConfig } from '@/stores';
import {
    SelectInputSettings,
    QuerySelectionSettings,
} from '@/components/block-settings';
import { buildDimensionsSection } from '../block-defaults.shared';

import { AudioInputBlockDef, AudioInputBlock } from './AudioInputBlock';
import { KeyboardVoice } from '@mui/icons-material';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';

export const DefaultStyles: CSSProperties = {};

// export the config for the block
export const config: BlockConfig<AudioInputBlockDef> = {
    widget: 'audio-input',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: DefaultStyles,
        label: 'Submit',
        loading: false,
        disabled: false,
        variant: 'contained',
        color: 'primary',
        value: '',
    },
    listeners: {
        onClick: [],
    },
    slots: {},
    render: AudioInputBlock,
    icon: KeyboardVoice,
    contentMenu: [
        {
            name: 'General',
            children: [
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
                    description: 'Variant',
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            label="Variant"
                            path="variant"
                            options={[
                                {
                                    value: 'contained',
                                    display: 'contained',
                                },
                                {
                                    value: 'outlined',
                                    display: 'outlined',
                                },
                                {
                                    value: 'text',
                                    display: 'text',
                                },
                            ]}
                            resizeOnSet
                        />
                    ),
                },
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
                                {
                                    value: 'success',
                                    display: 'success',
                                },
                                {
                                    value: 'warning',
                                    display: 'warning',
                                },
                                {
                                    value: 'error',
                                    display: 'error',
                                },
                            ]}
                        />
                    ),
                },
            ],
        },
        buildDimensionsSection(),
    ],
};
