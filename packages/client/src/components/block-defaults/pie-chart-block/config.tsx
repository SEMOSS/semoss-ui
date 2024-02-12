import { BlockConfig } from '@/stores';

import { PieChartBlockDef, PieChartBlock } from './PieChartBlock';
import { Addchart } from '@mui/icons-material';
import { BLOCK_TYPE_CHART } from '../block-defaults.constants';
import { InputSettings, QueryInputSettings } from '@/components/block-settings';

// export the config for the block
export const config: BlockConfig<PieChartBlockDef> = {
    widget: 'pie-chart',
    type: BLOCK_TYPE_CHART,
    data: {
        chartData: '',
        categoryField: '',
        valueField: '',
        categoryLabel: '',
        chartTitle: '',
        width: 200,
        height: 200,
        padding: 5,
    },
    listeners: {},
    slots: {},
    render: PieChartBlock,
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
                    description: 'Value Field',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Value Field"
                            path="valueField"
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
                    description: 'Category Label',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Category Label"
                            path="categoryLabel"
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
