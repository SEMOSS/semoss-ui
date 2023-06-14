import { PANEL_TYPES } from '../../../core/constants.js';
/**
 * @name createDataGridViz
 * @desc creates a grid with the whole dataset that implied insights is run on
 * @param panelId - panel id
 * @param sheetId - sheet id
 * @param frame - frame name
 */
function createDataGridViz(
    panelId: number,
    sheetId: number,
    frame: string
): PixelCommand[] {
    return [
        {
            type: 'Pixel',
            components: [`AddSheet("${sheetId}")`],
            terminal: true,
        },
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
            components: ['visualization'],
            terminal: true,
        },
        {
            type: 'frame',
            components: [frame],
        },
        {
            type: 'queryAll',
            components: [],
        },
        {
            type: 'autoTaskOptions',
            components: [panelId, 'Grid'],
        },
        {
            type: 'collect',
            components: [
                // scope.insightCtrl.getOptions('limit') || 2000
                2000,
            ],
            terminal: true,
        },
        {
            type: 'panel',
            components: [panelId],
        },
        {
            type: 'addPanelOrnaments',
            components: [
                {
                    shared: {
                        showNewColumn: true,
                    },
                },
            ],
            terminal: true,
        },
        {
            type: 'panel',
            components: [panelId],
        },
        {
            type: 'retrievePanelOrnaments',
            components: ['tools.shared.showNewColumn'],
            terminal: true,
        },
    ];
}

/**
 * @name createFilterViz
 * @desc creates the filter panel that filters the data by outlier
 * @param panelId - panel id
 * @param sheetId - sheet id
 * @param frameName - frame name
 * @param headers - headers
 */
function createFilterViz(
    panelId: number,
    sheetId: number,
    frameName: string,
    headers: any
): PixelCommand[] {
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
                'implied-insights-filter',
                {
                    outlierFrame: frameName,
                    headers: headers,
                },
            ],
            terminal: true,
        },
    ];
}
/**
 * @name createDashboardLayout
 * @desc creates pixel to layout the dashboard
 * @param panels - list of panels (determines if panels should be shown)
 * @param sheetId - sheet id
 */
function createDashboardLayout(panels, sheetId) {
    const panelConfig = {};
    for (const id in panels) {
        if (panels[id].display) {
            panelConfig[id] = {
                config: {
                    type: 'golden',
                    backgroundColor: '',
                    opacity: 100,
                },
            };
        }
    }
    return [
        {
            type: 'Pixel',
            components: [
                `SetInsightConfig(
                    {
                        "panels": ${JSON.stringify(panelConfig)},
                        "sheets": {
                          "${sheetId}": {
                            "golden": {
                              "content": [
                                {
                                  "type": "column",
                                  "content": [
                                    {
                                      "type": "stack",
                                      "activeItemIndex": 0,
                                      "height": 14,
                                      "content": [
                                        {
                                          "type": "component",
                                          "componentName": "panel",
                                          "componentState": {
                                            "panelId": "1"
                                          }
                                        }
                                      ]
                                    },
                                    {
                                      "type": "row",
                                      "height": 86,
                                      "content": [
                                        {
                                          "type": "stack",
                                          "activeItemIndex": 0,
                                          "width": 50,
                                          "height": 25,
                                          "content": [
                                            {
                                              "type": "component",
                                              "componentName": "panel",
                                              "componentState": {
                                                "panelId": "0"
                                              }
                                            }
                                            ${
                                                panels['2'] &&
                                                panels['2'].display
                                                    ? `,{
                                                "type": "component",
                                                "componentName": "panel",
                                                "componentState": {
                                                  "panelId": "2"
                                                }
                                            }`
                                                    : ''
                                            }
                                            ${
                                                panels['3'] &&
                                                panels['3'].display
                                                    ? `,{
                                                "type": "component",
                                                "componentName": "panel",
                                                "componentState": {
                                                  "panelId": "3"
                                                }
                                            }`
                                                    : ''
                                            }
                                          ]
                                        },
                                        {
                                          "type": "column",
                                          "width": 50,
                                          "content": [
                                            {
                                              "type": "stack",
                                              "activeItemIndex": 0,
                                              "height": 100,
                                              "content": [
                                                ${
                                                    panels['4'] &&
                                                    panels['4'].display
                                                        ? `{
                                                    "type": "component",
                                                    "componentName": "panel",
                                                    "componentState": {
                                                      "panelId": "4"
                                                    }
                                                }`
                                                        : ''
                                                }
                                              ]
                                            }
                                          ]
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          }
                        },
                        "sheet": "${sheetId}"
                      }
                )`,
            ],
            terminal: true,
        },
    ];
}

/**
 * @name setPanelLabels
 * @desc sets the labels for each panel
 * @param panels - the panels to display
 * @returns pixel commands that set labels
 */
function setPanelLabels(panels) {
    let panelCommands: PixelCommand[] = [];
    for (const panel in panels) {
        if (panels[panel].display) {
            panelCommands = panelCommands.concat([
                {
                    type: 'panel',
                    components: [panels[panel].id],
                },
                {
                    type: 'setPanelLabel',
                    components: [panels[panel].panelTitle],
                    terminal: true,
                },
            ]);
        }
    }
    return panelCommands;
}

export default {
    createDataGridViz,
    createFilterViz,
    createDashboardLayout,
    setPanelLabels,
};
