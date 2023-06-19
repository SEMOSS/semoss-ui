module.exports = {
    name: 'Half Donut',
    icon: require('images/halfdonut.svg'),
    widgetList: {
        tags: ['Visualization', 'JVChart'],
        showOn: 'none',
        quickMenu: [],
    },
    content: {
        template: {
            name: 'halfdonut-standard',
        },
    },
    visualization: {
        type: ['standard'],
        group: 'Visualization',
        view: 'visualization',
        layout: 'HalfDonut',
        visibleModes: ['default-mode', 'edit-mode', 'comment-mode'],
        tools: [
            'custom-legend',
            'color-panel',
            'display-values',
            'toggle-legend',
            'refresh-cache',
        ],
        showOnVisualPanel: true,
        visualPanelMenu: {
            USE: 'Part-to-whole',
        },
        format: 'table',
        fields: [
            {
                model: 'label',
                name: 'Label',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'validate',
                optional: false,
                multiField: false,
                description:
                    'Try adding one dimension (i.e. Movie Title). Each instance within this dimension will represent a point on the plot.',
            },
            {
                model: 'value',
                name: 'Value',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: false,
                multiField: false,
                description:
                    'Try adding one or several dimensions (i.e. Movie Budget). The numerical values of these dimensions will represent their respective column size.',
            },
            {
                model: 'targetValue',
                name: 'Target Value',
                acceptableTypes: ['NUMBER'],
                group: 'math',
                optional: true,
                multiField: false,
                description:
                    'Try adding a single numerical dimension. The numerical value of this dimensions will represent the ideal height for your value bar.',
            },
            {
                model: 'tooltip',
                name: 'Tooltip',
                acceptableTypes: ['STRING', 'NUMBER', 'DATE'],
                group: 'math',
                optional: true,
                multiField: true,
                description:
                    'Try adding one or several dimensions (i.e. Director). Each instance of this dimension will appear in the tooltip when hovering.',
            },
        ],
        color: {
            value: {
                multiField: true,
                instances: false,
            },
        },
    },
    lazy: true,
};
