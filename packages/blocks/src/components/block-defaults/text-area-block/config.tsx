import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';

import { TextAreaBlockDef, TextAreaBlock } from './TextAreaBlock';
import { FormatShapes } from '@mui/icons-material';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';

// export the config for the block
export const config: BlockConfig<TextAreaBlockDef> = {
    widget: 'text-area',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {},
        value: '',
        label: 'Example Input',
        multiline: false,
        rows: 4,
        type: '',
    },
    listeners: {
        onChange: [],
    },
    slots: {
        content: [],
    },
    render: TextAreaBlock,
    icon: FormatShapes,
    menu: [
        {
            name: 'Textarea',
            children: [
                {
                    description: 'Value',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Value" path="value" />
                    ),
                },
                {
                    description: 'Label',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Label" path="label" />
                    ),
                },
                {
                    description: 'Rows',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Rows" path="rows" />
                    ),
                },
                {
                    description: 'Multiline',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Multiline"
                            path="multiline"
                        />
                    ),
                },
            ],
        },
    ],
};
