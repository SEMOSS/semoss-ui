module.exports = {
    name: 'NLP Instance Cache',
    description: 'Cache instance values for NLP searching',
    icon: require('images/nlp-instance-cache.svg'),
    widgetList: {
        showOn: 'all',
    },
    content: {
        json: [
            {
                query: 'if(<allCols>, NLPInstanceCache(app=["<database>"],table=[],columns=[],updateExistingValues=[<updateData>]) , NLPInstanceCache(app=["<database>"],table=["<concepts>"], columns=[<properties>], updateExistingValues=[<updateData>]) );',
                label: 'Store Column Values',
                description:
                    'Index values from a selected database to use for NLP searching.\nIf "Store All Values" is checked, you do not need to select a concept or properties.',
                params: [
                    {
                        paramName: 'database',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select Database:',
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
                        paramName: 'allCols',
                        view: {
                            displayType: 'checkbox',
                            attributes: {
                                label: 'Store all values within database',
                            },
                        },
                        model: {
                            defaultValue: 'false',
                        },
                        required: false,
                    },
                    {
                        paramName: 'updateData',
                        view: {
                            displayType: 'checkbox',
                            attributes: {
                                label: 'Overwrite stored values for chosen columns',
                            },
                        },
                        model: {
                            defaultValue: 'false',
                        },
                        required: false,
                    },
                    {
                        paramName: 'concepts',
                        required: false,
                        view: {
                            displayType: 'dropdown',
                            label: 'Select a Concept:',
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
                        paramName: 'properties',
                        required: false,
                        view: {
                            displayType: 'checklist',
                            label: 'Select Properties to Store:',
                            attributes: {
                                searchable: true,
                                multiple: true,
                                quickselect: true,
                            },
                        },
                        model: {
                            dependsOn: ['database', 'concepts'],
                            query: 'GetSpecificConceptProperties(concept=["<concepts>"],database=["<database>"]);',
                        },
                        useSelectedValues: true,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
