export const formatdatapoints = (apiData, data) => {
    const getToolTipContent = (color, Data, apiData) => {
        return `
        <div>
            <span style="color:${color}">\u25CF</span>
            ${Data.label.formatter.toString()}<br>
            ${getXAxisTooltipName()} ${apiData.headers[1]}: ${Data.value[0]}<br>
            ${getYAxisTooltipName()} ${apiData.headers[2]}: ${Data.value[1]}<br>
        </div>
    `;
    };
    function getXAxisTooltipName() {
        return data.option['_state']['fields']['XAxisDataType'] == 'NUMBER'
            ? 'Average of'
            : 'Count of';
    }
    function getYAxisTooltipName() {
        return data.option['_state']['fields']['YAxisDataType'] == 'NUMBER'
            ? 'Average of'
            : 'Count of';
    }
    function getSizeTooltipName() {
        return data.option['_state']['fields']['sizeDataType'] == 'NUMBER'
            ? 'Average of'
            : 'Count of';
    }
    function getTooltipName() {
        return data.option['_state']['fields']['tooltipDataType'] == 'NUMBER'
            ? 'Average of'
            : 'Count of';
    }
    if (apiData['values']) {
        if (data.option.hasOwnProperty('_state')) {
            if (data.option['_state'].hasOwnProperty('fields')) {
                if (
                    data.option['_state']['fields']['label'] &&
                    data.option['_state']['fields']['XAxis'] &&
                    data.option['_state']['fields']['YAxis'] &&
                    data.option['_state']['fields']['size'] &&
                    data.option['_state']['fields']['color'] &&
                    data.option['_state']['fields']['tooltip']
                ) {
                    return function (params) {
                        const { data: Data, color } = params;
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['color'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.value[0]}<br>                                                                
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['color'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.value[1]}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['color'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.value[0]}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['color'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.value[1]}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['color'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.value[0]}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['color'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.value[1]}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['color'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.value[0]}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['color'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.value[1]}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['tooltip'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.itemStyle.colorValue}<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['tooltip'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.itemStyle.colorValue}<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['tooltip'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.itemStyle.colorValue}<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['tooltip'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.itemStyle.colorValue}<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${
                                    data.option['_state']['fields']['color']
                                }: ${Data.itemStyle.colorValue}<br>
                                                                    ${getTooltipName()} ${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${
                                    data.option['_state']['fields']['color']
                                }: ${Data.itemStyle.colorValue}<br>
                                                                    ${getTooltipName()} ${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['tooltip'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                    Unique Group Concat of ${
                                                                        data
                                                                            .option[
                                                                            '_state'
                                                                        ][
                                                                            'fields'
                                                                        ][
                                                                            'color'
                                                                        ]
                                                                    }: ${
                                    Data.itemStyle.colorValue
                                }<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['tooltip'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                    Unique Group Concat of ${
                                                                        data
                                                                            .option[
                                                                            '_state'
                                                                        ][
                                                                            'fields'
                                                                        ][
                                                                            'color'
                                                                        ]
                                                                    }: ${
                                    Data.itemStyle.colorValue
                                }<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${
                                    data.option['_state']['fields']['color']
                                }: ${Data.itemStyle.colorValue}<br>
                                                                    ${getTooltipName()} ${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${
                                    data.option['_state']['fields']['color']
                                }: ${Data.itemStyle.colorValue}<br>
                                                                    ${getTooltipName()} ${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.itemStyle.colorValue}<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.itemStyle.colorValue}<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['color'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                    Unique Group Concat of ${
                                                                        data
                                                                            .option[
                                                                            '_state'
                                                                        ][
                                                                            'fields'
                                                                        ][
                                                                            'color'
                                                                        ]
                                                                    }: ${
                                    Data.itemStyle.colorValue
                                }
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['color'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                    Unique Group Concat of ${
                                                                        data
                                                                            .option[
                                                                            '_state'
                                                                        ][
                                                                            'fields'
                                                                        ][
                                                                            'color'
                                                                        ]
                                                                    }: ${
                                    Data.itemStyle.colorValue
                                }
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${
                                    data.option['_state']['fields']['color']
                                }: ${Data.itemStyle.colorValue}<br>
                                                                    ${getTooltipName()} ${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${
                                    data.option['_state']['fields']['color']
                                }: ${Data.itemStyle.colorValue}<br>
                                                                    ${getTooltipName()} ${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.itemStyle.colorValue}<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.itemStyle.colorValue}<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['color'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                    Unique Group Concat of ${
                                                                        data
                                                                            .option[
                                                                            '_state'
                                                                        ][
                                                                            'fields'
                                                                        ][
                                                                            'color'
                                                                        ]
                                                                    }: ${
                                    Data.itemStyle.colorValue
                                }<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['color'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                    Unique Group Concat of ${
                                                                        data
                                                                            .option[
                                                                            '_state'
                                                                        ][
                                                                            'fields'
                                                                        ][
                                                                            'color'
                                                                        ]
                                                                    }: ${
                                    Data.itemStyle.colorValue
                                }<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['size'] ==
                                data.option['_state']['fields']['tooltip'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                    Unique Group Concat of ${
                                                                        data
                                                                            .option[
                                                                            '_state'
                                                                        ][
                                                                            'fields'
                                                                        ][
                                                                            'color'
                                                                        ]
                                                                    }: ${
                                    Data.itemStyle.colorValue
                                }<br>
                                                            `
                            );
                        }
                        if (
                            data.option['_state']['fields']['label'] ==
                            data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                        Unique Group Concat of ${
                                                                            data
                                                                                .option[
                                                                                '_state'
                                                                            ][
                                                                                'fields'
                                                                            ][
                                                                                'color'
                                                                            ]
                                                                        }: ${
                                    Data.itemStyle.colorValue
                                }<br>
                                                                        ${getTooltipName()} ${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                                `
                            );
                        }
                        if (
                            data.option['_state']['fields']['size'] ==
                            data.option['_state']['fields']['label']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                            Unique Group Concat of ${
                                                                                data
                                                                                    .option[
                                                                                    '_state'
                                                                                ][
                                                                                    'fields'
                                                                                ][
                                                                                    'color'
                                                                                ]
                                                                            }: ${
                                    Data.itemStyle.colorValue
                                }<br>
                                                                            ${getTooltipName()} ${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                                    `
                            );
                        }
                        if (
                            data.option['_state']['fields']['tooltip'] ==
                            data.option['_state']['fields']['label']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                                Unique Group Concat of ${
                                                                                    data
                                                                                        .option[
                                                                                        '_state'
                                                                                    ][
                                                                                        'fields'
                                                                                    ][
                                                                                        'color'
                                                                                    ]
                                                                                }: ${
                                    Data.itemStyle.colorValue
                                }<br>
                                                                                ${getTooltipName()} ${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${
                                    data.option['_state']['fields']['color']
                                }: ${Data.itemStyle.colorValue}<br>
                                                                ${getTooltipName()} ${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                Unique Group Concat of ${
                                                                    data.option[
                                                                        '_state'
                                                                    ]['fields'][
                                                                        'color'
                                                                    ]
                                                                }: ${
                                    Data.value[0]
                                }<br>
                                                                ${getTooltipName()} ${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                Unique Group Concat of ${
                                                                    data.option[
                                                                        '_state'
                                                                    ]['fields'][
                                                                        'color'
                                                                    ]
                                                                }: ${
                                    Data.itemStyle.colorValue
                                }<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${
                                    data.option['_state']['fields']['color']
                                }: ${Data.itemStyle.colorValue}<br>
                                                                ${getTooltipName()} ${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                Unique Group Concat of ${
                                                                    data.option[
                                                                        '_state'
                                                                    ]['fields'][
                                                                        'color'
                                                                    ]
                                                                }: ${
                                    Data.value[1]
                                }<br>
                                                                ${getTooltipName()} ${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                Unique Group Concat of ${
                                                                    data.option[
                                                                        '_state'
                                                                    ]['fields'][
                                                                        'color'
                                                                    ]
                                                                }: ${
                                    Data.itemStyle.colorValue
                                }<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['size'] ==
                            data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                Unique Group Concat of ${
                                                                    data.option[
                                                                        '_state'
                                                                    ]['fields'][
                                                                        'color'
                                                                    ]
                                                                }: ${
                                    Data.symbolSize
                                }<br>
                                                                ${getTooltipName()} ${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['size'] ==
                            data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                Unique Group Concat of ${
                                                                    data.option[
                                                                        '_state'
                                                                    ]['fields'][
                                                                        'color'
                                                                    ]
                                                                }: ${
                                    Data.itemStyle.colorValue
                                }<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['color'] ==
                            data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                Unique Group Concat of ${
                                                                    data.option[
                                                                        '_state'
                                                                    ]['fields'][
                                                                        'color'
                                                                    ]
                                                                }: ${
                                    Data.itemStyle.colorValue
                                }<br>
                                                        `
                            );
                        }
                        return (
                            getToolTipContent(color, Data, apiData) +
                            `${getSizeTooltipName()} ${
                                data.option['_state']['fields']['size']
                            }: ${Data.symbolSize}<br>
                                                                Unique Group Concat of ${
                                                                    apiData
                                                                        .headers[4]
                                                                }: ${
                                Data.itemStyle.colorValue
                            }<br>
                                ${getTooltipName()} ${apiData.headers[5]}: ${
                                Data.tooltipValue
                            }<br>
                        `
                        );
                    };
                }
                if (
                    data.option['_state']['fields']['label'] &&
                    data.option['_state']['fields']['XAxis'] &&
                    data.option['_state']['fields']['YAxis'] &&
                    data.option['_state']['fields']['size'] &&
                    data.option['_state']['fields']['color']
                ) {
                    return function (params) {
                        const { data: Data, color } = params;
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.value[0]}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.value[1]}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.value[0]}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.value[0]}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.itemStyle.colorValue}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.itemStyle.colorValue}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['label'] ==
                            data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                Unique Group Concat of ${
                                                                    data.option[
                                                                        '_state'
                                                                    ]['fields'][
                                                                        'color'
                                                                    ]
                                                                }: ${
                                    Data.itemStyle.colorValue
                                }<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['size'] ==
                            data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                Unique Group Concat of ${
                                                                    data.option[
                                                                        '_state'
                                                                    ]['fields'][
                                                                        'color'
                                                                    ]
                                                                }: ${
                                    Data.symbolSize
                                }<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.itemStyle.colorValue}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.itemStyle.colorValue}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                 Unique Group Concat of ${
                                                                     data
                                                                         .option[
                                                                         '_state'
                                                                     ][
                                                                         'fields'
                                                                     ]['color']
                                                                 }: ${
                                    Data.itemStyle.colorValue
                                }<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                Unique Group Concat of ${
                                                                    data.option[
                                                                        '_state'
                                                                    ]['fields'][
                                                                        'color'
                                                                    ]
                                                                }: ${
                                    Data.itemStyle.colorValue
                                }<br>
                                                        `
                            );
                        }
                        return (
                            getToolTipContent(color, Data, apiData) +
                            `${getSizeTooltipName()} ${
                                data.option['_state']['fields']['size']
                            }: ${Data.symbolSize}<br>
                                                                Unique Group Concat of ${
                                                                    apiData
                                                                        .headers[4]
                                                                }: ${
                                Data.itemStyle.colorValue
                            }<br>
                        `
                        );
                    };
                }
                if (
                    data.option['_state']['fields']['label'] &&
                    data.option['_state']['fields']['XAxis'] &&
                    data.option['_state']['fields']['YAxis'] &&
                    data.option['_state']['fields']['color'] &&
                    data.option['_state']['fields']['tooltip']
                ) {
                    return function (params) {
                        const { data: Data, color } = params;
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['color'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.value[0]}<br>
                                                                `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['color'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.value[1]}<br>
                                                                `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['color'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.value[0]}<br>
                                                                `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['color'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.value[1]}<br>
                                                                `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['tooltip'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['tooltip']}: ${Data.itemStyle.colorValue}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['tooltip'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['tooltip']}: ${Data.itemStyle.colorValue}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['label'] ==
                            data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${
                                    data.option['_state']['fields']['color']
                                }: ${Data.itemStyle.colorValue}<br>
                                                                ${getTooltipName()} ${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['color'] ==
                            data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${
                                    data.option['_state']['fields']['color']
                                }: ${Data.itemStyle.colorValue}<br>
                                ${getTooltipName()} ${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                                `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${
                                    data.option['_state']['fields']['color']
                                }: ${Data.value[0]}<br>
                                                                        ${getTooltipName()} ${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                                `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${
                                    data.option['_state']['fields']['color']
                                }: ${Data.value[1]}<br>
                                                                        ${getTooltipName()} ${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                                `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.itemStyle.colorValue}<br>
                                                                `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                ` Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.itemStyle.colorValue}<br>
                                                                `
                            );
                        }
                        return (
                            getToolTipContent(color, Data, apiData) +
                            `Unique Group Concat of ${apiData.headers[3]}: ${
                                Data.itemStyle.colorValue
                            }<br>
                                ${getTooltipName()} ${apiData.headers[4]}: ${
                                Data.tooltipValue
                            }<br>
                        `
                        );
                    };
                }
                if (
                    data.option['_state']['fields']['label'] &&
                    data.option['_state']['fields']['XAxis'] &&
                    data.option['_state']['fields']['YAxis'] &&
                    data.option['_state']['fields']['size'] &&
                    data.option['_state']['fields']['tooltip']
                ) {
                    return function (params) {
                        const { data: Data, color } = params;
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return getToolTipContent(color, Data, apiData);
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return getToolTipContent(color, Data, apiData);
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return getToolTipContent(color, Data, apiData);
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['tooltip']
                        ) {
                            return getToolTipContent(color, Data, apiData);
                        }
                        if (
                            data.option['_state']['fields']['size'] ==
                            data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                        `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getTooltipName()}${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.value[0]}<br>
                                                                `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getTooltipName()}${
                                    data.option['_state']['fields']['tooltip']
                                }: ${Data.tooltipValue}<br>
                                                                `
                            );
                        }
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `${getSizeTooltipName()} ${
                                    data.option['_state']['fields']['size']
                                }: ${Data.symbolSize}<br>
                                                                `
                            );
                        }
                        return (
                            getToolTipContent(color, Data, apiData) +
                            `${getSizeTooltipName()} ${apiData.headers[3]}: ${
                                Data.symbolSize
                            }<br>
                                ${getTooltipName()}${apiData.headers[4]}: ${
                                Data.tooltipValue
                            }<br>
                        `
                        );
                    };
                }
                if (
                    data.option['_state']['fields']['label'] &&
                    data.option['_state']['fields']['XAxis'] &&
                    data.option['_state']['fields']['YAxis'] &&
                    data.option['_state']['fields']['color']
                ) {
                    return function (params) {
                        const { data: Data, color } = params;
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.value[0]}<br>
                                `
                            );
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${data.option['_state']['fields']['color']}: ${Data.value[1]}<br>
                                    `
                            );
                        }
                        if (
                            data.option['_state']['fields']['label'] ==
                            data.option['_state']['fields']['color']
                        ) {
                            return (
                                getToolTipContent(color, Data, apiData) +
                                `Unique Group Concat of ${
                                    data.option['_state']['fields']['color']
                                }: ${Data.label.formatter.toString()}<br>
                                    `
                            );
                        }
                        return (
                            getToolTipContent(color, Data, apiData) +
                            `Unique Group Concat of ${apiData.headers[3]}: ${Data.itemStyle.colorValue}<br>
                        `
                        );
                    };
                }
                if (
                    data.option['_state']['fields']['label'] &&
                    data.option['_state']['fields']['XAxis'] &&
                    data.option['_state']['fields']['YAxis'] &&
                    data.option['_state']['fields']['size']
                ) {
                    return function (params) {
                        const { data: Data, color } = params;
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size']
                        ) {
                            return getToolTipContent(color, Data, apiData);
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size']
                        ) {
                            return getToolTipContent(color, Data, apiData);
                        }
                        return (
                            getToolTipContent(color, Data, apiData) +
                            `${getSizeTooltipName()} ${apiData.headers[3]}: ${
                                Data.symbolSize
                            }<br>
                        `
                        );
                    };
                }
                if (
                    data.option['_state']['fields']['label'] &&
                    data.option['_state']['fields']['XAxis'] &&
                    data.option['_state']['fields']['YAxis'] &&
                    data.option['_state']['fields']['tooltip']
                ) {
                    return function (params) {
                        const { data: Data, color } = params;
                        if (
                            data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                        ) {
                            return getToolTipContent(color, Data, apiData);
                        }
                        if (
                            data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                        ) {
                            return getToolTipContent(color, Data, apiData);
                        }
                        return (
                            getToolTipContent(color, Data, apiData) +
                            `${getTooltipName()} ${apiData.headers[3]}: ${
                                Data.tooltipValue
                            }<br>
                        `
                        );
                    };
                }
                if (
                    data.option['_state']['fields']['label'] &&
                    data.option['_state']['fields']['XAxis'] &&
                    data.option['_state']['fields']['YAxis']
                ) {
                    return function (params) {
                        const { data: Data, color } = params;
                        return getToolTipContent(color, Data, apiData);
                    };
                }
            }
            return '';
        }
        return '';
    }
    return '';
};
