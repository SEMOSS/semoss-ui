import { CSSProperties } from 'react';
import { BlockConfig } from '@/stores';
import {
    InputSettings,
    QuerySelectionSettings,
} from '@/components/block-settings';

import { InputBlockDef, InputBlock } from './InputBlock';
import { buildListener } from '../block-defaults.shared';
import { FormatShapes } from '@mui/icons-material';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';
import { SelectInputSettings } from '@/components/block-settings/shared/SelectInputSettings';
import { InputModalSettings } from '@/components/block-settings/shared/InputModalSettings';

export const DefaultStyles: CSSProperties = {
    width: '100%',
    padding: '4px',
};

// export the config for the block
export const config: BlockConfig<InputBlockDef> = {
    widget: 'input',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: DefaultStyles,
        value: '',
        label: 'Example Input',
        hint: '',
        type: 'text',
        rows: 1,
        multiline: false,
        disabled: false,
        required: false,
        loading: false,
    },
    listeners: {
        onChange: [],
    },
    slots: {
        content: [],
    },
    render: InputBlock,
    icon: FormatShapes,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Value',
                    render: ({ id }) => (
                        <InputModalSettings
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
                    description: 'Hint',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Hint" path="hint" />
                    ),
                },
                {
                    description: 'Input Type',
                    render: ({ id }) => {
                        return (
                            <SelectInputSettings
                                id={id}
                                path="type"
                                label="Type"
                                options={[
                                    {
                                        value: 'text',
                                        display: 'Text',
                                    },
                                    {
                                        value: 'number',
                                        display: 'Number',
                                    },
                                    {
                                        value: 'date',
                                        display: 'Date',
                                    },
                                ]}
                            />
                        );
                    },
                },
                {
                    description: 'Rows',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Rows"
                            path="rows"
                            type="number"
                            description="This will determine how many rows are displayed on text input"
                        />
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
