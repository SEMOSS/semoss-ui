module.exports = {
    name: 'Existing Insight',
    description: 'Select data from a project',
    icon: require('images/insight.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'pipeline-existing-insight',
            options: {},
        },
    },
    pipeline: {
        group: 'Source',
        parameters: {
            SELECTED_APP: {
                frame: false,
            },
            SELECTED_INSIGHT: {
                frame: false,
            },
        },
        input: [],
        pixel: 'LoadInsight(project=["<SELECTED_APP>"], id=["<SELECTED_INSIGHT>"]);',
        showPreview: false,
    },
    lazy: true,
};
