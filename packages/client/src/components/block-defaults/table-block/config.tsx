import { BlockConfig } from '@/stores';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildColorSection,
    buildTypographySection,
    buildBorderSection,
} from '../block-defaults.shared';

import { TableBlockDef, TableBlock } from './TableBlock';
import { TableChart } from '@mui/icons-material';
import { BLOCK_TYPE_DATA } from '../block-defaults.constants';
import { InputSettings } from '@/components/block-settings';

// export the config for the block
export const config: BlockConfig<TableBlockDef> = {
    widget: 'table',
    type: BLOCK_TYPE_DATA,
    data: {
        style: {
            display: 'table',
        },
        rows: [],
    },
    listeners: {},
    slots: {},
    render: TableBlock,
    icon: TableChart,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Rows',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Rows" path="rows" />
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
        buildTypographySection(),
    ],
};
