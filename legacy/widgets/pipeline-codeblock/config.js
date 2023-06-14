module.exports = {
    name: 'Code Block',
    description: 'Run custom Pixel, Python or R in the Pipeline',
    icon: require('images/code.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'terminal',
            options: {
                location: 'pipeline',
            },
        },
    },
    pipeline: {
        group: 'Transform',
        parameters: {
            SOURCE: {
                frame: true,
            },
            CODE: {
                frame: false,
                value: '',
            },
            FILES: {
                frame: false,
                value: '',
            },
            LANGUAGE: {
                frame: false,
                value: '',
            },
        },
        input: ['SOURCE'],
        pixel: '<CODE>;',
    },
};
