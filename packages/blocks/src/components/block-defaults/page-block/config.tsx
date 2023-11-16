import { BlockConfig } from '@/stores';
import { FormatShapes } from '@mui/icons-material';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildStyleSection,
    buildTypographySection,
} from '../block-defaults.shared';

import { PageBlockDef, PageBlock } from './PageBlock';

// export the config for the block
export const config: BlockConfig<PageBlockDef> = {
    widget: 'page',
    data: {
        style: {},
    },
    listeners: {},
    slots: {
        content: [],
    },
    render: PageBlock,
    icon: FormatShapes,
    menu: [
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildStyleSection(),
        buildTypographySection(),
    ],
};
