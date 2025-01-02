import { BlockConfig } from '@/stores';
import { Insights } from '@mui/icons-material';
import { BLOCK_TYPE_CHART } from '../block-defaults.constants';
import {
    EchartVisualizationBlock,
    EchartVisualizationBlockDef,
} from './EchartVisualizationBlock';
import { EchartVisualizationBlockMenu } from './EchartVisualizationBlockMenu';
import { ScatterPlotBlockSettings } from './ScatterPlot.tsx/ScatterPlotBlockSettings';
import { ChartFeatures } from './ScatterPlot.tsx/ChartFeatures';

export const config: BlockConfig<EchartVisualizationBlockDef> = {
    widget: 'e-chart',
    type: BLOCK_TYPE_CHART,
    data: {
        option: {},
        variation: '',
        frame: {
            name: '',
        },
        columns: [],
        contextMenu: {
            hideFilter: false,
            hideUnfilter: false,
            hideExclude: false,
        },
    },
    listeners: {},
    slots: {},
    render: EchartVisualizationBlock,
    icon: Insights,
    contentMenu: [
        {
            name: 'JSON Settings',
            children: [
                {
                    description: 'Columns',
                    render: ({ id }) => (
                        <EchartVisualizationBlockMenu id={id} />
                    ),
                },
            ],
        },
        {
            name: 'Block Settings',
            children: [
                {
                    description: 'Block Settings',
                    render: ({ id }) => (
                        <ScatterPlotBlockSettings id={id} path={'option'} />
                    ),
                },
            ],
        },
        {
            name: 'Chart Features',
            children: [
                {
                    description: 'Chart Features',
                    render: ({ id }) => (
                        <ChartFeatures id={id} path={'option'} />
                    ),
                },
            ],
        },
    ],
};
