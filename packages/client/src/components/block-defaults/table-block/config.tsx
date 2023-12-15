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
import { TableHeaderSettings } from '@/components/block-settings/custom/TableHeaderSettings';
import { InputModalSettings } from '@/components/block-settings/shared/InputModalSettings';

// export the config for the block
export const config: BlockConfig<TableBlockDef> = {
    widget: 'table',
    type: BLOCK_TYPE_DATA,
    data: {
        style: {
            maxWidth: '1200px',
        },
        content: [],
        headers: [],
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
                    description: 'Columns',
                    render: ({ id }) => (
                        <TableHeaderSettings id={id} path="headers" />
                    ),
                },
                {
                    description: 'Content',
                    render: ({ id }) => (
                        <InputModalSettings
                            id={id}
                            label="Content"
                            path="content"
                        />
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
