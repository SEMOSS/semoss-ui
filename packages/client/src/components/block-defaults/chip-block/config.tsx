/* eslint-disable react/jsx-no-undef */
import { BlockConfig } from '@/stores';
import {
    buildDimensionsSection,
    buildListener,
} from '../block-defaults.shared';
import { ChipBlockDef, ChipBlock } from './ChipBlock';
import { BLOCK_TYPE_DISPLAY } from '../block-defaults.constants';
import { InputSettings, SelectInputSettings } from '../../block-settings';
import { ChipSettings } from '../../block-settings/custom/ChipSettings';
import { Face } from '@mui/icons-material';

export const config: BlockConfig<ChipBlockDef> = {
    widget: 'chip',
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '200px',
        },
        color: 'primary',
        size: 'small',
        icon: <Face />,
        type: 'chip',
        variant: 'filled',
        label: '',
        src: '',
        title: '',
    },
    listeners: {
        //onClick: [],
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
                                    value: 'Chip',
                                    display: 'Chip',
                                },
                                {
                                    value: 'Click',
                                    display: 'Click',
                                },
                                {
                                    value: 'Delete',
                                    display: 'Delete',
                                },
                                {
                                    value: 'Link',
                                    display: 'Link',
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
                            ]}
                        />
                    ),
                },
                {
                    description: 'Size',
                    render: ({ id }) => (
                        <ChipSettings
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
