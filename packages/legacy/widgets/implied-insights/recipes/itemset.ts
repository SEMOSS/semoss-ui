import { PANEL_TYPES } from '../../../core/constants';
/**
 * @name createItemsetViz
 * @desc creates recipe for frequent itemset scatterplot
 * @param panelId - panel id
 * @param sheetId - sheet id
 * @param frameName - frame that contains the data
 */
function createItemsetViz(
    panelId: number,
    sheetId: number,
    frameName: string
): PixelCommand[] {
    if (!frameName) {
        return [];
    }
    return [
        {
            type: 'addPanel',
            components: [panelId, sheetId],
            terminal: true,
        },
        {
            type: 'panel',
            components: [panelId],
        },
        {
            type: 'addPanelConfig',
            components: [
                {
                    type: PANEL_TYPES.GOLDEN,
                },
            ],
            terminal: true,
        },
        {
            type: 'panel',
            components: [panelId],
        },
        {
            type: 'setPanelView',
            components: [
                'visualization',
                {
                    type: 'echarts',
                },
            ],
            terminal: true,
        },
        {
            type: 'if',
            components: [
                [
                    {
                        type: 'variable',
                        components: [frameName],
                    },
                    {
                        type: 'hasDuplicates',
                        components: [['items']],
                        terminal: true,
                    },
                ],
                [
                    {
                        type: 'frame',
                        components: [frameName],
                    },
                    {
                        type: 'select2',
                        components: [
                            [
                                {
                                    alias: 'items',
                                },
                                {
                                    calculatedBy: 'support',
                                    math: 'Average',
                                    alias: 'Average_of_support',
                                },
                                {
                                    calculatedBy: 'allConfidence',
                                    math: 'Average',
                                    alias: 'Average_of_allConfidence',
                                },
                                {
                                    calculatedBy: 'lift',
                                    math: 'Average',
                                    alias: 'Average_of_lift',
                                },
                            ],
                        ],
                    },
                    {
                        type: 'group',
                        components: [['items']],
                    },
                    {
                        type: 'with',
                        components: [panelId],
                    },
                    {
                        type: 'format',
                        components: ['table'],
                    },
                    {
                        type: 'taskOptions',
                        components: [
                            {
                                [`${panelId}`]: {
                                    layout: 'Scatter',
                                    alignment: {
                                        label: ['items'],
                                        x: ['Average_of_support'],
                                        y: ['Average_of_allConfidence'],
                                        z: ['Average_of_lift'],
                                        series: [],
                                        tooltip: [],
                                        facet: [],
                                    },
                                    layer: {
                                        id: '0',
                                        name: 'Layer 0',
                                        addYAxis: true,
                                        addXAxis: true,
                                        z: 2,
                                        base: true,
                                    },
                                },
                            },
                        ],
                    },
                    {
                        type: 'collect',
                        components: [2000],
                        terminal: true,
                    },
                ],
                [
                    {
                        type: 'frame',
                        components: [frameName],
                    },
                    {
                        type: 'select2',
                        components: [
                            [
                                {
                                    alias: 'items',
                                },
                                {
                                    alias: 'support',
                                },
                                {
                                    alias: 'allConfidence',
                                },
                                {
                                    alias: 'lift',
                                },
                            ],
                        ],
                    },
                    {
                        type: 'with',
                        components: [panelId],
                    },
                    {
                        type: 'format',
                        components: ['table'],
                    },
                    {
                        type: 'taskOptions',
                        components: [
                            {
                                [`${panelId}`]: {
                                    layout: 'Scatter',
                                    alignment: {
                                        label: ['items'],
                                        x: ['support'],
                                        y: ['allConfidence'],
                                        z: ['lift'],
                                        series: [],
                                        tooltip: [],
                                        facet: [],
                                    },
                                    layer: {
                                        id: '0',
                                        name: 'Layer 0',
                                        addYAxis: true,
                                        addXAxis: true,
                                        z: 2,
                                        base: true,
                                    },
                                },
                            },
                        ],
                    },
                    {
                        type: 'collect',
                        components: [2000],
                        terminal: true,
                    },
                ],
            ],
            terminal: true,
        },
    ];
}

export default createItemsetViz;
