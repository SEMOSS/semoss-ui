import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';

import { SelectBlockDef, SelectBlock } from './SelectBlock';
import { ViewList } from '@mui/icons-material';

import { buildSpacingSection } from '../block-defaults.shared';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';
import { SelectInputValueSettings } from '@/components/block-settings/custom/SelectInputValueSettings';
import { SelectInputOptionsSettings } from '@/components/block-settings/custom/SelectInputOptionsSettings';

// export the config for the block
export const config: BlockConfig<SelectBlockDef> = {
    widget: 'select',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {
            width: '100%',
            padding: '8px',
        },
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
    styleMenu: [buildSpacingSection()],
};
