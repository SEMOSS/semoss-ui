import { BlockConfig } from '@/stores';
import { TableChart } from '@mui/icons-material';

import {
    buildDimensionsSection,
    buildColorSection,
    buildBorderSection,
} from '../block-defaults.shared';
import { BLOCK_TYPE_DATA } from '../block-defaults.constants';
import { GridBlock, GridBlockDef } from './GridBlock';
import { GridBlockColumnSettings } from './GridBlockColumnSettings';
// export the config for the block
export const config: BlockConfig<GridBlockDef> = {
    widget: 'grid',
    type: BLOCK_TYPE_DATA,
    data: {
        frame: {
            name: '',
        },
        columns: [],
        style: {},
    },
    listeners: {},
    slots: {},
    render: GridBlock,
    icon: TableChart,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Columns',
                    render: ({ id }) => <GridBlockColumnSettings id={id} />,
                },
            ],
        },
    ],
    styleMenu: [
        buildDimensionsSection(),
        buildColorSection(),
        buildBorderSection(),
    ],
};
