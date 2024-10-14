import { BlockConfig } from '@/stores';
import {
    InputSettings,
    QuerySelectionSettings,
    SelectEngineOptionsSettings,
} from '@/components/block-settings';

import { SelectEngineBlockDef, SelectEngineBlock } from './SelectEngineBlock';
import { ViewList } from '@mui/icons-material';

import { buildListener } from '../block-defaults.shared';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';
import { SelectInputValueSettings } from '@/components/block-settings/custom/SelectInputValueSettings';
import { SwitchSettings } from '@/components/block-settings/shared/SwitchSettings';

// export the config for the block
export const config: BlockConfig<SelectEngineBlockDef> = {
    widget: 'select-engine',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {
            padding: '4px',
        },
        value: '',
        label: 'Example Select Engine Input',
        hint: '',
        options: [],
        required: false,
        disabled: false,
        loading: false,
        optionLabel: '',
        optionSublabel: '',
        optionValue: '',
        multiple: false,
    },
    listeners: {
        onChange: [],
    },
    slots: {
        content: [],
    },
    render: SelectEngineBlock,
    icon: ViewList,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Multi Select',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Enable Multi Select"
                            path="multiple"
                            description="This setting will enable the multi-select feature on the select input"
                        />
                    ),
                },
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
                            <SelectEngineOptionsSettings
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
