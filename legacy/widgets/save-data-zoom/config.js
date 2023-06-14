module.exports = {
    name: 'Save Zoom',
    description: 'Saves Zoom based on zoom state',
    icon: require('images/toggle-zoom-x.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'save-data-zoom',
            execute: 'auto'
        }
    },
    lazy: true,
};
