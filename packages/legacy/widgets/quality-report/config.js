module.exports = {
    name: 'Data Quality Report',
    description: 'Generate a Data Quality Report',
    icon: require('images/quality-report.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table'],
        Frame: ['R', 'PY'],
    },
    content: {
        template: {
            name: 'quality-report',
            options: {},
        },
    },
    // 'pipeline': {
    //     'group': 'Transform',
    //     'input': ['SOURCE'],
    //     'parameters': {
    //         'SOURCE': {
    //             'frame': true
    //         },
    //         'DATA_QUALITY': {
    //             'type': 'DATA_QUALITY'
    //         }
    //     },
    //     'pixel': '<SOURCE.name> | RunDataQuality(<DATA_QUALITY>);'
    // },
    lazy: true,
};
