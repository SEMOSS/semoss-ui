module.exports = {
    name: 'Random Forest Model Summary',
    description:
        'Display Prediction Error and Confusion Matrix of a Random Forest Model',
    icon: 'widgets/analytics-random-forest-model-summary/analytics-random-forest-model-summary.svg',
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'analytics-random-forest-model-summary',
        },
    },
    lazy: true,
};
