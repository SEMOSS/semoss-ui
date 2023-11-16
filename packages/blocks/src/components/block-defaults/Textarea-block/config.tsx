import { BlockConfig } from '@/stores';
import { InputTypeSettings, InputSettings } from '@/components/block-settings';

import { TextareaDef, Textarea } from './Textarea';
import { FormatShapes } from '@mui/icons-material';

// export the config for the block
export const config: BlockConfig<TextareaDef> = {
    widget: 'text-area',
    data: {
        style: {},
        value: '',
        label: 'Example Input',
    },
    listeners: {
        onChange: [],
    },
    slots: {
        content: [],
    },
    render: Textarea,
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
            ],
        },
    ],
};
