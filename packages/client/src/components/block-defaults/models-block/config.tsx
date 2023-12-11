//* Block Config
import { BlockConfig } from '@/stores';
import { ModelsBlockDef, ModelsBlock } from './ModelsBlock';
import { BLOCK_TYPE_CUSTOM } from '../block-defaults.constants';

import {
    buildDimensionsSection,
    buildSpacingSection,
} from '../block-defaults.shared';
import { InputSettings } from '@/components/block-settings';
import { SelectInputValueSettings } from '@/components/block-settings/custom/SelectInputValueSettings';
// import { SelectInputOptionsSettings } from '@/components/block-settings/custom/SelectInputOptionsSettings';

//* Assets
import BRAIN from '@/assets/img/BRAIN.png';

//* Material UI Components
// import { ViewList } from '@mui/icons-material';
import { EngineeringOutlined as EnginesOutlineIcon } from '@mui/icons-material';

export const config: BlockConfig<ModelsBlockDef> = {
    widget: 'models',
    type: BLOCK_TYPE_CUSTOM,
    data: {
        style: {},
        label: 'Models',
        options: [],
        value: '',
    },
    listeners: {
        onChange: [],
    },
    slots: {},
    render: ModelsBlock,
    icon: EnginesOutlineIcon,
    contentMenu: [
        {
            name: 'Model Settings',
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
            ],
        },
    ],
    styleMenu: [buildSpacingSection(), buildDimensionsSection()],
};
