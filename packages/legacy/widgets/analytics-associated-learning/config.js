module.exports = {
    name: 'Associated Rules',
    description:
        'Find rules in your data that can be applied as a generalization.',
    icon: require('images/analytics-associated-learning.svg'),
    widgetList: {
        showOn: 'none',
    },
    required: {
        R: ['data.table', 'dplyr', 'arules', 'stringr'],
        Frame: ['R'],
    },
    content: {
        json: [
            {
                label: 'Associated Rules',
                description:
                    'Find rules in your data that can be applied as a generalization based on an initial condition (i.e. Premise) or a desired final state (i.e. Outcome).',
                listeners: [
                    'updateTask',
                    'updateFrame',
                    'addedData',
                    'selectedData',
                ],
                query: 'p1=AddPanel();p1|SetPanelView("visualization", "<encode>{"type":"echarts"}</encode>"); p1|SetPanelLabel("Associated Rules Output"); <SMSS_FRAME.name> | RunAssociatedLearning(ruleSide=[<ruleSide>], column=["<column>"] , values=[<values>] , attributes=[<attributes>], conf = [<conf>],support = [<supp>],lift=[<lift>], panel=[GetPanelId(p1)]); RemoveVariable(p1); ',
                params: [
                    {
                        paramName: 'ruleSide',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select if rule is premise or outcome:',
                        },
                        model: {
                            defaultValue: 'Outcome',
                            defaultOptions: ['Premise', 'Outcome'],
                        },
                        required: true,
                    },
                    {
                        paramName: 'column',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select the column to apply the rule: ',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders(headerTypes=["STRING"]);',
                        },
                        required: true,
                    },
                    {
                        paramName: 'values',
                        view: {
                            displayType: 'checklist',
                            label: 'Select the rule to apply for the column: ',
                            attributes: {
                                multiple: true,
                                quickselect: true,
                                searchable: true,
                            },
                        },
                        model: {
                            query: 'Frame(frame=[<SMSS_FRAME.name>]) | Select(<column>) | Collect(-1);',
                            dependsOn: ['column'],
                        },
                        required: true,
                    },
                    {
                        paramName: 'attributes',
                        view: {
                            displayType: 'checklist',
                            label: 'Select the attributes to include: ',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                                multiple: true,
                                quickselect: true,
                                searchable: true,
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders(headerTypes=["STRING", "NUMBER"]);',
                        },
                        required: true,
                        link: 'instance',
                    },
                    {
                        paramName: 'conf',
                        view: {
                            displayType: 'number',
                            label: 'Confidence (Between 0 and 1):',
                            attributes: {
                                multiple: false,
                                step: 0.01,
                            },
                        },
                        model: {
                            defaultValue: 0.8,
                            min: 0,
                            max: 1,
                        },
                        required: true,
                    },
                    {
                        paramName: 'supp',
                        view: {
                            displayType: 'number',
                            label: 'Support (Between 0 and 1):',
                            attributes: {
                                multiple: false,
                                step: 0.01,
                            },
                        },
                        model: {
                            defaultValue: 0.1,
                            min: 0,
                            max: 1,
                        },
                        required: true,
                    },
                    {
                        paramName: 'lift',
                        view: {
                            displayType: 'number',
                            label: 'Lift (Greater than 1):',
                            attributes: {
                                multiple: false,
                            },
                        },
                        model: {
                            defaultValue: 1,
                            min: 1,
                        },
                        required: true,
                    },
                ],
                execute: 'button',
            },
        ],
    },
    pipeline: {
        group: 'Transform',
    },
};
