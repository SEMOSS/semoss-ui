module.exports = {
    name: 'Calculate Lat/Long',
    description: 'Add Lat/Long columns from a given address column',
    icon: require('images/earth.svg'),
    widgetList: {
        showOn: 'all',
    },
    content: {
        json: [
            {
                label: 'Add Lat/Long columns for a given address column',
                description: 'Adds lat/long columns to the current data table',
                query: 'Frame(<SMSS_FRAME.name>) | Select(<address>) | MapLambda(lambda=["googlelatlong"], columns=["<address>"]) | Merge(joins=[(<address>, inner.join, <address>)], frame=[<SMSS_FRAME.name>]);<SMSS_AUTO>',
                params: [
                    {
                        paramName: 'address',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select the address column: ',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders(headerTypes=["STRING"]);',
                        },
                        required: true,
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
