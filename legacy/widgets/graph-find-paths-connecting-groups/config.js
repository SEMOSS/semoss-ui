module.exports = {
    name: 'Find Group Connections',
    description: 'Find all paths connecting two different groups of nodes',
    icon: require('images/thirteen-node-graph.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        Frame: ['GRAPH'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | FindPathsConnectingGroups(column1=["<columnName1>"],values1=[<instances1>],column2=["<columnName2>"],values2=[<instances2>],max=[<max>]);<SMSS_REFRESH>',
                label: 'Filter all paths connecting the set of groups of nodes',
                params: [
                    {
                        paramName: 'columnName1',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select a node type for group 1:',
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
                        paramName: 'search1',
                        view: false,
                        model: {
                            defaultValue: '',
                        },
                    },
                    {
                        paramName: 'instances1',
                        required: true,
                        view: {
                            displayType: 'checklist',
                            label: 'Select the nodes within group 1:',
                            attributes: {
                                searchable: true,
                                multiple: true,
                                quickselect: true,
                            },
                        },
                        model: {
                            query: '(infinite = Frame(<SMSS_FRAME.name>) | Select(<columnName1>) | Filter(<columnName1> ?like "<search1>") | Sort(cols=[<columnName1>], direction=[asc]) | Iterate()) | Collect(50);',
                            infiniteQuery: 'infinite | Collect(50);',
                            searchParam: 'search1',
                            dependsOn: ['columnName1', 'search1'],
                        },
                    },

                    {
                        paramName: 'columnName2',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select a node type for group 2:',
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
                        paramName: 'search2',
                        view: false,
                        model: {
                            defaultValue: '',
                        },
                    },
                    {
                        paramName: 'instances2',
                        required: true,
                        view: {
                            displayType: 'checklist',
                            label: 'Select the nodes within group 2:',
                            attributes: {
                                searchable: true,
                                multiple: true,
                                quickselect: true,
                            },
                        },
                        model: {
                            query: '(infinite = Frame(<SMSS_FRAME.name>) | Select(<columnName2>) | Filter(<columnName2> ?like "<search2>") | Sort(cols=[<columnName2>], direction=[asc]) | Iterate()) | Collect(50);',
                            infiniteQuery: 'infinite | Collect(50);',
                            searchParam: 'search2',
                            dependsOn: ['columnName2', 'search2'],
                        },
                    },

                    {
                        paramName: 'max',
                        view: {
                            displayType: 'number',
                            label: 'Maximum number of traversals for each path: ',
                        },
                        model: {
                            defaultValue: 5,
                        },
                        required: true,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
