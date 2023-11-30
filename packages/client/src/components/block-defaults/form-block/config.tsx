import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildColorSection,
    buildTypographySection,
} from '../block-defaults.shared';

import { FormBlockDef, FormBlock } from './FormBlock';
import { DynamicForm } from '@mui/icons-material';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';

// export the config for the block
export const config: BlockConfig<FormBlockDef> = {
    widget: 'form',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {
            display: 'flex',
            gap: '16px',
        },
        label: 'Example Form',
    },
    listeners: {},
    slots: {
        children: [],
    },
    render: FormBlock,
    icon: DynamicForm,
    contentMenu: [],
    styleMenu: [
        {
            name: 'Layout',
            children: [
                ...buildLayoutSection().children,
                {
                    description: 'Direction',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Direction"
                            path="style.flexDirection"
                        />
                    ),
                },
            ],
        },
        buildSpacingSection(),
        buildDimensionsSection(),
        buildColorSection(),
        buildTypographySection(),
    ],
};
