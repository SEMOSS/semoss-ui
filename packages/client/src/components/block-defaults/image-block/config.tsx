import { BlockConfig } from '@/stores';
import { buildDimensionsSection } from '../block-defaults.shared';
import { ImageBlockDef, ImageBlock } from './ImageBlock';
import { PanoramaOutlined } from '@mui/icons-material';
import { BLOCK_TYPE_DISPLAY } from '../block-defaults.constants';
import { InputSettings } from '@/components/block-settings';
import { ButtonGroupSettings, SelectInputSettings } from '../../block-settings';
import { AspectRatio, FitScreen, ImageAspectRatio } from '@mui/icons-material';
// export the config for the block
export const config: BlockConfig<ImageBlockDef> = {
    widget: 'image',
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '200px',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center',
        },
        src: '',
        title: '',
    },
    listeners: {},
    slots: {},
    render: ImageBlock,
    icon: PanoramaOutlined,
    isBlocksMenuEnabled: true,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Image Source',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Image URL" path="src" />
                    ),
                },
                {
                    description: 'Description',
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
        {
            name: '',
            children: [
                {
                    description: 'Ratio',
                    render: ({ id }) => (
                        <ButtonGroupSettings
                            id={id}
                            path="style.backgroundSize"
                            label="Ratio"
                            options={[
                                {
                                    value: '100% 100%',
                                    icon: FitScreen,
                                    title: 'fit',
                                    isDefault: false,
                                },
                                {
                                    value: 'cover',
                                    icon: AspectRatio,
                                    title: 'cover',
                                    isDefault: false,
                                },
                                {
                                    value: 'contain',
                                    icon: ImageAspectRatio,
                                    title: 'contain',
                                    isDefault: true,
                                },
                            ]}
                        />
                    ),
                },
                {
                    description: 'Position',
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            path="style.backgroundPosition"
                            label="Position"
                            allowUnset
                            allowCustomInput
                            options={[
                                {
                                    value: 'top left',
                                    display: 'Top left',
                                },
                                {
                                    value: 'top center',
                                    display: 'Top Center',
                                },
                                {
                                    value: 'top right',
                                    display: 'Top Right',
                                },
                                {
                                    value: 'center left',
                                    display: 'Center Left',
                                },
                                {
                                    value: 'center center',
                                    display: 'Center',
                                },
                                {
                                    value: 'center right',
                                    display: 'Center Right',
                                },
                                {
                                    value: 'bottom left',
                                    display: 'Bottom Left',
                                },
                                {
                                    value: 'bottom center',
                                    display: 'Bottom Center',
                                },
                                {
                                    value: 'bottom right',
                                    display: 'Bottom Right',
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
