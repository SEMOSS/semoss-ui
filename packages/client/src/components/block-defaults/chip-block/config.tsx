/* eslint-disable react/jsx-no-undef */
import { BlockConfig } from '@/stores';
import {
    buildDimensionsSection,
    buildListener,
} from '../block-defaults.shared';
import { CSSProperties } from 'react';
import { ChipBlockDef, ChipBlock } from './ChipBlock';
import { BLOCK_TYPE_DISPLAY } from '../block-defaults.constants';
import {
    InputSettings,
    SelectInputSettings,
    SwitchSettings,
} from '../../block-settings';

import { ChipSettings } from '../../block-settings/custom/ChipSettings';
import { Face } from '@mui/icons-material';

export const DefaultStyles: CSSProperties = {};

export const config: BlockConfig<ChipBlockDef> = {
    widget: 'chip',
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: DefaultStyles,
        color: 'default',
        size: 'small',
        icon: <Face />,
        type: 'chip',
        //variant: 'filled',
        label: '',
        src: '',
        title: '',
    },
    listeners: {
        onClick: [],
    },
    slots: {},
    render: ChipBlock,

    contentMenu: [
        {
            name: 'Select Chip',
            children: [
                {
                    description: ' Chip Type',
                    render: ({ id }) => (
                        <ChipSettings
                            id={id}
                            label="Type"
                            path="type"
                            options={[
                                {
                                    value: 'Chip', //default
                                    display: 'Chip',
                                },
                                {
                                    value: 'Delete', //onDelete={}
                                    display: 'Deleteable Chip',
                                },
                                {
                                    value: 'Link', //component = "a" href = " " clickable
                                    display: 'Link Chip',
                                },
                            ]}
                        />
                    ),
                },
                {
                    description: 'Label',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Label" path="label" />
                    ),
                },
                {
                    description: 'clickable',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label={'Clickable'}
                            path={'clickable'}
                        />
                    ),
                },
            ],
        },
        {
            name: 'on Click',
            children: [...buildListener('onClick')],
        },
    ],
    styleMenu: [
        {
            name: '',
            children: [
                {
                    description: 'Variant',
                    render: ({ id }) => (
                        <ChipSettings
                            id={id}
                            label="Variant"
                            path="variant"
                            options={[
                                {
                                    value: 'filled',
                                    display: 'filled',
                                },
                                {
                                    value: 'outlined',
                                    display: 'outlined',
                                },
                            ]}
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
                                    value: 'default',
                                    display: 'default',
                                },
                                {
                                    value: 'pink',
                                    display: 'pink',
                                },
                                {
                                    value: 'green',
                                    display: 'green',
                                },
                                {
                                    value: 'purple',
                                    display: 'purple',
                                },
                                {
                                    value: 'indigo',
                                    display: 'indigo',
                                },
                                {
                                    value: 'turqoise',
                                    display: 'turqoise',
                                },
                                {
                                    value: 'lcgreen',
                                    display: 'lcgreen',
                                },
                                {
                                    value: 'lcpink',
                                    display: 'lcpink',
                                },
                                {
                                    value: 'lcpurple',
                                    display: 'lcpurple',
                                },
                                {
                                    value: 'lcindigo',
                                    display: 'lcindigo',
                                },
                                {
                                    value: 'lcprimary',
                                    display: 'lcprimary',
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
                            ]}
                        />
                    ),
                },
            ],
        },
        buildDimensionsSection(),
    ],
    icon: undefined,
};
