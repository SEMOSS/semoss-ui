//* Block Config
import { BlockConfig } from '@/stores';
import { SelectBlockDef, SelectBlock } from './SelectBlock';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';
import {
    buildDimensionsSection,
    buildSpacingSection,
} from '../block-defaults.shared';
import { InputSettings } from '@/components/block-settings';
import { SelectInputValueSettings } from '@/components/block-settings/custom/SelectInputValueSettings';
import { SelectInputOptionsSettings } from '@/components/block-settings/custom/SelectInputOptionsSettings';

//* Material UI Components
import { ViewList } from '@mui/icons-material';

export const config: BlockConfig<SelectBlockDef> = {
    widget: 'select',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {},
        label: 'Engine',
        options: [],
        value: '',
    },
    listeners: {
        onChange: [],
    },
    slots: {},
    render: SelectBlock,
    icon: ViewList,
    contentMenu: [
        {
            name: 'View LLM & Vector DB Settings',
            children: [
                {
                    description: 'Value',
                    render: ({ id }) => (
                        <SelectInputValueSettings id={id} path="value" />
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
                            <SelectInputOptionsSettings
                                id={id}
                                path="options"
                            />
                        );
                    },
                },
            ],
        },
    ],
    styleMenu: [buildSpacingSection(), buildDimensionsSection()],
};
