module.exports = {
    name: 'Edit Grid',
    description: 'Customize the grid settings',
    icon: require('images/edit-grid.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'edit-grid',
        },
    },
    lazy: true,
};
