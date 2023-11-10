import { BlockConfig } from '@/stores';
import {
    InputSettings,
    InputFromValuesSettings,
    InputValuesSettings,
} from '@/components/block-settings';

import { SelectBlockDef, SelectBlock } from './SelectBlock';
import { ViewList } from '@mui/icons-material';

import { buildSpacingSection } from '../block-defaults.shared';

// export the config for the block
export const config: BlockConfig<SelectBlockDef> = {
    widget: 'select',
    data: {
        style: {},
        value: '',
        label: 'Example Select Input',
        options: [],
    },
    listeners: {
        onChange: [],
    },
    slots: {
        content: [],
    },
    render: SelectBlock,
    icon: ViewList,
    menu: [
        {
            name: 'Select',
            children: [
                {
                    description: 'Value',
                    render: ({ id }) => (
                        <InputFromValuesSettings
                            id={id}
                            label="Value"
                            path="value"
                        />
                    ),
                },
                {
                    description: 'Label',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Label" path="label" />
                    ),
                },
                {
                    description: 'Options',
                    render: ({ id }) => {
                        return (
                            <InputValuesSettings
                                id={id}
                                label="Options"
                                path="options"
                            />
                        );
                    },
                },
            ],
        },
        buildSpacingSection(),
    ],
};
