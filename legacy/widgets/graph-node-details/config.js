module.exports = {
    name: 'Node Details',
    description: 'Display Metrics About a Node',
    icon: require('images/empty-circle.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        Frame: ['GRAPH'],
    },
    content: {
        json: [
            {
                query: 'nodeMetricsPanel = AddPanel(); nodeMetricsPanel|SetPanelView("visualization"); nodeMetricsPanel | SetPanelLabel(\'Details For Node : <instance>\'); <SMSS_FRAME.name> | NodeDetails(column=["<columnName>"],value=[<instance>], panel=[GetPanelId(nodeMetricsPanel)]);RemoveVariable(nodeMetricsPanel);',
                label: 'Show metrics around a specific node',
                params: [
                    {
                        paramName: 'columnName',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select a node type:',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders();',
                        },
                    },
                    {
                        paramName: 'search',
                        view: false,
                        model: {
                            defaultValue: '',
                        },
                    },
                    {
                        paramName: 'instance',
                        required: true,
                        view: {
                            displayType: 'checklist',
                            label: 'Select the nodes:',
                            attributes: {
                                searchable: true,
                                multiple: false,
                                quickselect: true,
                            },
                        },
                        model: {
                            query: '(infinite = Frame(<SMSS_FRAME.name>) | Select(<columnName>) | Filter(<columnName> ?like "<search>") | Sort(columns=[<columnName>], direction=[asc]) | Iterate()) | Collect(50);',
                            infiniteQuery: 'infinite | Collect(50);',
                            searchParam: 'search',
                            dependsOn: ['columnName', 'search'],
                        },
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
