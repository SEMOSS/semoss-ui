import { BlockConfig } from '@/stores';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildStyleSection,
    buildTypographySection,
    buildListenersSection,
} from '../block-defaults.shared';

import { ButtonBlockDef, ButtonBlock } from './ButtonBlock';

// export the config for the block
export const config: BlockConfig<ButtonBlockDef> = {
    widget: 'button',
    data: {
        style: {},
    },
    listeners: {
        onClick: [],
    },
    slots: {
        text: [],
    },
    render: ButtonBlock,
    menu: [
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildStyleSection(),
        buildTypographySection(),
        buildListenersSection(['onClick']),
    ],
};
