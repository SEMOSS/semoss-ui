import { CSSProperties } from 'react';
import { BlockConfig } from '@/stores';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildBorderSection,
} from '../block-defaults.shared';

import { ContainerBlockDef, ContainerBlock } from './ContainerBlock';
import { HighlightAlt } from '@mui/icons-material';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';

export const DefaultStyles: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap',
    padding: '4px',
    gap: '8px',
    overflow: 'hidden',
};

export const VariantOne: CSSProperties = {
    ...DefaultStyles,
};

export const VariantTwo: CSSProperties = {
    ...DefaultStyles,
};

// export the config for the block
export const config: BlockConfig<ContainerBlockDef> = {
    widget: 'container',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: DefaultStyles,
    },
    listeners: {},
    slots: {
        children: [],
    },
    render: ContainerBlock,
    icon: HighlightAlt,
    isBlocksMenuEnabled: true,
    contentMenu: [],
    styleMenu: [
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildBorderSection(),
    ],
};
