import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';

import { TextareaDef, TextareaBlock } from './TextareaBlock';
import { FormatShapes } from '@mui/icons-material';

// export the config for the block
export const config: BlockConfig<TextareaDef> = {
    widget: 'textarea',
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
    render: TextareaBlock,
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
