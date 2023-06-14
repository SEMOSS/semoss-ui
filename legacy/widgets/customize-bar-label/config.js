module.exports = {
    name: 'Customize Value Labels',
    description: 'Customize the value label settings of your bar chart',
    icon: require('images/bookmark.svg'),
    widgetList: {
        showOn: 'none',
    },
    content: {
        json: [
            {
                label: 'Customize Value Labels',
                description:
                    'Customize the value label settings on your visualization',
                query: 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"displayValues":true,"customizeBarLabel":{"showLabel":"Yes","position":"<position>","rotate":"<rotate>","align":"<align>","fontFamily":"<fontFamily>","fontSize":"<fontSize>","fontWeight":"<fontWeight>","fontColor":"<fontColor>"}}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.displayValues");Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.customizeBarLabel");',
                params: [
                    {
                        paramName: 'position',
                        view: {
                            displayType: 'dropdown',
                            label: 'Choose a Position for the Label:',
                        },
                        model: {
                            defaultValue: 'top',
                            defaultOptions: [
                                'top',
                                'left',
                                'right',
                                'bottom',
                                'inside',
                                'insideLeft',
                                'insideRight',
                                'insideTop',
                                'insideBottom',
                            ],
                        },
                        required: true,
                    },
                    {
                        paramName: 'rotate',
                        view: {
                            displayType: 'number',
                            label: 'Rotate Label (degrees):',
                        },
                        model: {
                            defaultValue: 0,
                            defaultOptions: [],
                        },
                        required: true,
                    },
                    {
                        paramName: 'align',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select Alignment:',
                        },
                        model: {
                            defaultValue: 'center',
                            defaultOptions: ['left', 'center', 'right'],
                        },
                        required: true,
                    },
                    {
                        paramName: 'fontFamily',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select Font:',
                        },
                        model: {
                            defaultValue: 'sans-serif',
                            defaultOptions: [
                                'sans-serif',
                                'serif',
                                'monospace',
                            ],
                        },
                        required: true,
                    },
                    {
                        paramName: 'fontSize',
                        view: {
                            displayType: 'number',
                            label: 'Select Font Size (Default: 12):',
                        },
                        model: {
                            defaultValue: 12,
                            defaultOptions: [],
                        },
                        required: true,
                    },
                    {
                        paramName: 'fontWeight',
                        view: {
                            displayType: 'dropdown',
                            label: 'Select Font Weight:',
                        },
                        model: {
                            defaultValue: 'normal',
                            defaultOptions: ['normal', 'bold'],
                        },
                        required: true,
                    },
                    {
                        paramName: 'fontColor',
                        view: {
                            displayType: 'color-picker',
                            label: 'Set Font Color:',
                        },
                        model: {
                            defaultValue: '#000000',
                            defaultOptions: [],
                        },
                        required: true,
                    },
                ],
                execute: 'button',
            },
        ],
    },
};
