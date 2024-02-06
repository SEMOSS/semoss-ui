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
        style: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '200px',
            height: '200px',
        },
        src: '',
        title: '',
    },
    listeners: {},
    slots: {
        test: [],
    },
    render: ImageBlock,
    icon: PanoramaOutlined,
    isBlocksMenuEnabled: true,
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
    styleMenu: [buildDimensionsSection()],
};
