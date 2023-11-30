import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildStyleSection,
    buildTypographySection,
} from '../block-defaults.shared';

import { DividerBlockDef, DividerBlock } from './DividerBlock';
import { HorizontalRule } from '@mui/icons-material';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';

// export the config for the block
export const config: BlockConfig<DividerBlockDef> = {
    widget: 'divider',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {
            display: 'flex',
            gap: '16px',
        },
    },
    listeners: {},
    slots: {
        children: [],
    },
    render: DividerBlock,
    icon: HorizontalRule,
    contentMenu: [],
    styleMenu: [
        {
            name: 'Layout',
            children: [
                ...buildLayoutSection().children,
                {
                    description: 'Direction',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Direction"
                            path="style.flexDirection"
                        />
                    ),
                },
            ],
        },
        buildSpacingSection(),
        buildDimensionsSection(),
        buildStyleSection(),
        buildTypographySection(),
    ],
};
