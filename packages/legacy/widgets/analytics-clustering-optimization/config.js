module.exports = {
    name: 'Clustering Optimization',
    description: 'Run clustering optimization algorithm on data set',
    icon: require('images/analytics-clustering.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Clustering Optimization',
                description:
                    'Runs the clustering optimization analytic routine',
                query: '<SMSS_FRAME.name> | RunMultiClustering(<instance>, <minNumClusters>, <maxNumClusters>, <selectors>);',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'minNumClusters',
                        view: {
                            displayType: 'number',
                            label: 'Choose the minimum number of clusters: ',
                        },
                        model: {
                            defaultValue: 2,
                        },
                        required: true,
                    },
                    {
                        paramName: 'maxNumClusters',
                        view: {
                            displayType: 'number',
                            label: 'Choose the maximum number of clusters: ',
                        },
                        model: {
                            defaultValue: 5,
                        },
                        required: true,
                    },
                    {
                        paramName: 'instance',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select Instance: ',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders();',
                        },
                        required: true,
                    },
                    {
                        paramName: 'selectors',
                        view: {
                            displayType: 'checklist',
                            label: 'Select the attributes to use to cluster the instance: ',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                                multiple: true,
                                quickselect: true,
                                searchable: true,
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders();',
                        },
                        required: true,
                        link: 'instance',
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
