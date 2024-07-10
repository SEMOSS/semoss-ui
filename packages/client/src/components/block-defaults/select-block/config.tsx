import { BlockConfig } from '@/stores';
import {
    InputSettings,
    QuerySelectionSettings,
    SelectOptionsSettings,
} from '@/components/block-settings';

import { SelectBlockDef, SelectBlock } from './SelectBlock';
import { ViewList } from '@mui/icons-material';

import { buildListener } from '../block-defaults.shared';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';
import { SelectInputValueSettings } from '@/components/block-settings/custom/SelectInputValueSettings';

// export the config for the block
export const config: BlockConfig<SelectBlockDef> = {
    widget: 'select',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {
            padding: '4px',
        },
        value: '',
        label: 'Example Select Input',
        hint: '',
        options: [],
        required: false,
        disabled: false,
        loading: false,
        optionLabel: '',
        optionSublabel: '',
        optionValue: '',
    },
    listeners: {
        onChange: [],
    },
    slots: {
        content: [],
    },
    render: SelectBlock,
    icon: ViewList,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Value',
                    render: ({ id }) => (
                        <SelectInputValueSettings id={id} path="value" />
                    ),
                },
                {
                    description: 'Option Settings',
                    render: ({ id }) => {
                        return (
                            <SelectOptionsSettings
                                id={id}
                                optionData={[
                                    {
                                        label: 'Label',
                                        path: 'optionLabel',
                                    },
                                    {
                                        label: 'Sublabel',
                                        path: 'optionSublabel',
                                    },
                                ]}
                                label="Option Label"
                                path="optionLabel"
                            />
                        );
                    },
                },
                {
                    description: 'Label',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Label" path="label" />
                    ),
                },
                {
                    description: 'Hint',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Hint" path="hint" />
                    ),
                },
                {
                    description: 'Loading',
                    render: ({ id }) => (
                        <QuerySelectionSettings
                            id={id}
                            label="Loading"
                            path="loading"
                            queryPath="isLoading"
                        />
                    ),
                },
            ],
        },
        {
            name: 'on Change',
            children: [...buildListener('onChange')],
        },
    ],
    styleMenu: [],
};
