module.exports = {
    name: 'Edit X-Axis',
    description: 'Customize the x-axis settings',
    icon: require('images/xy-axes.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'edit-x-axis',
        },
    },
    lazy: true,
};
