import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';
import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildStyleSection,
    buildTypographySection,
} from '../block-defaults.shared';

import { TextBlockDef, TextBlock } from './TextBlock';

// export the config for the block
export const config: BlockConfig<TextBlockDef> = {
    widget: 'text',
    data: {
        style: {},
        text: 'Hello world',
    },
    listeners: {},
    slots: {
        test: [],
    },
    render: TextBlock,
    menu: [
        {
            name: 'Content',
            children: [
                {
                    description: 'Text',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Text" path="text" />
                    ),
                },
            ],
        },
        buildLayoutSection(),
        buildSpacingSection(),
        buildDimensionsSection(),
        buildStyleSection(),
        buildTypographySection(),
    ],
};
