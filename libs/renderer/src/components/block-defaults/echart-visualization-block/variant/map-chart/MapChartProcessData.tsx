export const processData = (apiData, data) => {
    let fields = "",
        label = "",
        latitude = "",
        longitude = "",
        size = "",
        color = "",
        tooltip = "";
    if (data.option.hasOwnProperty("_state")) {
        fields = data.option["_state"]["fields"];
        label = fields["label"];
        latitude = fields["Latitude"];
        longitude = fields["Longitude"];
        size = fields["size"];
        color = fields["color"];
        tooltip = fields["tooltip"];
    }
    const formatItem = (label, latitude, longitude) => ({
        value: [longitude, latitude], // latitude and longitude values
        label: {
            formatter: label.toString(), // Use array[0] as the label
        },
    });

    const formatDataItem = (
        label,
        latitude,
        longitude,
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
        const adjustedSize = Math.min(size + data.option["symbolSize"], 50);
        return {
            value: [longitude, latitude], // latitude and longitude values
            label: {
                formatter: label.toString(), // Use array[0] as the label
            },
            tempSymbolSize: size, // Individual symbol size
            symbolSize: adjustedSize, // Individual symbol size
            itemStyle: {
                color: colorMap.get(color),
                colorValue: color,
            },
            tooltipValue: tooltip, //tooltip value
        };
    };
    const formatData = (
        label,
        latitude,
        longitude,
        size,
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
        const adjustedSize = Math.min(size + data.option["symbolSize"], 50);
        return {
            value: [longitude, latitude], // latitude and longitude values
            label: {
                formatter: label.toString(), // Use array[0] as the label
            },
            tempSymbolSize: size, // Individual symbol size
            symbolSize: adjustedSize, // Individual symbol size
            itemStyle: {
                color: colorMap.get(color),
                colorValue: color,
            },
        };
    };
    const formatItemData = (
        label,
        latitude,
        longitude,
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
            value: [longitude, latitude], // latitude and longitude values
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
    const formatItems = (label, latitude, longitude, size, tooltip) => {
        const adjustedSize = Math.min(size + data.option["symbolSize"], 50);
        return {
            value: [longitude, latitude], // latitude and longitude values
            label: {
                formatter: label.toString(), // Use array[0] as the label
            },
            tempSymbolSize: size, // Individual symbol size
            symbolSize: adjustedSize, // Individual symbol size
            tooltipValue: tooltip, //tooltip value
        };
    };
    const formatColorDataItem = (
        label,
        latitude,
        longitude,
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
            value: [longitude, latitude], // latitude and longitude values
            label: {
                formatter: label.toString(),
            },
            itemStyle: {
                color: colorMap.get(color),
                colorValue: color,
            },
        };
    };
    const formatSizeDataItem = (label, latitude, longitude, size) => {
        const adjustedSize = Math.min(size + data.option["symbolSize"], 50);

        return {
            value: [longitude, latitude], // latitude and longitude values
            label: {
                formatter: label.toString(), // Use array[0] as the label
            },
            tempSymbolSize: size, // Individual symbol size
            symbolSize: adjustedSize, // Individual symbol size
        };
    };
    const formatTooltipDataItem = (label, latitude, longitude, tooltip) => ({
        value: [longitude, latitude], // latitude and longitude values
        label: {
            formatter: label.toString(), // Use array[0] as the label
        },
        tooltipValue: tooltip, //tooltip value
    });

    if (apiData["values"]) {
        if (data.option.hasOwnProperty("_state")) {
            if (data.option["_state"].hasOwnProperty("fields")) {
                if (
                    label &&
                    latitude &&
                    longitude &&
                    size &&
                    color &&
                    tooltip
                ) {
                    const colorMap = new Map();
                    if (
                        latitude === longitude &&
                        latitude === size &&
                        latitude === color &&
                        latitude === tooltip
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
                        latitude == longitude &&
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
                        latitude == longitude &&
                        latitude == size &&
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
                        latitude == longitude &&
                        latitude == size &&
                        label == color &&
                        latitude == tooltip
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
                        latitude == longitude &&
                        label == size &&
                        latitude == color &&
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
                        latitude == longitude &&
                        label == size &&
                        label == color &&
                        latitude == tooltip
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
                    if (
                        latitude == longitude &&
                        size == color &&
                        size == tooltip
                    ) {
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
                    if (
                        latitude == longitude &&
                        label == color &&
                        size == tooltip
                    ) {
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
                    if (
                        latitude == longitude &&
                        size == tooltip &&
                        latitude == color
                    ) {
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
                    if (
                        latitude == longitude &&
                        size == color &&
                        latitude == tooltip
                    ) {
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
                        latitude === size &&
                        latitude === color &&
                        latitude === tooltip
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
                        longitude === size &&
                        longitude === color &&
                        longitude === tooltip
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
                        latitude === size &&
                        latitude === color &&
                        longitude === tooltip
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
                        latitude === size &&
                        longitude === color &&
                        latitude === tooltip
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
                        longitude === size &&
                        latitude === color &&
                        latitude === tooltip
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
                        longitude === size &&
                        longitude === color &&
                        latitude === tooltip
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
                        longitude === size &&
                        latitude === color &&
                        longitude === tooltip
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
                        latitude === size &&
                        longitude === color &&
                        longitude === tooltip
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
                        latitude === size &&
                        latitude === tooltip &&
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
                        longitude === size &&
                        longitude === tooltip &&
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
                        latitude === size &&
                        longitude === tooltip &&
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
                        longitude === size &&
                        latitude === tooltip &&
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
                    if (
                        latitude == longitude &&
                        label == size &&
                        latitude == tooltip
                    ) {
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
                    if (
                        latitude == longitude &&
                        latitude == size &&
                        latitude == tooltip
                    ) {
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
                    if (
                        latitude == longitude &&
                        label == color &&
                        latitude == tooltip
                    ) {
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
                    if (
                        latitude == longitude &&
                        label == size &&
                        label == color
                    ) {
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
                    if (
                        latitude == longitude &&
                        label == color &&
                        label == tooltip
                    ) {
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
                    if (
                        latitude == longitude &&
                        label == size &&
                        label == tooltip
                    ) {
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
                    if (
                        latitude == longitude &&
                        latitude == size &&
                        latitude == color
                    ) {
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
                    if (
                        latitude == longitude &&
                        latitude == size &&
                        latitude == tooltip
                    ) {
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
                    if (
                        latitude == longitude &&
                        latitude == color &&
                        latitude == tooltip
                    ) {
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
                    if (
                        latitude === longitude &&
                        latitude === size &&
                        label === color
                    ) {
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
                    if (size == color && latitude == tooltip) {
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
                    if (size == color && longitude == tooltip) {
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
                    if (size == color && longitude == tooltip) {
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
                    if (size == tooltip && latitude == color) {
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
                    if (size == tooltip && longitude == color) {
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
                    if (latitude == longitude && latitude == size) {
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
                    if (latitude == longitude && latitude == color) {
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
                    if (latitude == longitude && size == color) {
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
                    if (latitude == longitude && latitude == tooltip) {
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
                    if (latitude == longitude && size == tooltip) {
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
                    if (latitude == longitude && label == size) {
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
                    if (latitude == longitude && label == color) {
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
                    if (latitude == longitude && label == tooltip) {
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
                    if (latitude == size && label == color) {
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
                    if (longitude === size && label === color) {
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
                    if (latitude === tooltip && label === color) {
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
                    if (longitude === tooltip && label === color) {
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
                    if (latitude === size && latitude === color) {
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
                    if (longitude === size && longitude === color) {
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
                    if (latitude === size && latitude === tooltip) {
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
                    if (longitude === size && longitude === tooltip) {
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
                    if (latitude === color && latitude === tooltip) {
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
                    if (longitude === color && longitude === tooltip) {
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
                    if (latitude === size && longitude === color) {
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
                    if (longitude === size && latitude === color) {
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
                    if (latitude === size && longitude === tooltip) {
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
                    if (longitude === size && latitude === tooltip) {
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
                    if (latitude === color && longitude === tooltip) {
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
                    if (longitude === color && latitude === tooltip) {
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
                    if (latitude == longitude) {
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
                    if (latitude === size) {
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
                    if (latitude === color) {
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
                    if (latitude === tooltip) {
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
                    if (longitude === size) {
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
                    if (longitude === color) {
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
                    if (longitude === tooltip) {
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
                if (label && latitude && longitude && size && color) {
                    const colorMap = new Map();
                    if (
                        latitude == longitude &&
                        latitude == size &&
                        label == color
                    ) {
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
                    if (
                        latitude == longitude &&
                        latitude == size &&
                        latitude == color
                    ) {
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
                    if (latitude == longitude && latitude == color) {
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
                    if (latitude == longitude && size == color) {
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
                    if (latitude == longitude && label == color) {
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
                    if (latitude == longitude && latitude == size) {
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
                    if (latitude === size && latitude === color) {
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
                    if (longitude === size && longitude === color) {
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
                    if (latitude === size && longitude === color) {
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
                    if (longitude === size && latitude === color) {
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
                    if (latitude === size && label === color) {
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
                    if (longitude === size && label === color) {
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
                    if (latitude == longitude) {
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
                    if (latitude === size) {
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
                    if (longitude === size) {
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
                    if (latitude === color) {
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
                    if (longitude === color) {
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
                if (label && latitude && longitude && color && tooltip) {
                    const colorMap = new Map();
                    if (
                        latitude == longitude &&
                        latitude == tooltip &&
                        label == color
                    ) {
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
                    if (
                        latitude == longitude &&
                        latitude == tooltip &&
                        latitude == color
                    ) {
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
                    if (latitude == longitude && latitude == color) {
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
                    if (latitude == longitude && label == color) {
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
                    if (latitude == longitude && latitude == tooltip) {
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
                    if (latitude == color && latitude == tooltip) {
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
                    if (longitude === color && longitude === tooltip) {
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
                    if (latitude === color && longitude === tooltip) {
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
                    if (longitude === color && latitude === tooltip) {
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
                    if (latitude === tooltip && label === color) {
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
                    if (longitude === tooltip && label === color) {
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
                    if (latitude == longitude) {
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
                    if (latitude === color) {
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
                    if (longitude === color) {
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
                    if (latitude === tooltip) {
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
                    if (longitude === tooltip) {
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
                if (label && latitude && longitude && size && tooltip) {
                    if (
                        latitude == longitude &&
                        latitude == size &&
                        latitude == tooltip
                    ) {
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
                    if (latitude == longitude && latitude == size) {
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
                    if (latitude == longitude && latitude == tooltip) {
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
                    if (latitude == longitude && size == tooltip) {
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
                    if (latitude === size && latitude === tooltip) {
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
                    if (longitude === size && longitude === tooltip) {
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
                    if (latitude === size && longitude === tooltip) {
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
                    if (longitude === size && latitude === tooltip) {
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
                    if (latitude == longitude) {
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
                    if (latitude === size) {
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
                    if (longitude === size) {
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
                    if (latitude === tooltip) {
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
                    if (longitude === tooltip) {
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
                if (label && latitude && longitude && color) {
                    const colorMap = new Map();
                    if (latitude === longitude && latitude === color) {
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
                    if (latitude === longitude && label === color) {
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
                    if (latitude === longitude) {
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
                    if (latitude === color) {
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
                    if (longitude === color) {
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
                if (label && latitude && longitude && size) {
                    if (latitude === longitude && latitude === size) {
                        return apiData.values.map((item) => ({
                            ...formatSizeDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                            ),
                        }));
                    }
                    if (latitude === longitude) {
                        return apiData.values.map((item) => ({
                            ...formatSizeDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                            ),
                        }));
                    }
                    if (latitude === size) {
                        return apiData.values.map((item) => ({
                            ...formatSizeDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                            ),
                        }));
                    }
                    if (longitude === size) {
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
                if (label && latitude && longitude && tooltip) {
                    if (latitude === longitude && latitude === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatTooltipDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[1],
                            ),
                        }));
                    }
                    if (latitude === longitude) {
                        return apiData.values.map((item) => ({
                            ...formatTooltipDataItem(
                                item[0],
                                item[1],
                                item[1],
                                item[2],
                            ),
                        }));
                    }
                    if (latitude === tooltip) {
                        return apiData.values.map((item) => ({
                            ...formatTooltipDataItem(
                                item[0],
                                item[1],
                                item[2],
                                item[1],
                            ),
                        }));
                    }
                    if (longitude === tooltip) {
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
        if (label && latitude && longitude) {
            {
                if (latitude === longitude) {
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
