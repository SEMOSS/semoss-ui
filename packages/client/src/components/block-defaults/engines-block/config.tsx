//* Block Config
import { BlockConfig } from '@/stores';
import { EnginesBlockDef, EnginesBlock } from './EnginesBlock';
import { BLOCK_TYPE_CUSTOM } from '../block-defaults.constants';

import {
    buildDimensionsSection,
    buildSpacingSection,
} from '../block-defaults.shared';
import { InputSettings } from '@/components/block-settings';
import { SelectInputValueSettings } from '@/components/block-settings/custom/SelectInputValueSettings';
// import { SelectInputOptionsSettings } from '@/components/block-settings/custom/SelectInputOptionsSettings';

//* Material UI Components
// import { ViewList } from '@mui/icons-material';
import { EngineeringOutlined as EnginesOutlineIcon } from '@mui/icons-material';

export const config: BlockConfig<EnginesBlockDef> = {
    widget: 'engines',
    type: BLOCK_TYPE_CUSTOM,
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
    render: EnginesBlock,
    icon: EnginesOutlineIcon,
    contentMenu: [
        {
            name: 'Engines Models & VectorDB Settings',
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
                //* Removed Options Settings
                /*
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
                */
            ],
        },
    ],
    styleMenu: [buildSpacingSection(), buildDimensionsSection()],
};
