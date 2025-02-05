export const processData = (apiData, data) => {
    const formatItem = (item) => ({
        value: [item[1], item[2]], // x and y values
        label: {
            formatter: item[0].toString(), // Use array[0] as the label
        },
    });

    function newColor(color) {
        if (data.option['_state']['fields']['colorDataType'] == 'NUMBER') {
            let colour = color != 'NaN' ? valueToHSL(color) : '#000000';
            return colour;
        }
        if (data.option['_state']['fields']['colorDataType'] == 'STRING') {
            let colour = color != 'NaN' ? stringToColor(color) : '000000';
            return colour;
        }
    }
    function valueToHSL(value) {
        const hue = (parseInt(value, 10) * 37) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    }

    function stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str?.length; i++) {
            hash = str?.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xff;
            color += ('00' + value.toString(16)).slice(-2);
        }
        return color;
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
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[1]), //Individual color
                                colorValue: item[1],
                            },
                            tooltipValue: item[1], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[2]), //Individual color
                                colorValue: item[2],
                            },
                            tooltipValue: item[2], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[1]), //Individual color
                                colorValue: item[1],
                            },
                            tooltipValue: item[2], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[2]), //Individual color
                                colorValue: item[2],
                            },
                            tooltipValue: item[1], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[1]), //Individual color
                                colorValue: item[1],
                            },
                            tooltipValue: item[1], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[2]), //Individual color
                                colorValue: item[2],
                            },
                            tooltipValue: item[1], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[1]), //Individual color
                                colorValue: item[1],
                            },
                            tooltipValue: item[2], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[2]), //Individual color
                                colorValue: item[2],
                            },
                            tooltipValue: item[2], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip'] &&
                        data.option['_state']['fields']['label'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[0]), //Individual color
                                colorValue: item[0],
                            },
                            tooltipValue: item[1], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip'] &&
                        data.option['_state']['fields']['label'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[0]), //Individual color
                                colorValue: item[0],
                            },
                            tooltipValue: item[2], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip'] &&
                        data.option['_state']['fields']['label'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[0]), //Individual color
                                colorValue: item[0],
                            },
                            tooltipValue: item[2], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip'] &&
                        data.option['_state']['fields']['label'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[0]), //Individual color
                                colorValue: item[0],
                            },
                            tooltipValue: item[1], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['label'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[0]), //Individual color
                                colorValue: item[0],
                            },
                            tooltipValue: item[3], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['label'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[0]), //Individual color
                                colorValue: item[0],
                            },
                            tooltipValue: item[3], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip'] &&
                        data.option['_state']['fields']['label'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[0]), //Individual color
                                colorValue: item[0],
                            },
                            tooltipValue: item[1], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip'] &&
                        data.option['_state']['fields']['label'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[0]), //Individual color
                                colorValue: item[0],
                            },
                            tooltipValue: item[2], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[1]), //Individual color
                                colorValue: item[1],
                            },
                            tooltipValue: item[3], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[2]), //Individual color
                                colorValue: item[2],
                            },
                            tooltipValue: item[3], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[3]), //Individual color
                                colorValue: item[3],
                            },
                            tooltipValue: item[1], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[3]), //Individual color
                                colorValue: item[3],
                            },
                            tooltipValue: item[2], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[1]), //Individual color
                                colorValue: item[1],
                            },
                            tooltipValue: item[1], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[2]), //Individual color
                                colorValue: item[2],
                            },
                            tooltipValue: item[2], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[2]), //Individual color
                                colorValue: item[2],
                            },
                            tooltipValue: item[3], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[1]), //Individual color
                                colorValue: item[1],
                            },
                            tooltipValue: item[3], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[3]), //Individual color
                                colorValue: item[3],
                            },
                            tooltipValue: item[2], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[3]), //Individual color
                                colorValue: item[3],
                            },
                            tooltipValue: item[1], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[1]), //Individual color
                                colorValue: item[1],
                            },
                            tooltipValue: item[2], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[2]), //Individual color
                                colorValue: item[2],
                            },
                            tooltipValue: item[1], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['size'] ==
                            data.option['_state']['fields']['tooltip'] &&
                        data.option['_state']['fields']['label'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[0]), //Individual color
                                colorValue: item[0],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['label'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[0]), //Individual color
                                colorValue: item[0],
                            },
                            tooltipValue: item[4], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['size'] ==
                        data.option['_state']['fields']['label']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[4]), //Individual color
                                colorValue: item[4],
                            },
                            tooltipValue: item[5], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['tooltip'] ==
                        data.option['_state']['fields']['label']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[4]), //Individual color
                                colorValue: item[4],
                            },
                            tooltipValue: item[5], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['size']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[3]), //Individual color
                                colorValue: item[3],
                            },
                            tooltipValue: item[4], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[1]), //Individual color
                                colorValue: item[1],
                            },
                            tooltipValue: item[4], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[4]), //Individual color
                                colorValue: item[4],
                            },
                            tooltipValue: item[1], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['size']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[3]), //Individual color
                                colorValue: item[3],
                            },
                            tooltipValue: item[4], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[2]), //Individual color
                                colorValue: item[2],
                            },
                            tooltipValue: item[4], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[4]), //Individual color
                                colorValue: item[4],
                            },
                            tooltipValue: item[2], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['size'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[3]), //Individual color
                                colorValue: item[3],
                            },
                            tooltipValue: item[4], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['size'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[4]), //Individual color
                                colorValue: item[4],
                            },
                            tooltipValue: item[3], //tooltip value
                        }));
                    }
                    if (
                        data.option['_state']['fields']['color'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[4]), //Individual color
                                colorValue: item[4],
                            },
                            tooltipValue: item[4], //tooltip value
                        }));
                    }
                    return apiData.values.map((item) => ({
                        ...formatItem(item),
                        symbolSize: item[3], // Individual symbol size
                        itemStyle: {
                            color: newColor(item[4]), //Individual color
                            colorValue: item[4],
                        },
                        tooltipValue: item[5], //tooltip value
                    }));
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
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[1]),
                                colorValue: item[1],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[2]),
                                colorValue: item[2],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[2]),
                                colorValue: item[2],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[1]),
                                colorValue: item[1],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['label'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[0]),
                                colorValue: item[0],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['label'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[0]),
                                colorValue: item[0],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['label'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[0]),
                                colorValue: item[0],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['size'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[3]),
                                colorValue: item[3],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['size']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[3]),
                                colorValue: item[3],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['size']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[3]),
                                colorValue: item[3],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[1]),
                                colorValue: item[1],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            itemStyle: {
                                color: newColor(item[2]),
                                colorValue: item[2],
                            },
                        }));
                    }
                    return apiData.values.map((item) => ({
                        ...formatItem(item),
                        symbolSize: item[3], // Individual symbol size
                        itemStyle: {
                            color: newColor(item[4]),
                            colorValue: item[4],
                        },
                    }));
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
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            itemStyle: {
                                color: newColor(item[1]),
                                colorValue: item[1],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            itemStyle: {
                                color: newColor(item[2]),
                                colorValue: item[2],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            itemStyle: {
                                color: newColor(item[1]),
                                colorValue: item[1],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['color'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            itemStyle: {
                                color: newColor(item[2]),
                                colorValue: item[2],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip'] &&
                        data.option['_state']['fields']['label'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            itemStyle: {
                                color: newColor(item[0]),
                                colorValue: item[0],
                            },
                            tooltipValue: item[1],
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip'] &&
                        data.option['_state']['fields']['label'] ==
                            data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            itemStyle: {
                                color: newColor(item[0]),
                                colorValue: item[0],
                            },
                            tooltipValue: item[2],
                        }));
                    }
                    if (
                        data.option['_state']['fields']['label'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            itemStyle: {
                                color: newColor(item[0]),
                                colorValue: item[0],
                            },
                            tooltipValue: item[1],
                        }));
                    }
                    if (
                        data.option['_state']['fields']['color'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            itemStyle: {
                                color: newColor(item[3]),
                                colorValue: item[3],
                            },
                            tooltipValue: item[3],
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            itemStyle: {
                                color: newColor(item[1]),
                                colorValue: item[1],
                            },
                            tooltipValue: item[3],
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            itemStyle: {
                                color: newColor(item[2]),
                                colorValue: item[2],
                            },
                            tooltipValue: item[3],
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            itemStyle: {
                                color: newColor(item[3]),
                                colorValue: item[3],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            itemStyle: {
                                color: newColor(item[3]),
                                colorValue: item[3],
                            },
                        }));
                    }
                    return apiData.values.map((item) => ({
                        ...formatItem(item),
                        itemStyle: {
                            color: newColor(item[3]),
                            colorValue: item[3],
                        },
                        tooltipValue: item[4],
                    }));
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
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                            data.option['_state']['fields']['size'] &&
                        data.option['_state']['fields']['XAxis'] ==
                            data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                        }));
                    }
                    if (
                        data.option['_state']['fields']['size'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                            tooltipValue: item[3],
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['size']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1], // Individual symbol size
                            tooltipValue: item[3],
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['size']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2], // Individual symbol size
                            tooltipValue: item[3],
                        }));
                    }
                    if (
                        data.option['_state']['fields']['XAxis'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[3], // Individual symbol size
                        }));
                    }
                    return apiData.values.map((item) => ({
                        ...formatItem(item),
                        symbolSize: item[3], // Individual symbol size
                        tooltipValue: item[4],
                    }));
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
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            itemStyle: {
                                color: newColor(item[1]),
                                colorValue: item[1],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            itemStyle: {
                                color: newColor(item[2]),
                                colorValue: item[2],
                            },
                        }));
                    }
                    if (
                        data.option['_state']['fields']['label'] ==
                        data.option['_state']['fields']['color']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            itemStyle: {
                                color: newColor(item[0]),
                                colorValue: item[0],
                            },
                        }));
                    }
                    return apiData.values.map((item) => ({
                        ...formatItem(item),
                        itemStyle: {
                            color: newColor(item[3]),
                            colorValue: item[3],
                        },
                    }));
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
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[1] != 'NaN' ? item[1] : 12, // Individual symbol size
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['size']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                            symbolSize: item[2] != 'NaN' ? item[2] : 12, // Individual symbol size
                        }));
                    }
                    return apiData.values.map((item) => ({
                        ...formatItem(item),
                        symbolSize: item[3], // Individual symbol size
                    }));
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
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                        }));
                    }
                    if (
                        data.option['_state']['fields']['YAxis'] ==
                        data.option['_state']['fields']['tooltip']
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatItem(item),
                        }));
                    }
                    return apiData.values.map((item) => ({
                        ...formatItem(item),
                        tooltipValue: item[3],
                    }));
                }
            }
        }
        return apiData.values.map((item) => ({
            ...formatItem(item),
        }));
    }
};
