import { BlockConfig } from '@/stores';

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
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildStyleSection(),
        buildListenersSection(['onClick']),
    ],
};
