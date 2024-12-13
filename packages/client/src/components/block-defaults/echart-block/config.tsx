import { BlockConfig } from '@/stores';
import { Insights } from '@mui/icons-material';
import { BLOCK_TYPE_CHART } from '../block-defaults.constants';
import {
    EchartVisualizationBlockDef,
    EchartVisualizationBlock,
} from './echartblocks';
import { EchartVisualizationBlockMenu } from './echartblocksmenu';
import { CustomBlockColumnSettings } from './CustomBlockColumnSettings';

export const config: BlockConfig<EchartVisualizationBlockDef> = {
    widget: 'echart',
    type: BLOCK_TYPE_CHART,
    data: {
        frame: {
            name: '',
            labels: [],
            values: [],
            labelIndex: -1,
            valueIndex: -1,
        },
        specJson: '',
        variation: undefined,
        option: undefined,
        columns: [],
    },
    listeners: {},
    slots: {},
    render: EchartVisualizationBlock,
    icon: Insights,
    // contentMenu: [
    //     {
    //         name: 'Frames',
    //         children: [
    //             {
    //                 description: 'Data',
    //                 render: ({ id }) => <CustomBlockColumnSettings id={id} />,
    //             },
    //         ],
    //     },
    // ],
    menu: EchartVisualizationBlockMenu,
};
