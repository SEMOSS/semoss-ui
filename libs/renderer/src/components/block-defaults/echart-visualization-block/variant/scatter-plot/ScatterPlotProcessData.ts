export const processData = (apiData, data) => {
    let fields = "",
        label = "",
        xAxis = "",
        yAxis = "",
        size = "",
        color = "",
        tooltip = "";
    if (data.option.hasOwnProperty("_state")) {
        fields = data.option["_state"]["fields"];
        label = fields["label"];
        xAxis = fields["XAxis"];
        yAxis = fields["YAxis"];
        size = fields["size"];
        color = fields["color"];
        tooltip = fields["tooltip"];
    }
    const formatItem = (label, xAxis, yAxis) => ({
        value: [xAxis, yAxis], // x and y values
        label: {
            formatter: label.toString(), // Use array[0] as the label
        },
    });

    const formatDataItem = (
        label,
        xAxis,
        yAxis,
        size,
        color,
        tooltip,
        colorMap = null,
    ) => {
        if (!colorMap.has(color)) {
            colorMap.set(
                color,
                data.option["color"][
                    colorMap.size % data.option["color"]?.length
                ],
            );
        }
        return {
            value: [xAxis, yAxis], // x and y values
            label: {
                formatter: label.toString(), // Use array[0] as the label
            },
            symbolSize: size, // Individual symbol size
            itemStyle: {
                color: colorMap.get(color),
                colorValue: color,
            },
            tooltipValue: tooltip, //tooltip value
        };
    };
    const formatData = (label, xAxis, yAxis, size, color, colorMap = null) => {
        if (!colorMap.has(color)) {
            colorMap.set(
                color,
                data.option["color"][
                    colorMap.size % data.option["color"]?.length
                ],
            );
        }
        return {
            value: [xAxis, yAxis], // x and y values
            label: {
                formatter: label.toString(), // Use array[0] as the label
            },
            symbolSize: size, // Individual symbol size
            itemStyle: {
                color: colorMap.get(color),
                colorValue: color,
            },
        };
    };
    const formatItemData = (
        label,
        xAxis,
        yAxis,
        color,
        tooltip,
        colorMap = null,
    ) => {
        if (!colorMap.has(color)) {
            colorMap.set(
                color,
                data.option["color"][
                    colorMap.size % data.option["color"]?.length
                ],
            );
        }
        return {
            value: [xAxis, yAxis], // x and y values
            label: {
                formatter: label.toString(), // Use array[0] as the label
            },
            itemStyle: {
                color: colorMap.get(color),
                colorValue: color,
            },
            tooltipValue: tooltip, //tooltip value
        };
    };
    const formatItems = (label, xAxis, yAxis, size, tooltip) => ({
        value: [xAxis, yAxis], // x and y values
        label: {
            formatter: label.toString(), // Use array[0] as the label
        },
        symbolSize: size, // Individual symbol size
        tooltipValue: tooltip, //tooltip value
    });
    const formatColorDataItem = (
        label,
        xAxis,
        yAxis,
        color,
        colorMap = null,
    ) => {
        if (!colorMap.has(color)) {
            colorMap.set(
                color,
                data.option["color"][
                    colorMap.size % data.option["color"]?.length
                ],
            );
        }
        return {
            value: [xAxis, yAxis], // x and y values
            label: {
                formatter: label.toString(),
            },
            itemStyle: {
                color: colorMap.get(color),
                colorValue: color,
            },
        };
    };
    const formatSizeDataItem = (label, xAxis, yAxis, size) => ({
        value: [xAxis, yAxis], // x and y values
        label: {
            formatter: label.toString(), // Use array[0] as the label
        },
        symbolSize: size, // Individual symbol size
    });
    const formatTooltipDataItem = (label, xAxis, yAxis, tooltip) => ({
        value: [xAxis, yAxis], // x and y values
        label: {
            formatter: label.toString(), // Use array[0] as the label
        },
        tooltipValue: tooltip, //tooltip value
    });

    if (apiData["values"]) {
        if (data.option.hasOwnProperty("_state")) {
            if (data.option["_state"].hasOwnProperty("fields")) {
                if (label && xAxis && yAxis && size && color && tooltip) {
                    const colorMap = new Map();
                    if (
                        xAxis === yAxis &&
                        xAxis === size &&
                        xAxis === color &&
                        xAxis === tooltip
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                                item[1],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (
                        xAxis == yAxis &&
                        label == size &&
                        label == color &&
                        label == tooltip
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[0],
                                item[0],
                                item[0],
                                colorMap,
                            ),
                        }));
                    }
                    if (
                        xAxis == yAxis &&
                        xAxis == size &&
                        label == color &&
                        label == tooltip
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                                item[0],
                                item[0],
                                colorMap,
                            ),
                        }));
                    }
                    if (
                        xAxis == yAxis &&
                        xAxis == size &&
                        label == color &&
                        xAxis == tooltip
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                                item[0],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (
                        xAxis == yAxis &&
                        label == size &&
                        xAxis == color &&
                        label == tooltip
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[0],
                                item[1],
                                item[0],
                                colorMap,
                            ),
                        }));
                    }
                    if (
                        xAxis == yAxis &&
                        label == size &&
                        label == color &&
                        xAxis == tooltip
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[0],
                                item[0],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && size == color && size == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[2],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && label == color && size == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[0],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && size == tooltip && xAxis == color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[1],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && size == color && xAxis == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[2],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (
                        xAxis === size &&
                        xAxis === color &&
                        xAxis === tooltip
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[1],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (
                        yAxis === size &&
                        yAxis === color &&
                        yAxis === tooltip
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[2],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (
                        xAxis === size &&
                        xAxis === color &&
                        yAxis === tooltip
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[1],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (
                        xAxis === size &&
                        yAxis === color &&
                        xAxis === tooltip
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[2],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (
                        yAxis === size &&
                        xAxis === color &&
                        xAxis === tooltip
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[1],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (
                        yAxis === size &&
                        yAxis === color &&
                        xAxis === tooltip
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[2],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (
                        yAxis === size &&
                        xAxis === color &&
                        yAxis === tooltip
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[1],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (
                        xAxis === size &&
                        yAxis === color &&
                        yAxis === tooltip
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[2],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (
                        xAxis === size &&
                        xAxis === tooltip &&
                        label === color
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[0],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (
                        yAxis === size &&
                        yAxis === tooltip &&
                        label === color
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[0],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (
                        xAxis === size &&
                        yAxis === tooltip &&
                        label === color
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[0],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (
                        yAxis === size &&
                        xAxis === tooltip &&
                        label === color
                    ) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[0],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && label == size && xAxis == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[0],
                                item[2],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && xAxis == size && xAxis == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                                item[2],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && label == color && xAxis == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[0],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && label == size && label == color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[0],
                                item[0],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && label == color && label == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[0],
                                item[0],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && label == size && label == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[0],
                                item[2],
                                item[0],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && xAxis == size && xAxis == color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                                item[1],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && xAxis == size && xAxis == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                                item[2],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && xAxis == color && xAxis == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[1],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === yAxis && xAxis === size && label === color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                                item[0],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (size == color && xAxis == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[3],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (size == color && yAxis == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[3],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (size == color && yAxis == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[3],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (size == color && size == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[3],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (size == tooltip && xAxis == color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[1],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (size == tooltip && yAxis == color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[2],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && xAxis == size) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                                item[2],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && xAxis == color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[1],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && size == color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[2],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && xAxis == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[3],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && size == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[3],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && label == size) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[0],
                                item[2],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && label == color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[0],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && label == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[3],
                                item[0],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == size && label == color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[0],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === size && label === color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[0],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === tooltip && label === color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[0],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === tooltip && label === color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[0],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === size && xAxis === color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[1],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === size && yAxis === color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[2],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === size && xAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[3],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === size && yAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[3],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === color && xAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[1],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === color && yAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[2],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === size && yAxis === color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[2],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === size && xAxis === color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[1],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === size && yAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[3],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === size && xAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[3],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === color && yAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[1],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === color && xAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[2],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (size === tooltip && label === color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[0],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[3],
                                item[4],
                                colorMap,
                            ),
                        }));
                    }
                    if (label === color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[0],
                                item[4],
                                colorMap,
                            ),
                        }));
                    }
                    if (size === label) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[4],
                                item[5],
                                colorMap,
                            ),
                        }));
                    }
                    if (tooltip === label) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[4],
                                item[5],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === size) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[3],
                                item[4],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[1],
                                item[4],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[4],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === size) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[3],
                                item[4],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[2],
                                item[4],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[4],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (size === color) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[3],
                                item[4],
                                colorMap,
                            ),
                        }));
                    }
                    if (size === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[4],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (color === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[4],
                                item[4],
                                colorMap,
                            ),
                        }));
                    }
                    return apiData.values.map((item) => ({
                        ...formatDataItem(
                            item[0],
                            item[1],
                            item[2],
                            item[3],
                            item[4],
                            item[5],
                            colorMap,
                        ),
                    }));
                }
                if (label && xAxis && yAxis && size && color) {
                    const colorMap = new Map();
                    if (xAxis == yAxis && xAxis == size && label == color) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                                item[0],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && xAxis == size && xAxis == color) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && xAxis == color) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && size == color) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && label == color) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[0],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && xAxis == size) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === size && xAxis === color) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === size && yAxis === color) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === size && yAxis === color) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === size && xAxis === color) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === size && label === color) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[0],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === size && label === color) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[0],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (label === color) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[0],
                                colorMap,
                            ),
                        }));
                    }
                    if (size === color) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === size) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === size) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === color) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === color) {
                        return apiData.values.map((item) => ({
                            ...formatData(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    return apiData.values.map((item) => ({
                        ...formatData(
                            item[0],
                            item[1],
                            item[2],
                            item[3],
                            item[4],
                            colorMap,
                        ),
                    }));
                }
                if (label && xAxis && yAxis && color && tooltip) {
                    const colorMap = new Map();
                    if (xAxis == yAxis && xAxis == tooltip && label == color) {
                        return apiData.values.map((item) => ({
                            ...formatItemData(
                                item[0],
                                item[1],
                                item[1],
                                item[0],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && xAxis == tooltip && xAxis == color) {
                        return apiData.values.map((item) => ({
                            ...formatItemData(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && xAxis == color) {
                        return apiData.values.map((item) => ({
                            ...formatItemData(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && label == color) {
                        return apiData.values.map((item) => ({
                            ...formatItemData(
                                item[0],
                                item[1],
                                item[1],
                                item[0],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis && xAxis == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatItemData(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == color && xAxis == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatItemData(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === color && yAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatItemData(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === color && yAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatItemData(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === color && xAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatItemData(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === tooltip && label === color) {
                        return apiData.values.map((item) => ({
                            ...formatItemData(
                                item[0],
                                item[1],
                                item[2],
                                item[0],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === tooltip && label === color) {
                        return apiData.values.map((item) => ({
                            ...formatItemData(
                                item[0],
                                item[1],
                                item[2],
                                item[0],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis == yAxis) {
                        return apiData.values.map((item) => ({
                            ...formatItemData(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (label === color) {
                        return apiData.values.map((item) => ({
                            ...formatItemData(
                                item[0],
                                item[1],
                                item[2],
                                item[0],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (color === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatItemData(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === color) {
                        return apiData.values.map((item) => ({
                            ...formatItemData(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === color) {
                        return apiData.values.map((item) => ({
                            ...formatItemData(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[3],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatItemData(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatItemData(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    return apiData.values.map((item) => ({
                        ...formatItemData(
                            item[0],
                            item[1],
                            item[2],
                            item[3],
                            item[4],
                            colorMap,
                        ),
                    }));
                }
                if (label && xAxis && yAxis && size && tooltip) {
                    if (xAxis == yAxis && xAxis == size && xAxis == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatItems(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                                item[1],
                            ),
                        }));
                    }
                    if (xAxis == yAxis && xAxis == size) {
                        return apiData.values.map((item) => ({
                            ...formatItems(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                                item[2],
                            ),
                        }));
                    }
                    if (xAxis == yAxis && xAxis == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatItems(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[1],
                            ),
                        }));
                    }
                    if (xAxis == yAxis && size == tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatItems(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[2],
                            ),
                        }));
                    }
                    if (xAxis === size && xAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatItems(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[1],
                            ),
                        }));
                    }
                    if (yAxis === size && yAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatItems(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[2],
                            ),
                        }));
                    }
                    if (xAxis === size && yAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatItems(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[2],
                            ),
                        }));
                    }
                    if (yAxis === size && xAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatItems(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[1],
                            ),
                        }));
                    }
                    if (xAxis == yAxis) {
                        return apiData.values.map((item) => ({
                            ...formatItems(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                item[3],
                            ),
                        }));
                    }
                    if (size === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatItems(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[3],
                            ),
                        }));
                    }
                    if (xAxis === size) {
                        return apiData.values.map((item) => ({
                            ...formatItems(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                item[3],
                            ),
                        }));
                    }
                    if (yAxis === size) {
                        return apiData.values.map((item) => ({
                            ...formatItems(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                item[3],
                            ),
                        }));
                    }
                    if (xAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatItems(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[1],
                            ),
                        }));
                    }
                    if (yAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatItems(
                                item[0],
                                item[1],
                                item[2],
                                item[3],
                                item[2],
                            ),
                        }));
                    }
                    return apiData.values.map((item) => ({
                        ...formatItems(
                            item[0],
                            item[1],
                            item[2],
                            item[4],
                            item[4],
                        ),
                    }));
                }
                if (label && xAxis && yAxis && color) {
                    const colorMap = new Map();
                    if (xAxis === yAxis && xAxis === color) {
                        return apiData.values.map((item) => ({
                            ...formatColorDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === yAxis && label === color) {
                        return apiData.values.map((item) => ({
                            ...formatColorDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[0],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === yAxis) {
                        return apiData.values.map((item) => ({
                            ...formatColorDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (xAxis === color) {
                        return apiData.values.map((item) => ({
                            ...formatColorDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                                colorMap,
                            ),
                        }));
                    }
                    if (yAxis === color) {
                        return apiData.values.map((item) => ({
                            ...formatColorDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                                colorMap,
                            ),
                        }));
                    }
                    if (label === color) {
                        return apiData.values.map((item) => ({
                            ...formatColorDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[0],
                                colorMap,
                            ),
                        }));
                    }
                    return apiData.values.map((item, index) => ({
                        ...formatColorDataItem(
                            item[0],
                            item[1],
                            item[2],
                            item[3],
                            colorMap,
                        ),
                    }));
                }
                if (label && xAxis && yAxis && size) {
                    if (xAxis === yAxis && xAxis === size) {
                        return apiData.values.map((item) => ({
                            ...formatSizeDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                            ),
                        }));
                    }
                    if (xAxis === yAxis) {
                        return apiData.values.map((item) => ({
                            ...formatSizeDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                            ),
                        }));
                    }
                    if (xAxis === size) {
                        return apiData.values.map((item) => ({
                            ...formatSizeDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                            ),
                        }));
                    }
                    if (yAxis === size) {
                        return apiData.values.map((item) => ({
                            ...formatSizeDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                            ),
                        }));
                    }
                    return apiData.values.map((item) => ({
                        ...formatSizeDataItem(
                            item[0],
                            item[1],
                            item[2],
                            item[3],
                        ),
                    }));
                }
                if (label && xAxis && yAxis && tooltip) {
                    if (xAxis === yAxis && xAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatTooltipDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                            ),
                        }));
                    }
                    if (xAxis === yAxis) {
                        return apiData.values.map((item) => ({
                            ...formatTooltipDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                            ),
                        }));
                    }
                    if (xAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatTooltipDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                            ),
                        }));
                    }
                    if (yAxis === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatTooltipDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[2],
                            ),
                        }));
                    }
                    return apiData.values.map((item) => ({
                        ...formatTooltipDataItem(
                            item[0],
                            item[1],
                            item[2],
                            item[3],
                        ),
                    }));
                }
            }
        }
        if (label && xAxis && yAxis) {
            {
                if (xAxis === yAxis) {
                    return apiData.values.map((item) => ({
                        ...formatItem(item[0], item[1], item[1]),
                    }));
                }
                return apiData.values.map((item) => ({
                    ...formatItem(item[0], item[1], item[2]),
                }));
            }
        }
    }
};
