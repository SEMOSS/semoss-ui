export const formatdatapoints = (apiData, data) => {
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
    const getSelectorType = (type) => {
        return fields[type] === "NUMBER" ? "Average of" : "Count of";
    };
    const getSelectors = () => {
        return {
            latitude: "Coordinates:",
            longitude: getSelectorType("LongitudeDataType"),
            size: getSelectorType("sizeDataType"),
            tooltip: getSelectorType("tooltipDataType"),
            color: "Unique Group Concat of",
        };
    };
    const selectors = getSelectors();
    const getToolTipContent = (color, Data, apiData) => {
        return `
        <div>
            <span style="color:${color}">\u25CF</span>
            ${Data.label.formatter.toString()}<br>
            ${selectors.latitude} ${Data.value[0]},${Data.value[1]}<br>
        </div>
    `;
    };
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
                    return function (params) {
                        const { data: Data, color: Color } = params;
                        if (
                            latitude == longitude &&
                            latitude == size &&
                            latitude == color &&
                            latitude == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                            `
                            );
                        }
                        if (
                            latitude == longitude &&
                            label == size &&
                            label == color &&
                            label == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                ${tooltip}: ${Data.tooltipValue}<br>
                            `
                            );
                        }
                        if (
                            latitude == longitude &&
                            latitude == size &&
                            label == color &&
                            label == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                ${tooltip}: ${Data.tooltipValue}<br>
                            `
                            );
                        }
                        if (
                            latitude == longitude &&
                            latitude == size &&
                            label == color &&
                            latitude == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `
                                        ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                    `
                            );
                        }
                        if (
                            latitude == longitude &&
                            label == size &&
                            latitude == color &&
                            label == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                    ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                     ${tooltip}: ${Data.tooltipValue}<br>
                                `
                            );
                        }
                        if (
                            latitude == longitude &&
                            label == size &&
                            label == color &&
                            latitude == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                    ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            latitude == longitude &&
                            (size == color || label == color) &&
                            size == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                        ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            latitude === size &&
                            latitude === color &&
                            latitude === tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[0]}<br>`
                            );
                        }
                        if (
                            longitude === size &&
                            longitude === color &&
                            longitude === tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[1]}<br>`
                            );
                        }
                        if (
                            latitude === size &&
                            latitude === color &&
                            longitude === tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[0]}<br>`
                            );
                        }
                        if (
                            latitude === size &&
                            longitude === color &&
                            latitude === tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[1]}<br>`
                            );
                        }
                        if (
                            longitude === size &&
                            latitude === color &&
                            latitude === tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[0]}<br>`
                            );
                        }
                        if (
                            longitude === size &&
                            longitude === color &&
                            latitude === tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[1]}<br>`
                            );
                        }
                        if (
                            longitude === size &&
                            latitude === color &&
                            longitude === tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[0]}<br>`
                            );
                        }
                        if (
                            latitude === size &&
                            longitude === color &&
                            longitude === tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[1]}<br>`
                            );
                        }
                        if (
                            latitude === size &&
                            latitude === tooltip &&
                            label === color
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            longitude === size &&
                            longitude === tooltip &&
                            label === color
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            latitude === size &&
                            longitude === tooltip &&
                            label === color
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            longitude === size &&
                            latitude === tooltip &&
                            label === color
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            latitude == longitude &&
                            (label == size || latitude == size) &&
                            latitude == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            latitude == longitude &&
                            label == color &&
                            latitude == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            latitude == longitude &&
                            label == size &&
                            label == color
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                 ${tooltip}: ${Data.tooltipValue}<br>
                            `
                            );
                        }
                        if (
                            latitude === longitude &&
                            latitude === size &&
                            label === color
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `
                                    ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                     ${tooltip}: ${Data.tooltipValue}<br>
                                `
                            );
                        }
                        if (
                            latitude == longitude &&
                            label == color &&
                            label == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                                ` ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (
                            latitude == longitude &&
                            label == size &&
                            label == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                                ` ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (
                            latitude == longitude &&
                            latitude == size &&
                            latitude == color
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `   ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                     ${tooltip}: ${Data.tooltipValue}<br>
                                `
                            );
                        }
                        if (
                            latitude == longitude &&
                            latitude == size &&
                            latitude == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            latitude == longitude &&
                            latitude == color &&
                            latitude == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            (size == color && latitude == tooltip) ||
                            longitude == tooltip ||
                            (size == color && size == tooltip) ||
                            (size == tooltip && latitude == color) ||
                            longitude == color
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (latitude == longitude && latitude == size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `   ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                     ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (
                            (latitude == longitude && latitude == color) ||
                            size == color
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                 ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (
                            (latitude == longitude && latitude == tooltip) ||
                            size == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (latitude == longitude && label == size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                 ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (latitude == longitude && label == color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                 ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                  ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (latitude == longitude && label == tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                 ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }

                        if (latitude === size && label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                                ` ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (longitude === size && label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                                ` ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (latitude === tooltip && label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (longitude === tooltip && label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (latitude === size && latitude === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                 ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (longitude === size && longitude === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                 ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (latitude === size && latitude === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (longitude === size && longitude === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (latitude === color && latitude === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (longitude === color && longitude === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (latitude === size && longitude === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                                ` ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (longitude === size && latitude === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                                ` ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (latitude === size && longitude === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (longitude === size && latitude === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (latitude === color && longitude === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (longitude === color && latitude === tooltip) {
                            return `
                                ${getToolTipContent(Color, Data, apiData)}
                                ${selectors.longitude} ${apiData.headers[2]}: ${
                                Data.value[1]
                            }<br>
                                ${selectors.size} ${size}: ${
                                Data.tempSymbolSize
                            }<br>
                                ${selectors.color} ${color}: ${
                                Data.itemStyle.colorValue
                            }<br>
                            `;
                        }
                        if (size === tooltip && label === color) {
                            return `
                                ${getToolTipContent(Color, Data, apiData)}
                                ${selectors.longitude} ${apiData.headers[2]}: ${
                                Data.value[1]
                            }<br>
                                ${selectors.size} ${size}: ${
                                Data.tempSymbolSize
                            }<br>
                                ${selectors.color} ${color}: ${
                                Data.itemStyle.colorValue
                            }<br>
                            `;
                        }
                        if (latitude == longitude) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                                ` ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (label === color) {
                            return `
                                ${getToolTipContent(Color, Data, apiData)}
                                ${selectors.longitude} ${apiData.headers[2]}: ${
                                Data.value[1]
                            }<br>
                                ${selectors.size} ${size}: ${
                                Data.tempSymbolSize
                            }<br>
                                ${selectors.color} ${color}: ${
                                Data.itemStyle.colorValue
                            }<br>
                                 ${tooltip}: ${Data.tooltipValue}<br>
                            `;
                        }
                        if (size === label) {
                            return `
                                ${getToolTipContent(Color, Data, apiData)}
                                ${selectors.longitude} ${apiData.headers[2]}: ${
                                Data.value[1]
                            }<br>
                                ${selectors.size} ${size}: ${
                                Data.tempSymbolSize
                            }<br>
                                ${selectors.color} ${color}: ${
                                Data.itemStyle.colorValue
                            }<br>
                                 ${tooltip}: ${Data.tooltipValue}<br>
                            `;
                        }
                        if (tooltip === label) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                                ` ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (latitude === size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                  ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (latitude === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                ${selectors.color} ${color}: ${Data.value[0]}<br>
                                 ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (latitude === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (longitude === size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                                ` ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (longitude === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.value[1]}<br>` +
                                ` ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (longitude === tooltip) {
                            return `
                                ${getToolTipContent(Color, Data, apiData)}
                                ${selectors.longitude} ${apiData.headers[2]}: ${
                                Data.value[1]
                            }<br>
                                ${selectors.size} ${size}: ${
                                Data.tempSymbolSize
                            }<br>
                                ${selectors.color} ${color}: ${
                                Data.itemStyle.colorValue
                            }<br>
                            `;
                        }
                        if (size === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.tempSymbolSize}<br>` +
                                ` ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (size === tooltip) {
                            return `
                                ${getToolTipContent(Color, Data, apiData)}
                                ${selectors.longitude} ${apiData.headers[2]}: ${
                                Data.value[1]
                            }<br>
                                ${selectors.size} ${size}: ${
                                Data.tempSymbolSize
                            }<br>
                                ${selectors.color} ${color}: ${
                                Data.itemStyle.colorValue
                            }<br>
                            `;
                        }
                        if (color === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        return (
                            getToolTipContent(Color, Data, apiData) +
                            `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                            `${selectors.color} ${apiData.headers[4]}: ${Data.itemStyle.colorValue}<br>` +
                            ` ${apiData.headers[5]}: ${Data.tooltipValue}<br>`
                        );
                    };
                }
                if (label && latitude && longitude && size && color) {
                    return function (params) {
                        const { data: Data, color: Color } = params;
                        if (
                            latitude == longitude &&
                            latitude == size &&
                            (latitude == color || latitude == color)
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                ` ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            latitude == longitude &&
                            (latitude == color || size == color)
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                    ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (latitude == longitude && label == color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (latitude == longitude && latitude == size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (latitude === size && latitude === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[0]}<br>`
                            );
                        }
                        if (longitude === size && longitude === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[1]}<br>`
                            );
                        }
                        if (latitude === size && longitude === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[0]}<br>`
                            );
                        }
                        if (longitude === size && latitude === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[0]}<br>`
                            );
                        }
                        if (latitude === size && label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (longitude === size && label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (latitude == longitude) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                    ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                                `${selectors.color} ${data.option["_state"]["fields"]["color"]}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (size === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (latitude === size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (longitude === size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (latitude === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (longitude === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        return (
                            getToolTipContent(Color, Data, apiData) +
                            `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                            `${selectors.color} ${apiData.headers[4]}: ${Data.itemStyle.colorValue}<br>`
                        );
                    };
                }
                if (label && latitude && longitude && color && tooltip) {
                    return function (params) {
                        const { data: Data, color: Color } = params;
                        if (
                            latitude == longitude &&
                            (latitude == color || label == color) &&
                            latitude == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            latitude == longitude &&
                            (latitude == color || label == color)
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                 ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (latitude == longitude && latitude == tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}`
                            );
                        }
                        if (latitude === color && latitude === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[0]}<br>`
                            );
                        }
                        if (longitude === color && longitude === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[1]}<br>`
                            );
                        }
                        if (latitude === color && longitude === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[0]}<br>  `
                            );
                        }
                        if (longitude === color && latitude === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[1]}<br> `
                            );
                        }
                        if (latitude === tooltip && label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${tooltip}: ${Data.itemStyle.colorValue}<br> `
                            );
                        }
                        if (longitude === tooltip && label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${tooltip}: ${Data.itemStyle.colorValue}<br> `
                            );
                        }
                        if (latitude == longitude) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                ` ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                             ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                ` ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                 ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (color === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (latitude === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[0]}<br> ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (longitude === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[1]}<br> ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (latitude === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (longitude === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        return (
                            getToolTipContent(Color, Data, apiData) +
                            `${selectors.color} ${apiData.headers[3]}: ${Data.itemStyle.colorValue}<br>` +
                            ` ${apiData.headers[4]}: ${Data.tooltipValue}<br>`
                        );
                    };
                }
                if (label && latitude && longitude && size && tooltip) {
                    return function (params) {
                        const { data: Data, color: Color } = params;
                        if (
                            latitude == longitude &&
                            latitude == size &&
                            latitude == tooltip
                        ) {
                            return getToolTipContent(Color, Data, apiData);
                        }
                        if (latitude == longitude && latitude == size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (
                            (latitude == longitude && latitude == tooltip) ||
                            size == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>`
                            );
                        }
                        if (latitude === size && latitude === tooltip) {
                            return getToolTipContent(Color, Data, apiData);
                        }
                        if (longitude === size && longitude === tooltip) {
                            return getToolTipContent(Color, Data, apiData);
                        }
                        if (latitude === size && longitude === tooltip) {
                            return getToolTipContent(Color, Data, apiData);
                        }
                        if (longitude === size && latitude === tooltip) {
                            return getToolTipContent(Color, Data, apiData);
                        }
                        if (latitude == longitude) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>` +
                                ` ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (size === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>`
                            );
                        }
                        if (latitude === size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${tooltip}: ${Data.value[0]}<br>`
                            );
                        }
                        if (longitude === size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (latitude === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>`
                            );
                        }
                        if (longitude === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>`
                            );
                        }
                        return `
                            ${getToolTipContent(Color, Data, apiData)}
                            ${selectors.longitude} ${apiData.headers[2]}: ${
                            Data.value[1]
                        }<br>
                            ${selectors.size} ${apiData.headers[3]}: ${
                            Data.tempSymbolSize
                        }<br>
                            ${apiData.headers[4]}: ${Data.tooltipValue}<br>
                        `;
                    };
                }
                if (label && latitude && longitude && color) {
                    return function (params) {
                        const { data: Data, color: Color } = params;
                        if (
                            latitude == longitude &&
                            (latitude == color || label == color)
                        ) {
                            return `
                                ${getToolTipContent(Color, Data, apiData)}
                                ${selectors.color} ${color}: ${
                                Data.itemStyle.colorValue
                            }<br>
                            `;
                        }
                        if (latitude == longitude) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (latitude === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[0]}<br>`
                            );
                        }
                        if (longitude === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.value[1]}<br>`
                            );
                        }
                        if (label == color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        return (
                            getToolTipContent(Color, Data, apiData) +
                            `${selectors.color} ${apiData.headers[3]}: ${Data.itemStyle.colorValue}<br>`
                        );
                    };
                }
                if (label && latitude && longitude && size) {
                    return function (params) {
                        const { data: Data, color: Color } = params;
                        if (latitude == longitude && latitude == size) {
                            return getToolTipContent(Color, Data, apiData);
                        }
                        if (latitude == longitude) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.tempSymbolSize}<br>`
                            );
                        }
                        if (latitude == size) {
                            return getToolTipContent(Color, Data, apiData);
                        }
                        if (longitude == size) {
                            return getToolTipContent(Color, Data, apiData);
                        }
                        return (
                            getToolTipContent(Color, Data, apiData) +
                            `${selectors.size} ${apiData.headers[3]}: ${Data.tempSymbolSize}<br>`
                        );
                    };
                }
                if (label && latitude && longitude && tooltip) {
                    return function (params) {
                        const { data: Data, color: Color } = params;
                        if (latitude == longitude && latitude == tooltip) {
                            return getToolTipContent(Color, Data, apiData);
                        }
                        if (latitude == longitude) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${apiData.headers[2]}: ${Data.tooltipValue}<br>
                        `
                            );
                        }
                        if (latitude == tooltip) {
                            return getToolTipContent(Color, Data, apiData);
                        }
                        if (longitude == tooltip) {
                            return getToolTipContent(Color, Data, apiData);
                        }
                        return (
                            getToolTipContent(Color, Data, apiData) +
                            `${apiData.headers[3]}: ${Data.tooltipValue}<br>`
                        );
                    };
                }
                if (label && latitude && longitude) {
                    if (latitude == longitude) {
                        return function (params) {
                            const { data: Data, color: Color } = params;
                            return getToolTipContent(Color, Data, apiData);
                        };
                    }
                    return function (params) {
                        const { data: Data, color: Color } = params;
                        return getToolTipContent(Color, Data, apiData);
                    };
                }
            }
            return "";
        }
        return "";
    }
    return "";
};
