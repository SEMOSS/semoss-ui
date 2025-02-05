export const getSelector = (data) => {
    function getXAxisSelector() {
        return data.option['_state']['fields']['XAxisDataType'] == 'NUMBER'
            ? 'Average'
            : 'Count';
    }
    function getYAxisSelector() {
        return data.option['_state']['fields']['YAxisDataType'] == 'NUMBER'
            ? 'Average'
            : 'Count';
    }
    function getSizeSelector() {
        return data.option['_state']['fields']['sizeDataType'] == 'NUMBER'
            ? 'Average'
            : 'Count';
    }
    function getTooltipSelector() {
        return data.option['_state']['fields']['tooltipDataType'] == 'NUMBER'
            ? 'Average'
            : 'Count';
    }

    let selector = '';
    if (data.hasOwnProperty('columns')) {
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
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        (data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['tooltip'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']) ||
                        (data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['tooltip'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']) ||
                        (data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['YAxis'] ==
                                data.option['_state']['fields']['tooltip'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']) ||
                        (data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['XAxis'] ==
                                data.option['_state']['fields']['tooltip'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color'])
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        (data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']) ||
                        (data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color'])
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getTooltipSelector()}(${
                            data.option['_state']['fields']['tooltip']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['tooltip']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        (data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']) ||
                        (data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color'])
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['tooltip']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getTooltipSelector()}(${
                            data.option['_state']['fields']['tooltip']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['tooltip']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getTooltipSelector()}(${
                            data.option['_state']['fields']['tooltip']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['tooltip']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),(${data.option['_state']['fields']['color']})).as([${
                            data.option['series'][0]['label']['name']
                        }, ${data.option['xAxis']['pixelName']},${
                            data.option['yAxis']['pixelName']
                        },${data.option['_state']['fields']['color']}])|Group(${
                            data.option['series'][0]['label']['name']
                        },${data.option['_state']['fields']['color']})`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),(${data.option['_state']['fields']['color']})).as([${
                            data.option['series'][0]['label']['name']
                        }, ${data.option['xAxis']['pixelName']},${
                            data.option['yAxis']['pixelName']
                        },${data.option['_state']['fields']['color']}])|Group(${
                            data.option['series'][0]['label']['name']
                        },${data.option['_state']['fields']['color']})`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['size']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['size']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getTooltipSelector()}(${
                            data.option['_state']['fields']['tooltip']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['tooltip']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getTooltipSelector()}(${
                            data.option['_state']['fields']['tooltip']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['tooltip']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),(${data.option['_state']['fields']['color']})).as([${
                            data.option['series'][0]['label']['name']
                        }, ${data.option['xAxis']['pixelName']},${
                            data.option['yAxis']['pixelName']
                        },${data.option['_state']['fields']['color']}])|Group(${
                            data.option['series'][0]['label']['name']
                        },${data.option['_state']['fields']['color']})`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),(${data.option['_state']['fields']['color']})).as([${
                            data.option['series'][0]['label']['name']
                        }, ${data.option['xAxis']['pixelName']},${
                            data.option['yAxis']['pixelName']
                        },${data.option['_state']['fields']['color']}])|Group(${
                            data.option['series'][0]['label']['name']
                        },${data.option['_state']['fields']['color']})`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['size']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['size']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['size'] ==
                            data.option['_state']['fields']['tooltip'] &&
                        data.option['_state']['fields']['label'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['size']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['label'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        }),${getTooltipSelector()}(${
                            data.option['_state']['fields']['tooltip']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['size']
                        },${
                            data.option['_state']['fields']['tooltip']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['size']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),(${
                            data.option['_state']['fields']['color']
                        }),${getTooltipSelector()}(${
                            data.option['_state']['fields']['tooltip']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['color']
                        },${
                            data.option['_state']['fields']['tooltip']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        },${data.option['_state']['fields']['color']})`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        }),${getTooltipSelector()}(${
                            data.option['_state']['fields']['tooltip']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['size']
                        },${
                            data.option['_state']['fields']['tooltip']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        }),(${data.option['_state']['fields']['color']})).as([${
                            data.option['series'][0]['label']['name']
                        }, ${data.option['xAxis']['pixelName']},${
                            data.option['yAxis']['pixelName']
                        },${data.option['_state']['fields']['size']},${
                            data.option['_state']['fields']['color']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        },${data.option['_state']['fields']['color']})`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['size']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),(${
                            data.option['_state']['fields']['color']
                        }),${getTooltipSelector()}(${
                            data.option['_state']['fields']['tooltip']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['color']
                        },${
                            data.option['_state']['fields']['tooltip']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        },${data.option['_state']['fields']['color']})`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        }),${getTooltipSelector()}(${
                            data.option['_state']['fields']['tooltip']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['size']
                        },${
                            data.option['_state']['fields']['tooltip']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        }),(${data.option['_state']['fields']['color']})).as([${
                            data.option['series'][0]['label']['name']
                        }, ${data.option['xAxis']['pixelName']},${
                            data.option['yAxis']['pixelName']
                        },${data.option['_state']['fields']['size']},${
                            data.option['_state']['fields']['color']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        },${data.option['_state']['fields']['color']})`);
                    }
                    if (
                        data.option['_state']['fields']['size'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        }),${getTooltipSelector()}(${
                            data.option['_state']['fields']['tooltip']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['size']
                        },${
                            data.option['_state']['fields']['tooltip']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['size'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        }),(${data.option['_state']['fields']['color']})).as([${
                            data.option['series'][0]['label']['name']
                        }, ${data.option['xAxis']['pixelName']},${
                            data.option['yAxis']['pixelName']
                        },${data.option['_state']['fields']['size']},${
                            data.option['_state']['fields']['color']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        },${data.option['_state']['fields']['color']})`);
                    }
                    if (
                        data.option['_state']['fields']['color'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        }),(${data.option['_state']['fields']['color']})).as([${
                            data.option['series'][0]['label']['name']
                        }, ${data.option['xAxis']['pixelName']},${
                            data.option['yAxis']['pixelName']
                        },${data.option['_state']['fields']['size']},${
                            data.option['_state']['fields']['color']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        },${data.option['_state']['fields']['color']})`);
                    }
                    return (selector = `Select(${
                        data.option['series'][0]['label']['name']
                    },${getXAxisSelector()}(${
                        data.option['xAxis']['pixelName']
                    }),${getYAxisSelector()}(${
                        data.option['yAxis']['pixelName']
                    }),${getSizeSelector()}(${
                        data.option['_state']['fields']['size']
                    }),(${
                        data.option['_state']['fields']['color']
                    }),${getTooltipSelector()}(${
                        data.option['_state']['fields']['tooltip']
                    })).as([${data.option['series'][0]['label']['name']}, ${
                        data.option['xAxis']['pixelName']
                    },${data.option['yAxis']['pixelName']},${
                        data.option['_state']['fields']['size']
                    },${data.option['_state']['fields']['color']},${
                        data.option['_state']['fields']['tooltip']
                    }])|Group(${data.option['series'][0]['label']['name']},${
                        data.option['_state']['fields']['color']
                    })`);
                }
                if (
                    data.option['_state']['fields']['label'] &&
                    data.option['_state']['fields']['XAxis'] &&
                    data.option['_state']['fields']['YAxis'] &&
                    data.option['_state']['fields']['size'] &&
                    data.option['_state']['fields']['color']
                ) {
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        (data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']) ||
                        (data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color'])
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['size'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['size']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['size']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),(${data.option['_state']['fields']['color']})).as([${
                            data.option['series'][0]['label']['name']
                        }, ${data.option['xAxis']['pixelName']},${
                            data.option['yAxis']['pixelName']
                        },${data.option['_state']['fields']['color']}])|Group(${
                            data.option['series'][0]['label']['name']
                        },${data.option['_state']['fields']['color']})`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['size']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),(${data.option['_state']['fields']['color']})).as([${
                            data.option['series'][0]['label']['name']
                        }, ${data.option['xAxis']['pixelName']},${
                            data.option['yAxis']['pixelName']
                        },${data.option['_state']['fields']['color']}])|Group(${
                            data.option['series'][0]['label']['name']
                        },${data.option['_state']['fields']['color']})`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['size']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['size']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['label'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['size']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }

                    return (selector = `Select(${
                        data.option['series'][0]['label']['name']
                    },${getXAxisSelector()}(${
                        data.option['xAxis']['pixelName']
                    }),${getYAxisSelector()}(${
                        data.option['yAxis']['pixelName']
                    }),${getSizeSelector()}(${
                        data.option['_state']['fields']['size']
                    }),(${data.option['_state']['fields']['color']})).as([${
                        data.option['series'][0]['label']['name']
                    }, ${data.option['xAxis']['pixelName']},${
                        data.option['yAxis']['pixelName']
                    },${data.option['_state']['fields']['size']},${
                        data.option['_state']['fields']['color']
                    }])|Group(${data.option['series'][0]['label']['name']},${
                        data.option['_state']['fields']['color']
                    })`);
                }
                if (
                    data.option['_state']['fields']['label'] &&
                    data.option['_state']['fields']['XAxis'] &&
                    data.option['_state']['fields']['YAxis'] &&
                    data.option['_state']['fields']['color'] &&
                    data.option['_state']['fields']['tooltip']
                ) {
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        (data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color']) ||
                        (data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip'] &&
                            data.option['_state']['fields']['label'] ==
                                data.option['_state']['fields']['color'])
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['label'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getTooltipSelector()}(${
                            data.option['_state']['fields']['tooltip']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['tooltip']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['color'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),(${data.option['_state']['fields']['color']})).as([${
                            data.option['series'][0]['label']['name']
                        }, ${data.option['xAxis']['pixelName']},${
                            data.option['yAxis']['pixelName']
                        },${data.option['_state']['fields']['color']}])|Group(${
                            data.option['series'][0]['label']['name']
                        },${data.option['_state']['fields']['color']})`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getTooltipSelector()}(${
                            data.option['_state']['fields']['tooltip']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['tooltip']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getTooltipSelector()}(${
                            data.option['_state']['fields']['tooltip']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['tooltip']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),(${data.option['_state']['fields']['color']})).as([${
                            data.option['series'][0]['label']['name']
                        }, ${data.option['xAxis']['pixelName']},${
                            data.option['yAxis']['pixelName']
                        },${data.option['_state']['fields']['color']}])|Group(${
                            data.option['series'][0]['label']['name']
                        },${data.option['_state']['fields']['color']})`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),(${data.option['_state']['fields']['color']})).as([${
                            data.option['series'][0]['label']['name']
                        }, ${data.option['xAxis']['pixelName']},${
                            data.option['yAxis']['pixelName']
                        },${data.option['_state']['fields']['color']}])|Group(${
                            data.option['series'][0]['label']['name']
                        },${data.option['_state']['fields']['color']})`);
                    }
                    return (selector = `Select(${
                        data.option['series'][0]['label']['name']
                    },${getXAxisSelector()}(${
                        data.option['xAxis']['pixelName']
                    }),${getYAxisSelector()}(${
                        data.option['yAxis']['pixelName']
                    }),(${
                        data.option['_state']['fields']['color']
                    }),${getTooltipSelector()}(${
                        data.option['_state']['fields']['tooltip']
                    })).as([${data.option['series'][0]['label']['name']}, ${
                        data.option['xAxis']['pixelName']
                    },${data.option['yAxis']['pixelName']},${
                        data.option['_state']['fields']['color']
                    },${data.option['_state']['fields']['tooltip']}])|Group(${
                        data.option['series'][0]['label']['name']
                    },${data.option['_state']['fields']['color']})`);
                }
                if (
                    data.option['_state']['fields']['label'] &&
                    data.option['_state']['fields']['XAxis'] &&
                    data.option['_state']['fields']['YAxis'] &&
                    data.option['_state']['fields']['size'] &&
                    data.option['_state']['fields']['tooltip']
                ) {
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['size'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['size']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['size']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getTooltipSelector()}(${
                            data.option['_state']['fields']['tooltip']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['tooltip']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['size']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getTooltipSelector()}(${
                            data.option['_state']['fields']['tooltip']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['tooltip']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['size']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        }),${getSizeSelector()}(${
                            data.option['_state']['fields']['size']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']},${
                            data.option['_state']['fields']['size']
                        }])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }

                    return (selector = `Select(${
                        data.option['series'][0]['label']['name']
                    },${getXAxisSelector()}(${
                        data.option['xAxis']['pixelName']
                    }),${getYAxisSelector()}(${
                        data.option['yAxis']['pixelName']
                    }),${getSizeSelector()}(${
                        data.option['_state']['fields']['size']
                    }),${getTooltipSelector()}(${
                        data.option['_state']['fields']['tooltip']
                    })).as([${data.option['series'][0]['label']['name']}, ${
                        data.option['xAxis']['pixelName']
                    },${data.option['yAxis']['pixelName']},${
                        data.option['_state']['fields']['size']
                    },${data.option['_state']['fields']['tooltip']}])|Group(${
                        data.option['series'][0]['label']['name']
                    })`);
                }
                if (
                    data.option['_state']['fields']['label'] &&
                    data.option['_state']['fields']['XAxis'] &&
                    data.option['_state']['fields']['YAxis'] &&
                    data.option['_state']['fields']['color']
                ) {
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['label'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    return (selector = `Select(${
                        data.option['series'][0]['label']['name']
                    },${getXAxisSelector()}(${
                        data.option['xAxis']['pixelName']
                    }),${getYAxisSelector()}(${
                        data.option['yAxis']['pixelName']
                    }),(${data.option['_state']['fields']['color']})).as([${
                        data.option['series'][0]['label']['name']
                    }, ${data.option['xAxis']['pixelName']},${
                        data.option['yAxis']['pixelName']
                    },${data.option['_state']['fields']['color']}])|Group(${
                        data.option['series'][0]['label']['name']
                    },${data.option['_state']['fields']['color']})`);
                }
                if (
                    data.option['_state']['fields']['label'] &&
                    data.option['_state']['fields']['XAxis'] &&
                    data.option['_state']['fields']['YAxis'] &&
                    data.option['_state']['fields']['size']
                ) {
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['size']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['size']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    return (selector = `Select(${
                        data.option['series'][0]['label']['name']
                    },${getXAxisSelector()}(${
                        data.option['xAxis']['pixelName']
                    }),${getYAxisSelector()}(${
                        data.option['yAxis']['pixelName']
                    }),${getSizeSelector()}(${
                        data.option['_state']['fields']['size']
                    })).as([${data.option['series'][0]['label']['name']}, ${
                        data.option['xAxis']['pixelName']
                    },${data.option['yAxis']['pixelName']},${
                        data.option['_state']['fields']['size']
                    }])|Group(${data.option['series'][0]['label']['name']})`);
                }
                if (
                    data.option['_state']['fields']['label'] &&
                    data.option['_state']['fields']['XAxis'] &&
                    data.option['_state']['fields']['YAxis'] &&
                    data.option['_state']['fields']['tooltip']
                ) {
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return (selector = `Select(${
                            data.option['series'][0]['label']['name']
                        },${getXAxisSelector()}(${
                            data.option['xAxis']['pixelName']
                        }),${getYAxisSelector()}(${
                            data.option['yAxis']['pixelName']
                        })).as([${data.option['series'][0]['label']['name']}, ${
                            data.option['xAxis']['pixelName']
                        },${data.option['yAxis']['pixelName']}])|Group(${
                            data.option['series'][0]['label']['name']
                        })`);
                    }
                    return (selector = `Select(${
                        data.option['series'][0]['label']['name']
                    },${getXAxisSelector()}(${
                        data.option['xAxis']['pixelName']
                    }),${getYAxisSelector()}(${
                        data.option['yAxis']['pixelName']
                    }),${getTooltipSelector()}(${
                        data.option['_state']['fields']['tooltip']
                    })).as([${data.option['series'][0]['label']['name']}, ${
                        data.option['xAxis']['pixelName']
                    },${data.option['yAxis']['pixelName']},${
                        data.option['_state']['fields']['tooltip']
                    }])|Group(${data.option['series'][0]['label']['name']})`);
                }
                if (
                    data.option['_state']['fields']['label'] &&
                    data.option['_state']['fields']['XAxis'] &&
                    data.option['_state']['fields']['YAxis']
                ) {
                    return (selector = `Select(${
                        data.option['series'][0]['label']['name']
                    },${getXAxisSelector()}(${
                        data.option['xAxis']['pixelName']
                    }),${getYAxisSelector()}(${
                        data.option['yAxis']['pixelName']
                    })).as([${data.option['series'][0]['label']['name']}, ${
                        data.option['xAxis']['pixelName']
                    },${data.option['yAxis']['pixelName']}])|Group(${
                        data.option['series'][0]['label']['name']
                    })`);
                }
            }
        }
        return '';
    }
    return '';
};
