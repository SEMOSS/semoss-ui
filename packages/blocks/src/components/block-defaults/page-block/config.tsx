import { BlockConfig } from '@/stores';
import { FileCopyOutlined } from '@mui/icons-material';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildStyleSection,
    buildTypographySection,
} from '../block-defaults.shared';

import { PageBlockDef, PageBlock } from './PageBlock';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';

// export the config for the block
export const config: BlockConfig<PageBlockDef> = {
    widget: 'page',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {},
    },
    listeners: {},
    slots: {
        content: [],
    },
    render: PageBlock,
    icon: FileCopyOutlined,
    menu: [
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildStyleSection(),
        buildTypographySection(),
    ],
};
