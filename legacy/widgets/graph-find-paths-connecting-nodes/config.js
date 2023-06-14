module.exports = {
    name: 'Find Node Connections',
    description:
        'Find all paths connecting the set of specified nodes with a given # of degrees of seperation',
    icon: require('images/four-node-graph.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        Frame: ['GRAPH'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | FindPathsConnectingNodes(column=["<columnName>"],values=[<instances>],deg=[<degrees>]);<SMSS_REFRESH>',
                label: 'Filter all paths connecting the set of specified nodes with a given # of degrees of seperation',
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
                            label: 'Select the nodes to find connections between (must select at least 2 values):',
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
                            label: 'Find paths with specific # of degrees of seperation: ',
                        },
                        model: {
                            defaultValue: 2,
                        },
                        required: true,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
