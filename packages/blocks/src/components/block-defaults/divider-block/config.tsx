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
import { FormatShapes } from '@mui/icons-material';

// export the config for the block
export const config: BlockConfig<DividerBlockDef> = {
    widget: 'divider',
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
    icon: FormatShapes,
    menu: [
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
                {
                    description: 'Align',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Align"
                            path="style.alignItems"
                        />
                    ),
                },
                {
                    description: 'Justify',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Justify"
                            path="style.justifyContent"
                        />
                    ),
                },
                {
                    description: 'Gap',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Gap" path="style.gap" />
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
