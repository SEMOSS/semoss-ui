module.exports = {
    name: 'Add Database Index',
    description: 'Add indicies to a database to increase search performance',
    icon: require('images/database-index.png'),
    widgetList: {
        showOn: 'all',
    },
    content: {
        json: [
            {
                query: 'AddDatabaseIndex(app=["<database>"], concept=["<concept>"], column=["<column>"]);',
                label: 'Add Database Index',
                description:
                    'Add indicies to a database to increase search performance',
                params: [
                    {
                        paramName: 'database',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select a Database:',
                            attributes: {
                                display: 'app_name',
                                value: 'app_id',
                            },
                        },
                        model: {
                            query: 'GetDatabaseList("RDBMS");',
                        },
                    },
                    {
                        paramName: 'concept',
                        required: true,
                        view: {
                            displayType: 'dropdown',
                            label: 'Select Table:',
                            attributes: {
                                searchable: true,
                                multiple: true,
                                quickselect: true,
                            },
                        },
                        model: {
                            dependsOn: ['database'],
                            query: 'GetDatabaseConcepts(database=["<database>"]);',
                        },
                        useSelectedValues: true,
                    },
                    {
                        paramName: 'column',
                        required: true,
                        view: {
                            displayType: 'dropdown',
                            label: 'Select Column:',
                            attributes: {
                                searchable: true,
                                multiple: true,
                                quickselect: true,
                            },
                        },
                        model: {
                            dependsOn: ['database', 'concept'],
                            query: 'GetSpecificConceptProperties(database=["<database>"], concept=["<concept>"]);',
                        },
                        useSelectedValues: true,
                    },
                ],
                execute: 'button',
            },
        ],
    },
    // 'pipeline': {
    //     'group': 'Transform'
    // }
};
