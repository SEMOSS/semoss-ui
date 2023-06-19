module.exports = {
    name: 'Frame',
    description: 'Blend from FRAME',
    icon: require('images/grid.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {},
    pipeline: {
        parameters: {
            SMSS_FRAME: {
                frame: true,
            },
        },
        input: ['SMSS_FRAME'],
    },
};
