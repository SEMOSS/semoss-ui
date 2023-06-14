module.exports = {
    name: 'Remove Columns',
    description: 'Remove the selected columns from your data.',
    icon: require('images/times-circle.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table'],
        Frame: ['R', 'PY'],
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | DropColumn(columns=[<columns>]);<SMSS_AUTO>',
                label: 'Remove Column',
                description: 'Remove columns from your data.',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'columns',
                        view: {
                            displayType: 'checklist',
                            label: 'Select columns to remove:',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                                multiple: true,
                                searchable: true,
                                quickselect: true,
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
