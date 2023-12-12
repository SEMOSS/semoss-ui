import { BlockConfig } from '@/stores';
import {
    ButtonGroupSettings,
    SelectInputSettings,
} from '@/components/block-settings';

import {
    buildSpacingSection,
    buildDimensionsSection,
    buildColorSection,
    buildTypographySection,
    buildBorderSection,
} from '../block-defaults.shared';

import { ContainerBlockDef, ContainerBlock } from './ContainerBlock';
import {
    AlignHorizontalCenter,
    AlignHorizontalLeft,
    AlignHorizontalRight,
    HighlightAlt,
    VerticalAlignBottom,
    VerticalAlignCenter,
    VerticalAlignTop,
} from '@mui/icons-material';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';

// export the config for the block
export const config: BlockConfig<ContainerBlockDef> = {
    widget: 'container',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {
            gap: '2rem',
        },
    },
    listeners: {},
    slots: {
        children: [],
    },
    render: ContainerBlock,
    icon: HighlightAlt,
    contentMenu: [],
    styleMenu: [
        {
            name: 'Layout', // switch vertical and horizontal align paths because of column wrap
            children: [
                {
                    description: 'Vertical Align',
                    render: ({ id }) => (
                        <ButtonGroupSettings
                            id={id}
                            path="style.justifyContent"
                            label="Vertical Align"
                            options={[
                                {
                                    value: 'start',
                                    icon: VerticalAlignTop,
                                    title: 'Top',
                                    isDefault: true,
                                },
                                {
                                    value: 'center',
                                    icon: VerticalAlignCenter,
                                    title: 'Center',
                                    isDefault: false,
                                },
                                {
                                    value: 'end',
                                    icon: VerticalAlignBottom,
                                    title: 'Bottom',
                                    isDefault: false,
                                },
                            ]}
                        />
                    ),
                },
                {
                    description: 'Horitzontal Align',
                    render: ({ id }) => (
                        <ButtonGroupSettings
                            id={id}
                            path="style.alignItems"
                            label="Horizontal Align"
                            options={[
                                {
                                    value: 'left',
                                    icon: AlignHorizontalLeft,
                                    title: 'Top',
                                    isDefault: true,
                                },
                                {
                                    value: 'center',
                                    icon: AlignHorizontalCenter,
                                    title: 'Center',
                                    isDefault: false,
                                },
                                {
                                    value: 'right',
                                    icon: AlignHorizontalRight,
                                    title: 'Right',
                                    isDefault: false,
                                },
                            ]}
                        />
                    ),
                },
                {
                    description: 'Gap',
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            path="style.gap"
                            label="Gap"
                            options={[
                                {
                                    value: '1rem',
                                    display: 'Small',
                                },
                                {
                                    value: '2rem',
                                    display: 'Medium',
                                },
                                {
                                    value: '3rem',
                                    display: 'Large',
                                },
                                {
                                    value: '4rem',
                                    display: 'X-Large',
                                },
                            ]}
                            allowUnset
                        />
                    ),
                },
            ],
        },
        buildSpacingSection(),
        buildDimensionsSection(),
        buildColorSection(),
        buildBorderSection(),
        buildTypographySection(),
    ],
};
