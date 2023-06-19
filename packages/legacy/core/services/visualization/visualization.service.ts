import angular from 'angular';
import Utility from '../../utility/utility.js';

/**
 * @name visualization.service.js
 * @desc visualizationService
 */
export default angular
    .module('app.visualization.service', [])
    .factory('visualizationService', visualizationService);

visualizationService.$inject = ['messageService', 'storeService'];

function visualizationService(
    messageService: MessageService,
    storeService: StoreService
) {
    const /** Public */
        /** Private */
        _state = {},
        _actions = {
            /**
             * @name update-facet
             * @desc action that is triggered to update the filter of the facet
             * @param {object} payload - payload of the message
             * @return {void}
             */
            'update-facet': (payload: {
                widgetId: string;
                limit: number;
                index: number;
            }): void => {
                let panelId = storeService.getWidget(
                        payload.widgetId,
                        'panelId'
                    ),
                    layout = storeService.getWidget(
                        payload.widgetId,
                        'view.visualization.layout'
                    ),
                    taskOptionsComponent: any,
                    selectComponent: any,
                    groupComponent: any[] = [],
                    instanceIdx: number,
                    filterComponent: any,
                    layerIndex = 0,
                    keys: any[] = storeService.getWidget(
                        payload.widgetId,
                        'view.visualization.keys.' + layout
                    ),
                    groupByInfoObj: any = storeService.getWidget(
                        payload.widgetId,
                        'view.visualization.tasks.' +
                            layerIndex +
                            '.groupByInfo'
                    ),
                    taskData: any = storeService.getWidget(
                        payload.widgetId,
                        'view.visualization.tasks.' + layerIndex
                    ),
                    formatType: string,
                    connections: any[] = [],
                    formatComponent: any[] = [],
                    facetPixel = '',
                    facetVariable = '',
                    frameName: string = storeService.getShared(
                        storeService.getWidget(payload.widgetId, 'insightID'),
                        'frames.' +
                            storeService.getWidget(payload.widgetId, 'frame') +
                            '.name'
                    ),
                    pixelComponents: any[] = [];

                // Define Select Component
                selectComponent = taskData.meta.headerInfo;
                // Define Group Component
                for (let i = 0, len = keys.length; i < len; i++) {
                    if (layout === 'Graph' || layout === 'BoxWhisker') {
                        groupComponent.push(keys[i].alias);
                    } else if (
                        layout === 'Sankey' ||
                        layout === 'ParallelCoordinates'
                    ) {
                        if (keys[i].model !== 'groupBy') {
                            if (keys[i].calculatedBy) {
                                groupComponent.push(keys[i].calculatedBy);
                            } else {
                                groupComponent.push(keys[i].alias);
                            }
                        }
                    } else if (layout === 'HeatMap') {
                        if (
                            keys[i].model === 'x' ||
                            keys[i].model === 'y' ||
                            keys[i].model === 'facet'
                        ) {
                            groupComponent.push(keys[i].alias);
                        }
                    } else if (layout === 'TreeMap') {
                        if (
                            keys[i].model === 'label' ||
                            keys[i].model === 'series' ||
                            keys[i].model === 'facet'
                        ) {
                            groupComponent.push(keys[i].alias);
                        }
                    } else if (
                        layout === 'Dendrogram' ||
                        layout === 'ScatterplotMatrix'
                    ) {
                        if (
                            keys[i].model === 'dimension' ||
                            keys[i].model === 'facet'
                        ) {
                            groupComponent.push(keys[i].alias);
                        }
                    } else if (layout === 'GanttD3') {
                        if (
                            keys[i].model === 'task' ||
                            keys[i].model === 'facet'
                        ) {
                            groupComponent.push(keys[i].alias);
                        }
                    } else if (layout === 'Stack' || layout === 'MultiLine') {
                        if (
                            keys[i].model === 'label' ||
                            keys[i].model === 'category' ||
                            keys[i].model === 'facet'
                        ) {
                            groupComponent.push(keys[i].alias);
                        }
                    } else if (
                        keys[i].model === 'label' ||
                        keys[i].model === 'facet'
                    ) {
                        groupComponent.push(keys[i].alias);
                    }
                }

                // Define Data Format
                formatType = taskData.meta.dataFormat.toLowerCase();
                formatComponent.push(formatType);
                if (layout === 'Graph') {
                    connections.push(taskData.meta.options);
                    formatComponent.push(connections);
                }

                // create components
                taskOptionsComponent = {};
                taskOptionsComponent[panelId] = {
                    layout: layout,
                    alignment: {},
                };

                for (let i = 0, len = keys.length; i < len; i++) {
                    // add in the model
                    if (
                        !taskOptionsComponent[panelId].alignment[keys[i].model]
                    ) {
                        taskOptionsComponent[panelId].alignment[keys[i].model] =
                            [];
                    }
                    // add to the view component
                    taskOptionsComponent[panelId].alignment[keys[i].model].push(
                        keys[i].alias
                    );
                }

                if (
                    payload.index >= 0 &&
                    payload.index < groupByInfoObj.uniqueInstances.length
                ) {
                    instanceIdx = payload.index;
                } else if (
                    payload.index >= groupByInfoObj.uniqueInstances.length
                ) {
                    instanceIdx =
                        payload.index % groupByInfoObj.uniqueInstances.length;
                } else {
                    instanceIdx =
                        (groupByInfoObj.uniqueInstances.length +
                            payload.index) %
                        groupByInfoObj.uniqueInstances.length;
                }

                taskOptionsComponent[panelId].alignment.groupBy = [];
                taskOptionsComponent[panelId].alignment.groupBy.push(
                    groupByInfoObj.selectedDim
                );
                taskOptionsComponent[panelId].groupByInfo = {};
                taskOptionsComponent[panelId].groupByInfo.selectedDim =
                    groupByInfoObj.selectedDim;
                taskOptionsComponent[panelId].groupByInfo.viewType =
                    groupByInfoObj.viewType;
                taskOptionsComponent[panelId].groupByInfo.instanceIndex =
                    '' + instanceIdx + '';
                // make a new variable for the unique instances & push into pixelComponents to be run first.
                facetVariable = 'facet_' + panelId;

                facetPixel += facetVariable + ' = ';
                facetPixel +=
                    'Frame(' +
                    frameName +
                    ') | Select (' +
                    groupByInfoObj.selectedDim +
                    ') | Sort(columns=["' +
                    groupByInfoObj.selectedDim +
                    '"], sort=["asc"]) | Collect(-1);';
                pixelComponents.push({
                    type: 'Pixel',
                    components: [facetPixel],
                    terminal: true,
                });
                // set the uniqueInstances to be the facetVariable as a variable notation in the pixel
                taskOptionsComponent[panelId].groupByInfo.uniqueInstances =
                    '{' + facetVariable + '}';

                // Create Filter Component
                filterComponent = {};
                filterComponent[groupByInfoObj.selectedDim] = {
                    comparator: '==',
                    value: groupByInfoObj.uniqueInstances[instanceIdx],
                };

                pixelComponents = pixelComponents.concat([
                    {
                        type: 'frame',
                        components: [frameName],
                    },
                    {
                        type: 'select2',
                        components: [selectComponent],
                    },
                    {
                        type: 'group',
                        components: [groupComponent],
                    },
                    {
                        type: 'filter',
                        components: [filterComponent],
                    },
                    {
                        type: 'with',
                        components: [panelId],
                    },
                    {
                        type: 'format',
                        components: formatComponent,
                    },
                    {
                        type: 'taskOptions',
                        components: [taskOptionsComponent],
                    },
                    {
                        type: 'collect',
                        components: [payload.limit],
                        terminal: true,
                    },
                ]);
                // Do not remove the facet variable

                messageService.emit('execute-pixel', {
                    insightID: storeService.getWidget(
                        payload.widgetId,
                        'insightID'
                    ),
                    commandList: pixelComponents,
                });
            },
        };

    /**
     * @name get
     * @param id the widget id to get
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets data from the store
     */
    function get(accessor?: string): any {
        return Utility.getter(_state, accessor);
    }

    /**
     * @name set
     * @param id the widget id
     * @param accessor string to set the object
     * @param value the value to set the stored value
     */
    function set(accessor: string, value: any): void {
        Utility.setter(_state, accessor, value);
    }

    /**
     * @name initialize
     * @desc called when the module is loaded
     * @return {void}
     */
    function initialize() {
        // register the actions
        for (const a in _actions) {
            if (_actions.hasOwnProperty(a)) {
                messageService.on(a, _actions[a]);
            }
        }
    }

    return {
        initialize: initialize,
        get: get,
        set: set,
    };
}
