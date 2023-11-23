import { BlockConfig } from '@/stores';
import {
    InputSettings,
    InputFromValuesSettings,
    InputValuesSettings,
} from '@/components/block-settings';

import { SelectBlockDef, SelectBlock } from './SelectBlock';
import { ViewList } from '@mui/icons-material';

import {
    buildDimensionsSection,
    buildSpacingSection,
} from '../block-defaults.shared';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';

export const config: BlockConfig<SelectBlockDef> = {
    widget: 'select',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {},
        type: [],
        label: '',
        options: [{ label: '', value: '' }],
        value: '',
    },
    listeners: {
        onChange: [],
    },
    slots: {},
    render: SelectBlock,
    icon: ViewList,
    menu: [
        {
            name: 'View LLM & Vector DB Settings',
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
        buildDimensionsSection(),
    ],
};
