module.exports = {
    name: 'Input Description Generator',
    description: 'Retrieve a semantic description for an input.',
    icon: require('images/text-document.svg'),
    widgetList: {
        groups: ['analytics'],
        showOn: 'none',
    },
    content: {
        json: [
            {
                query: '<SMSS_FRAME.name> | SemanticDescription(input=["<input>"]); Panel("<SMSS_PANEL_ID>")|SetPanelView("visualization"); Frame(SemanticMeaning)|Select(SemanticMeaning, Url).as([SemanticMeaning, Url])|With(Panel("<SMSS_PANEL_ID>"))|Format(type=["table"])|TaskOptions({"<SMSS_PANEL_ID>":{"layout":"Grid","alignment":{"label":["SemanticMeaning","Url"]}}})|Collect(500); Panel("<SMSS_PANEL_ID>")|AddPanelOrnaments({"tools":{"shared":{"gridStylingCols":["Url"],"gridColStyle":"Rows as links"}}});',
                label: 'Retrieve a semantic description for an input.',
                description: 'Retrieve a semantic description for an input.',
                listeners: [
                    'addedData',
                    'updateFrame',
                    'updateTask',
                    'selectedData',
                ],
                params: [
                    {
                        paramName: 'input',
                        view: {
                            displayType: 'freetext',
                            label: 'Input Value',
                        },
                        model: {
                            replaceSpacesWithUnderscores: false,
                        },
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
