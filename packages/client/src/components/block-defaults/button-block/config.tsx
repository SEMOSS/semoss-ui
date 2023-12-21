import { BlockConfig } from '@/stores';
import {
    QuerySelectionSettings,
    InputSettings,
} from '@/components/block-settings';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildColorSection,
    buildListener,
    buildBorderSection,
} from '../block-defaults.shared';

import { ButtonBlockDef, ButtonBlock } from './ButtonBlock';
import { SmartButton } from '@mui/icons-material';
import { BLOCK_TYPE_ACTION } from '../block-defaults.constants';

// export the config for the block
export const config: BlockConfig<ButtonBlockDef> = {
    widget: 'button',
    type: BLOCK_TYPE_ACTION,
    data: {
        style: {},
        label: 'Submit',
        loading: false,
        disabled: false,
    },
    listeners: {
        onClick: [],
    },
    slots: {},
    render: ButtonBlock,
    icon: SmartButton,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Label',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Label" path="label" />
                    ),
                },
                {
                    description: 'Loading',
                    render: ({ id }) => (
                        <QuerySelectionSettings
                            id={id}
                            label="Loading"
                            path="loading"
                        />
                    ),
                },
            ],
        },
        {
            name: 'onClick',
            children: [...buildListener('onClick')],
        },
    ],
    styleMenu: [
        buildColorSection(),
        buildBorderSection(),
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
    ],
};
