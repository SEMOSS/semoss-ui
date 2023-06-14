module.exports = {
    name: 'Edit Y-Axis',
    description: 'Customize the y-axis settings',
    icon: require('images/xy-axes.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'edit-y-axis',
        },
    },
    lazy: true,
};
