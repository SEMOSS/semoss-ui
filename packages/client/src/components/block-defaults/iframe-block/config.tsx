import { BlockConfig } from '@/stores';
import {
    buildSpacingSection,
    buildDimensionsSection,
} from '../block-defaults.shared';
import { IframeBlockDef, IframeBlock } from './IframeBlock';
import { AspectRatio } from '@mui/icons-material';
import { BLOCK_TYPE_DISPLAY } from '../block-defaults.constants';
import { InputModalSettings } from '@/components/block-settings/shared/InputModalSettings';
import { BorderSettings, InputSettings } from '@/components/block-settings';
import { SwitchSettings } from '@/components/block-settings/shared/SwitchSettings';

// export the config for the block
export const config: BlockConfig<IframeBlockDef> = {
    widget: 'iframe',
    type: BLOCK_TYPE_DISPLAY,
    data: {
        style: {},
        src: '',
        title: '',
        enableFrameInteractions: true,
    },
    listeners: {},
    slots: {},
    render: IframeBlock,
    icon: AspectRatio,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Source',
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
                    description: 'Title',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Title" path="title" />
                    ),
                },
                {
                    description: 'Frame Interaction',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Frame Interaction"
                            path="enableFrameInteractions"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
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
