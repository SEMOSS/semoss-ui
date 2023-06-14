module.exports = {
    name: 'Remove Intermediary Node From Graph',
    description:
        'Drop a node and all its connections while merging in and out vertices together',
    icon: require('images/remove-node.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        Frame: ['GRAPH'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | RemoveIntermediaryNode(column=["<columnName>"]);<SMSS_REFRESH>',
                label: 'Drop a node and all its connections while merging in and out vertices together',
                description:
                    'Drop a node and all its connections while merging in and out vertices together',
                params: [
                    {
                        paramName: 'columnName',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select a vertex type to remove:',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders();',
                        },
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
