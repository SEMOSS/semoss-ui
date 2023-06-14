module.exports = {
    name: 'Predict Column Header',
    description: 'See predicted column headers based on data',
    icon: require('images/tiles.svg'),
    widgetList: {
        showOn: 'all',
    },
    content: {
        json: [
            {
                query: 'AddPanelIfAbsent(999); Panel(999) | SetPanelView("visualization"); SemanticBlending(columns = [<columns>],display = [<display>], randomVals = [<randomVals>], genFrame = [true]); Frame(predictionFrame) | Select(Original_Column, Predicted_Concept , URL, Prob) | Sort(cols = [Original_Column, Prob, Predicted_Concept], dirs = [asc, desc, asc]) | Iterate() |  Format(type=[\'table\']) | TaskOptions({"999":{"layout":"Grid","alignment":{"label":["Original_Column","Predicted_Concept", "URL","Prob"]}}}) | ToUrlType(URL) | Collect(500);',
                label: 'Predict the header for a column of data',
                description:
                    'For the selected column, a probability is given to indicate the likelihood of the predicted header',
                params: [
                    {
                        paramName: 'columns',
                        view: {
                            displayType: 'checklist',
                            label: 'Select Prediction Columns:',
                            attributes: {
                                display: 'alias',
                                value: 'alias',
                                multiple: true,
                                quickselect: true,
                                searchable: true,
                            },
                        },
                        model: {
                            query: '<SMSS_FRAME.name> | FrameHeaders();',
                        },
                        required: true,
                        useSelectedValues: true,
                    },
                    {
                        paramName: 'display',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select Number of Suggestions:',
                        },
                        model: {
                            defaultOptions: ['1', '2', '3', '4', '5'],
                            defaultValue: '1',
                        },
                    },
                    {
                        paramName: 'randomVals',
                        view: {
                            displayType: 'freetext',
                            label: 'Enter Number of Random Values:',
                        },
                        model: {
                            defaultValue: '20',
                        },
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
