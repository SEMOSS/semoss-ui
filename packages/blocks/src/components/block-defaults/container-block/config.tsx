import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildStyleSection,
    buildTypographySection,
} from '../block-defaults.shared';

import { ContainerBlockDef, ContainerBlock } from './ContainerBlock';
import { HighlightAlt } from '@mui/icons-material';

// export the config for the block
export const config: BlockConfig<ContainerBlockDef> = {
    widget: 'container',
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
    render: ContainerBlock,
    icon: HighlightAlt,
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
