import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildStyleSection,
    buildListenersSection,
} from '../block-defaults.shared';

import { ButtonBlockDef, ButtonBlock } from './ButtonBlock';

// export the config for the block
export const config: BlockConfig<ButtonBlockDef> = {
    widget: 'button',
    data: {
        style: {},
        label: 'Submit',
    },
    listeners: {
        onClick: [],
    },
    slots: {},
    render: ButtonBlock,
    menu: [
        {
            name: 'Button',
            children: [
                {
                    description: 'Label',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Label" path="label" />
                    ),
                },
            ],
        },
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildStyleSection(),
        buildListenersSection(['onClick']),
    ],
};
