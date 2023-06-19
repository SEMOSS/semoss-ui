module.exports = {
    name: 'Find Connected Nodes',
    description: 'Filter the graph to the connections from a set of nodes',
    icon: require('images/seven-node-graph.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        Frame: ['GRAPH'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | ConnectedNodes(column=["<columnName>"],values=[<instances>],deg=[<degrees>],dir=["<direction>"]);<SMSS_REFRESH>',
                label: 'Filter the graph to the connections from a set of nodes',
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
                        paramName: 'instances',
                        required: true,
                        view: {
                            displayType: 'checklist',
                            label: 'Select the nodes:',
                            attributes: {
                                searchable: true,
                                multiple: true,
                                quickselect: true,
                            },
                        },
                        model: {
                            query: '(infinite = Frame(<SMSS_FRAME.name>) | Select(<columnName>) | Filter(<columnName> ?like "<search>") | Sort(cols=[<columnName>], direction=[asc]) | Iterate()) | Collect(50);',
                            infiniteQuery: 'infinite | Collect(50);',
                            searchParam: 'search',
                            dependsOn: ['columnName', 'search'],
                        },
                    },
                    {
                        paramName: 'degrees',
                        view: {
                            displayType: 'number',
                            label: 'Number of degrees of seperation: ',
                        },
                        model: {
                            defaultValue: 2,
                        },
                        required: true,
                    },
                    {
                        paramName: 'direction',
                        view: {
                            displayType: 'dropdown',
                            label: 'Direction of the traversal: ',
                        },
                        model: {
                            defaultOptions: ['both', 'out', 'in'],
                            defaultValue: 'both',
                        },
                        required: true,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
