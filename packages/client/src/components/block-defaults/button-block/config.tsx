import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildStyleSection,
    buildListeners,
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
                ...buildListeners(['onClick']),
            ],
        },
    ],
    styleMenu: [
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildStyleSection(),
    ],
};
