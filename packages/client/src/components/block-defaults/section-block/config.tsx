import { BlockConfig } from '@/stores';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildTypographySection,
} from '../block-defaults.shared';

import { SectionBlockDef, SectionBlock } from './SectionBlock';
import { HighlightAlt } from '@mui/icons-material';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';
import { GridSettings } from '@/components/block-settings';

// export the config for the block
export const config: BlockConfig<SectionBlockDef> = {
    widget: 'section',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {
            display: 'flex',
            flexDirection: 'row',
            gap: '16px',
            margin: '8px',
        },
        grid: {
            value: '',
            label: '',
            config: {
                cols: 2,
                rows: 1,
            },
        },
    },
    listeners: {},
    slots: {
        children: [],
    },
    render: SectionBlock,
    icon: HighlightAlt,
    contentMenu: [
        {
            name: 'Grid',
            children: [
                ...buildLayoutSection().children,
                {
                    description: 'Layout',
                    render: ({ id }) => (
                        <GridSettings id={id} label="Layout" path="grid" />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildTypographySection(),
    ],
};
