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
import {
    InputSettings,
    SelectInputSettings,
} from '@/components/block-settings';
import { QuerySelectionSettings } from '@/components/block-settings/custom/QuerySelectionSettings';

// export the config for the block
export const config: BlockConfig<TableBlockDef> = {
    widget: 'table',
    type: BLOCK_TYPE_DATA,
    data: {
        style: {
            maxWidth: '100%',
        },
        content: [],
        headers: [],
    },
    listeners: {},
    slots: {},
    render: TableBlock,
    icon: TableChart,
    isBlocksMenuEnabled: true,
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
                {
                    description: 'No Data Text',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="No Data Text"
                            path="noDataText"
                        />
                    ),
                },
                {
                    description: 'Loading',
                    render: ({ id }) => (
                        <QuerySelectionSettings
                            id={id}
                            label="Loading"
                            path="loading"
                            queryPath="isLoading"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        buildSpacingSection(),
        buildDimensionsSection(),
        buildColorSection(),
        buildBorderSection(),
        {
            name: 'Text',
            children: [
                {
                    description: 'Font',
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            path="style.fontFamily"
                            label="Font"
                            allowUnset
                            allowCustomInput
                            options={[
                                {
                                    value: 'Roboto',
                                    display: 'Roboto',
                                },
                                {
                                    value: 'Helvetica',
                                    display: 'Helvetica',
                                },
                                {
                                    value: 'Arial',
                                    display: 'Arial',
                                },
                                {
                                    value: 'Times New Roman',
                                    display: 'Times New Roman',
                                },
                                {
                                    value: 'Georgia',
                                    display: 'Georgia',
                                },
                            ]}
                        />
                    ),
                },
            ],
        },
    ],
};
