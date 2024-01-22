import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildColorSection,
    buildTypographySection,
    buildBorderSection,
} from '../block-defaults.shared';

import { ContainerBlockDef, ContainerBlock } from './ContainerBlock';
import { HighlightAlt } from '@mui/icons-material';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';

// export the config for the block
export const config: BlockConfig<ContainerBlockDef> = {
    widget: 'container',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {
            display: 'flex',
            gap: '2rem',
            overflow: 'scroll',
        },
    },
    listeners: {},
    slots: {
        children: [],
    },
    render: ContainerBlock,
    icon: HighlightAlt,
    contentMenu: [],
    styleMenu: [
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildColorSection(),
        buildBorderSection(),
        buildTypographySection(),
    ],
};
