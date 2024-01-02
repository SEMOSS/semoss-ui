import { BlockConfig } from '@/stores';
import { buildDimensionsSection } from '../block-defaults.shared';
import { ImageBlockDef, ImageBlock } from './ImageBlock';
import {
    PanoramaOutlined,
    AlignHorizontalLeft,
    AlignHorizontalCenter,
    AlignHorizontalRight,
    ArrowUpward,
    ArrowBack,
    ArrowForward,
    ArrowDownward,
    FilterCenterFocus,
} from '@mui/icons-material';
import { BLOCK_TYPE_DISPLAY } from '../block-defaults.constants';
import { BorderSettings, InputSettings } from '@/components/block-settings';
import { ButtonGroupSettings } from '../../block-settings/shared/ButtonGroupSettings';
import { SizeSettings } from '../../block-settings/shared/SizeSettings';
import { SelectInputSettings } from '../../block-settings/shared/SelectInputSettings';

// export the config for the block
export const config: BlockConfig<ImageBlockDef> = {
    widget: 'image',
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: {},
        src: '',
        title: '',
        disabled: false,
    },
    listeners: {},
    slots: {
        test: [],
    },
    render: ImageBlock,
    icon: PanoramaOutlined,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'External Image Source',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Image Source"
                            path="src"
                        />
                    ),
                },
                {
                    description: 'Image Description (optional)',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Description"
                            path="title"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        buildDimensionsSection(),
        {
            name: 'Image Position',
            children: [
                {
                    description: 'Horizontal Alignment',
                    render: ({ id }) => (
                        <ButtonGroupSettings
                            id={id}
                            path="style.justifyContent"
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
                    description: 'Cropped Position',
                    render: ({ id }) => (
                        <ButtonGroupSettings
                            id={id}
                            path="style.backgroundPosition"
                            label="Cropped Position"
                            options={[
                                {
                                    value: 'center',
                                    icon: FilterCenterFocus,
                                    title: 'Center Image',
                                    isDefault: true,
                                },
                                {
                                    value: 'top',
                                    icon: ArrowDownward,
                                    title: 'Top Edge',
                                    isDefault: false,
                                },
                                {
                                    value: 'right',
                                    icon: ArrowBack,
                                    title: 'Right Edge',
                                    isDefault: false,
                                },
                                {
                                    value: 'bottom',
                                    icon: ArrowUpward,
                                    title: 'Bottom Edge',
                                    isDefault: false,
                                },
                                {
                                    value: 'left',
                                    icon: ArrowForward,
                                    title: 'Left Edge',
                                    isDefault: false,
                                },
                            ]}
                        />
                    ),
                },
                {
                    description: 'Margin',
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            path="style.margin"
                            label="Margin"
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
        {
            name: 'Border',
            children: [
                {
                    description: 'Border Radius',
                    render: ({ id }) => (
                        <SizeSettings
                            id={id}
                            label="Border Radius"
                            path="style.borderRadius"
                        />
                    ),
                },
                {
                    description: 'Border',
                    render: ({ id }) => (
                        <BorderSettings id={id} path="style.border" />
                    ),
                },
            ],
        },
    ],
};