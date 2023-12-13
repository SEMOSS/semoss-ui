import { BlockConfig } from '@/stores';
import {
    buildSpacingSection,
    buildDimensionsSection,
    buildLayoutSection,
} from '../block-defaults.shared';
import { ImageBlockDef, ImageBlock } from './ImageBlock';
import {
    PanoramaOutlined,
    AlignHorizontalLeft,
    AlignHorizontalCenter,
    AlignHorizontalRight,
} from '@mui/icons-material';
import { BLOCK_TYPE_DISPLAY } from '../block-defaults.constants';
import { InputModalSettings } from '@/components/block-settings/shared/InputModalSettings';
import { BorderSettings, InputSettings } from '@/components/block-settings';
// import { ButtonGroupSettings } from '../block-settings/shared/ButtonGroupSettings';
import { ButtonGroupSettings } from '../../block-settings/shared/ButtonGroupSettings';

// import { SwitchSettings } from '@/components/block-settings/shared/SwitchSettings';

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
                    description: 'Image Source',
                    render: ({ id }) => (
                        <InputModalSettings
                            id={id}
                            label="Source"
                            placeholder="https://www.example.com"
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
                {
                    description: 'Image Description (optional)',
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
            ],
        },
    ],
    styleMenu: [
        // buildLayoutSection(),
        buildDimensionsSection(),
        buildSpacingSection(),
        {
            name: 'Color',
            children: [
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
