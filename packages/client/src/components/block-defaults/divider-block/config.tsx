import { BlockConfig } from '@/stores';
import {
    ButtonGroupSettings,
    InputSettings,
} from '@/components/block-settings';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildColorSection,
    buildTypographySection,
} from '../block-defaults.shared';

import { DividerBlockDef, DividerBlock } from './DividerBlock';
import { HorizontalRule } from '@mui/icons-material';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';
import { VerticalDividerIcon } from './VerticalDividerIcon';

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
                {
                    description: 'Direction',
                    render: ({ id }) => (
                        <ButtonGroupSettings
                            id={id}
                            label="Direction"
                            path="style.flexDirection"
                            options={[
                                {
                                    value: 'row',
                                    icon: HorizontalRule,
                                    title: 'Horizontal',
                                    isDefault: true,
                                },
                                {
                                    value: 'column',
                                    icon: VerticalDividerIcon,
                                    title: 'Vertical',
                                    isDefault: false,
                                },
                            ]}
                        />
                    ),
                },
            ],
        },
        buildColorSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
    ],
};
