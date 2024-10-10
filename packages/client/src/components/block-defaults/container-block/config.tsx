import { CSSProperties } from 'react';
import { BlockConfig } from '@/stores';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildBorderSection,
    buildColorSection,
} from '../block-defaults.shared';

import { ContainerBlockDef, ContainerBlock } from './ContainerBlock';
import { HighlightAlt } from '@mui/icons-material';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';
import { InputSettings } from '@/components/block-settings';

// export the config for the block
export const config: BlockConfig<ContainerBlockDef> = {
    widget: 'container',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {
            display: 'flex',
            flexDirection: 'column',
            padding: '4px',
            gap: '8px',
            flexWrap: 'wrap',
        },
        subcontainer: 2,
    },
    listeners: {},
    slots: {
        children: [],
    },
    render: ContainerBlock,
    icon: HighlightAlt,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Subcontainer',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="No of subcontainer"
                            path="subcontainer"
                            type="number"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildColorSection(),
        buildBorderSection(),
    ],
};
