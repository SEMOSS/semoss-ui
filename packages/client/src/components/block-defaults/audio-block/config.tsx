import { BlockConfig } from '@/stores';
import {
    buildDimensionsSection,
    buildTypographySection,
} from '../block-defaults.shared';
import { AudioBlockDef, AudioBlock } from './AudioBlock';
import { AudioFileRounded } from '@mui/icons-material';
import { BLOCK_TYPE_DISPLAY } from '../block-defaults.constants';
import { BorderSettings } from '@/components/block-settings';
// export the config for the block
export const config: BlockConfig<AudioBlockDef> = {
    widget: 'audio',
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: {
            display: 'flex',
            justifyContent: 'left',
            alignItems: 'left',
            width: '100%',
            height: '60px',
        },
        src: '',
        title: '',
    },
    listeners: {},
    slots: {},
    render: AudioBlock,
    icon: AudioFileRounded,
    styleMenu: [
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
        buildDimensionsSection(),
    ],
};
