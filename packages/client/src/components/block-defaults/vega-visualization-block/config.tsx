import { BlockConfig } from '@/stores';
import {
    VegaVisualizationBlockDef,
    VegaVisualizationBlock,
} from './VegaVisualizationBlock';
import { Insights } from '@mui/icons-material';
import { BLOCK_TYPE_CHART } from '../block-defaults.constants';
import { VegaVisualizationBlockMenu } from './VegaVisualizationBlockMenu';
import { JsonSettings } from '@/components/block-settings/shared/JsonSettings';
import { ChartFeatures } from '@/components/block-settings/shared/ChartFeatures';
import { PieChartBlockSettings } from './PieChartBlockSettings';

export const config: BlockConfig<VegaVisualizationBlockDef> = {
    widget: 'vega',
    type: BLOCK_TYPE_CHART,
    data: {
        frame: {
            name: '',
        },
        columns: [],
        style: {},
        specJson: '',
        variation: undefined,
    },
    listeners: {},
    slots: {},
    render: VegaVisualizationBlock,
    icon: Insights,
    contentMenu: [
        {
            name: 'JSON Settings',
            children: [
                {
                    description: 'Columns',
                    render: ({ id }) => <VegaVisualizationBlockMenu id={id} />,
                },
            ],
        },
        {
            name: 'Chart Features',
            children: [
                {
                    description: 'Chart Features',
                    render: ({ id }) => (
                        <ChartFeatures
                            id={id}
                            path="specJson"
                            initialPalettes={[]}
                        />
                    ),
                },
            ],
        },
        {
            name: 'Block Settings',
            children: [
                {
                    description: 'Block Settings',
                    render: ({ id }) => <PieChartBlockSettings id={id} />,
                },
            ],
        },
    ],
};
