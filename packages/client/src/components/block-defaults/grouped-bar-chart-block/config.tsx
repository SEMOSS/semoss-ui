import { BlockConfig } from '@/stores';

import {
    GroupedBarChartBlockDef,
    GroupedBarChartBlock,
} from './GroupedBarChartBlock';
import { Addchart } from '@mui/icons-material';
import { BLOCK_TYPE_CHART } from '../block-defaults.constants';
import { InputSettings, QueryInputSettings } from '@/components/block-settings';

// export the config for the block
export const config: BlockConfig<GroupedBarChartBlockDef> = {
    widget: 'grouped-bar-chart',
    type: BLOCK_TYPE_CHART,
    data: {
        chartData: '',
        categoryField: '',
        groupField: '',
        xAxisLabel: '',
        yAxisField: '',
        yAxisLabel: '',
        chartTitle: '',
        width: 200,
        height: 200,
        padding: 5,
    },
    listeners: {},
    slots: {},
    render: GroupedBarChartBlock,
    icon: Addchart,
    isBlocksMenuEnabled: true,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Data',
                    render: ({ id }) => (
                        <QueryInputSettings
                            id={id}
                            label="Data"
                            path="chartData"
                        />
                    ),
                },
                {
                    description: 'Category Field',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Category Field"
                            path="categoryField"
                        />
                    ),
                },
                {
                    description: 'Group Field',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Group Field"
                            path="groupField"
                        />
                    ),
                },
                {
                    description: 'Y-Axis Field',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Y-Axis Field"
                            path="yAxisField"
                        />
                    ),
                },
                {
                    description: 'Title',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Title"
                            path="chartTitle"
                        />
                    ),
                },
                {
                    description: 'X-Axis Label',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="X-Axis Label"
                            path="xAxisLabel"
                        />
                    ),
                },
                {
                    description: 'Y-Axis Label',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Y-Axis Label"
                            path="yAxisLabel"
                        />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        {
            name: 'Dimensions',
            children: [
                {
                    description: 'Width',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Width"
                            path="width"
                            type="number"
                        />
                    ),
                },
                {
                    description: 'Height',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Height"
                            path="height"
                            type="number"
                        />
                    ),
                },
            ],
        },
        {
            name: 'Spacing',
            children: [
                {
                    description: 'Chart Padding',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Padding"
                            path="padding"
                            type="number"
                        />
                    ),
                },
            ],
        },
    ],
};
