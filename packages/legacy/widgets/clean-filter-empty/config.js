module.exports = {
    name: 'Filter Empty Values',
    description: 'Filter out the empty values for a column',
    icon: require('images/null.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table'],
        Frame: ['R'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | FrameFilterEmptyValues(columns=["<column>"]);<SMSS_REFRESH_INSIGHT>',
                label: 'Filter Empty Values',
                description:
                    'Filter out the empty values in a column. Note: this only adds a filter and does not remove the empty values from your data.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'column',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select a column to filter:',
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
    pipeline: {
        group: 'Transform',
    },
};
