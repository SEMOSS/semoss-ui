module.exports = {
    name: 'Database Query Translator',
    description: 'Translate SQL query from a database to new database. ',
    icon: require('images/plus.svg'),
    widgetList: {
        showOn: 'all',
    },
    content: {
        json: [
            {
                query: 'Panel ( 0 ) | SetPanelView ( "text-widget" , "<encode>{"html":"<div style=\'margin-left: 25px; margin-top: 25px;\', ng-repeat=\\"query in test[0].output\\" for=\\"{{query}}\\">{{query}}</div>","varList":[{"name":"test","query":"QueryTranslator(query=[\\"<encode><query></encode>\\"], sourceDB=[\\"<sourceDB>\\"], targetDB=[\\"<targetDB>\\"]);"}],"freeze":false}</encode>" ) ;',
                label: 'Database SQL Query Translator',
                description:
                    'Translate SQL query from a database to a new database.  ',
                params: [
                    {
                        paramName: 'query',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter SQL query:',
                        },
                        model: {
                            replaceSpacesWithUnderscores: false,
                        },
                    },
                    {
                        paramName: 'sourceDB',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select the Source Database:',
                            attributes: {
                                display: 'app_name',
                                value: 'app_id',
                            },
                        },
                        model: {
                            query: 'GetDatabaseList();',
                        },
                    },
                    {
                        paramName: 'targetDB',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select the Target Database:',
                            attributes: {
                                display: 'app_name',
                                value: 'app_id',
                            },
                        },
                        model: {
                            query: 'GetDatabaseList();',
                        },
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
