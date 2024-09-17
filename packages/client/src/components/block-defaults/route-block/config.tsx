import { CSSProperties } from 'react';
import { BlockConfig } from '@/stores';
import {
    QuerySelectionSettings,
    InputSettings,
    SelectInputSettings,
} from '@/components/block-settings';

import {
    buildDimensionsSection,
    buildListener,
} from '../block-defaults.shared';

import { RouteBlockDef, RouteBlock } from './RouteBlock';
import { SmartButton } from '@mui/icons-material';
import { BLOCK_TYPE_ACTION } from '../block-defaults.constants';

export const DefaultStyles: CSSProperties = {};

// export the config for the block
export const config: BlockConfig<RouteBlockDef> = {
    widget: 'route',
    type: BLOCK_TYPE_ACTION,
    data: {
        style: DefaultStyles,
        label: 'Submit',
        loading: false,
        disabled: false,
        variant: 'contained',
        color: 'primary',
        linkTo: '/',
    },
    listeners: {
        onClick: [],
    },
    slots: {},
    render: RouteBlock,
    icon: SmartButton,
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
                {
                    description: 'Link To',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Link To" path="linkTo" />
                    ),
                },
            ],
        },
        // {
        //     name: 'on Click',
        //     children: [...buildListener('onClick')],
        // },
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
