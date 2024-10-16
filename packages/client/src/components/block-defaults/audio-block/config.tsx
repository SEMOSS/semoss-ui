import { CSSProperties } from 'react';
import { BlockConfig } from '@/stores';
import { InputSettings, QueryInputSettings } from '@/components/block-settings';

import { AudioBlockDef, AudioBlock } from './AudioBlock';
import HeadsetIcon from '@mui/icons-material/Headset';
import { BLOCK_TYPE_ACTION } from '../block-defaults.constants';
import { SwitchSettings } from '@/components/block-settings/shared/SwitchSettings';

export const DefaultStyles: CSSProperties = {};

// export the config for the block
export const config: BlockConfig<AudioBlockDef> = {
    widget: 'audio-player',
    type: BLOCK_TYPE_ACTION,
    data: {
        label: 'Audio Player',
        autoplay: false,
        controls: true,
        loop: false,
        source: '',
    },
    listeners: {
        onClick: [],
    },
    slots: {},
    render: AudioBlock,
    icon: HeadsetIcon,
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
                    description: 'Audio URL',
                    render: ({ id }) => (
                        <QueryInputSettings
                            id={id}
                            label="Audio URL"
                            path="source"
                        />
                    ),
                },
                {
                    description: 'Autoplay',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Enable Autoplay"
                            path="autoplay"
                            description="This setting will enable autoplay of the audio"
                        />
                    ),
                },
                {
                    description: 'Controls',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Enable controls"
                            path="controls"
                            description="This setting will enable controls like pause, play, volume-control on the audio player"
                        />
                    ),
                },
                {
                    description: 'Loop',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Enable loop"
                            path="loop"
                            description="This setting will play the audio in a loop"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [],
};
