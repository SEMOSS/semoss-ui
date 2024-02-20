import { BlockConfig } from '@/stores';

import { ProgressBlockDef, ProgressBlock } from './ProgressBlock';
import { BlurLinear } from '@mui/icons-material';
import { BLOCK_TYPE_CHART } from '../block-defaults.constants';
import {
    InputSettings,
    SelectInputSettings,
    SizeSettings,
} from '@/components/block-settings';
import { SwitchSettings } from '@/components/block-settings/shared/SwitchSettings';

// export the config for the block
export const config: BlockConfig<ProgressBlockDef> = {
    widget: 'progress',
    type: BLOCK_TYPE_CHART,
    data: {
        type: 'linear',
        value: 50,
        includeLabel: true,
        size: '300px',
    },
    listeners: {},
    slots: {},
    render: ProgressBlock,
    icon: BlurLinear,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Type',
                    render: ({ id }) => {
                        return (
                            <SelectInputSettings
                                id={id}
                                path="type"
                                label="Type"
                                resizeOnSet
                                options={[
                                    {
                                        value: 'linear',
                                        display: 'linear',
                                    },
                                    {
                                        value: 'circular',
                                        display: 'circular',
                                    },
                                ]}
                            />
                        );
                    },
                },
                {
                    description: 'Value',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Value"
                            path="value"
                            type="value"
                        />
                    ),
                },
                {
                    description: 'Include Label',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Include Label"
                            path="includeLabel"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        {
            name: 'Dimensions',
            children: [
                {
                    description: 'Size',
                    render: ({ id }) => (
                        <SizeSettings id={id} label="Size" path="size" />
                    ),
                },
            ],
        },
    ],
};
