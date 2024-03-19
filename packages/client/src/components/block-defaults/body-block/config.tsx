import { BlockConfig } from '@/stores';
import { BorderClear } from '@mui/icons-material';

import {
    buildLayoutSection,
    buildColorSection,
    buildTypographySection,
    buildDimensionsSection,
} from '../block-defaults.shared';

import { BodyBlockDef, BodyBlock } from './BodyBlock';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';
import { SelectInputSettings } from '@/components/block-settings/shared/SelectInputSettings';
import { BorderSettings, SizeSettings } from '@/components/block-settings';

// export the config for the block
export const config: BlockConfig<BodyBlockDef> = {
    widget: 'body',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {
            height: '80%',
            width: '100%',
        },
    },
    listeners: {},
    slots: {
        content: [],
    },
    render: BodyBlock,
    icon: BorderClear,
    contentMenu: [],
    styleMenu: [
        buildDimensionsSection(),
        buildLayoutSection(),
        // root bodys don't get margin for spacing
        {
            name: 'Spacing',
            children: [
                {
                    description: 'Padding',
                    render: ({ id }) => (
                        <SizeSettings
                            id={id}
                            label="Padding"
                            path="style.padding"
                        />
                    ),
                },
            ],
        },
        buildColorSection(),
        {
            name: 'Border', // no border radius
            children: [
                {
                    description: 'Border',
                    render: ({ id }) => (
                        <BorderSettings id={id} path="style.border" />
                    ),
                },
            ],
        },
        buildTypographySection(),
    ],
};
