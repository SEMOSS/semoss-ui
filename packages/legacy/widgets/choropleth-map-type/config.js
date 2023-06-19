module.exports = {
    name: 'Choropleth Map Type',
    description: 'Specify the type of choropleth to show',
    icon: require('images/choropleth-map-type.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        template: {
            name: 'choropleth-map-type',
        },
    },
    lazy: true,
};
