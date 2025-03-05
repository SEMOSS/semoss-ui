export const formatdatapoints = (apiData, data) => {
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
    const getSelectorType = (type) => {
        return fields[type] === "NUMBER" ? "Average of" : "Count of";
    };
    const getSelectors = () => {
        return {
            xAxis: getSelectorType("XAxisDataType"),
            yAxis: getSelectorType("YAxisDataType"),
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
            ${selectors.xAxis} ${xAxis}: ${Data.value[0]}<br>
        </div>
    `;
    };
    if (apiData["values"]) {
        if (data.option.hasOwnProperty("_state")) {
            if (data.option["_state"].hasOwnProperty("fields")) {
                if (label && xAxis && yAxis && size && color && tooltip) {
                    return function (params) {
                        const { data: Data, color: Color } = params;
                        if (
                            xAxis == yAxis &&
                            xAxis == size &&
                            xAxis == color &&
                            xAxis == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                            `
                            );
                        }
                        if (
                            xAxis == yAxis &&
                            label == size &&
                            label == color &&
                            label == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                ${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>
                            `
                            );
                        }
                        if (
                            xAxis == yAxis &&
                            xAxis == size &&
                            label == color &&
                            label == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                ${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>
                            `
                            );
                        }
                        if (
                            xAxis == yAxis &&
                            xAxis == size &&
                            label == color &&
                            xAxis == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `
                                        ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                    `
                            );
                        }
                        if (
                            xAxis == yAxis &&
                            label == size &&
                            xAxis == color &&
                            label == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>
                                    ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                    ${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>
                                `
                            );
                        }
                        if (
                            xAxis == yAxis &&
                            label == size &&
                            label == color &&
                            xAxis == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>
                                    ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            xAxis == yAxis &&
                            (size == color || label == color) &&
                            size == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>
                                        ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            xAxis === size &&
                            xAxis === color &&
                            xAxis === tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.value[0]}<br>                                                                
                                                        `
                            );
                        }
                        if (
                            yAxis === size &&
                            yAxis === color &&
                            yAxis === tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br> ${selectors.color} ${color}: ${Data.value[1]}<br>
                                                        `
                            );
                        }
                        if (
                            xAxis === size &&
                            xAxis === color &&
                            yAxis === tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.value[0]}<br>`
                            );
                        }
                        if (
                            xAxis === size &&
                            yAxis === color &&
                            xAxis === tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.value[1]}<br>`
                            );
                        }
                        if (
                            yAxis === size &&
                            xAxis === color &&
                            xAxis === tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.value[0]}<br>`
                            );
                        }
                        if (
                            yAxis === size &&
                            yAxis === color &&
                            xAxis === tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.value[1]}<br>`
                            );
                        }
                        if (
                            yAxis === size &&
                            xAxis === color &&
                            yAxis === tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br> ${selectors.color} ${color}: ${Data.value[0]}<br>`
                            );
                        }
                        if (
                            xAxis === size &&
                            yAxis === color &&
                            yAxis === tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br> ${selectors.color} ${color}: ${Data.value[1]}<br>`
                            );
                        }
                        if (
                            xAxis === size &&
                            xAxis === tooltip &&
                            label === color
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br> ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            yAxis === size &&
                            yAxis === tooltip &&
                            label === color
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br> ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            xAxis === size &&
                            yAxis === tooltip &&
                            label === color
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                ` ${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            yAxis === size &&
                            xAxis === tooltip &&
                            label === color
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            xAxis == yAxis &&
                            (label == size || xAxis == size) &&
                            xAxis == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                                ${selectors.size} ${size}: ${Data.symbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            xAxis == yAxis &&
                            label == color &&
                            xAxis == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (xAxis == yAxis && label == size && label == color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                ${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>
                            `
                            );
                        }
                        if (
                            xAxis === yAxis &&
                            xAxis === size &&
                            label === color
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `
                                    ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                    ${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>
                                `
                            );
                        }
                        if (
                            xAxis == yAxis &&
                            label == color &&
                            label == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                                `${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (
                            xAxis == yAxis &&
                            label == size &&
                            label == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                                `${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (xAxis == yAxis && xAxis == size && xAxis == color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `   ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                    ${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>
                                `
                            );
                        }
                        if (
                            xAxis == yAxis &&
                            xAxis == size &&
                            xAxis == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            xAxis == yAxis &&
                            xAxis == color &&
                            xAxis == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            (size == color && xAxis == tooltip) ||
                            yAxis == tooltip ||
                            (size == color && size == tooltip) ||
                            (size == tooltip && xAxis == color) ||
                            yAxis == color
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (xAxis == yAxis && xAxis == size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `   ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                    ${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (
                            (xAxis == yAxis && xAxis == color) ||
                            size == color
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                ${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (
                            (xAxis == yAxis && xAxis == tooltip) ||
                            size == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (xAxis == yAxis && label == size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                ${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (xAxis == yAxis && label == color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>
                                 ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                 ${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (xAxis == yAxis && label == tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                ${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }

                        if (xAxis === size && label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                                `${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (yAxis === size && label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                                `${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (xAxis === tooltip && label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (yAxis === tooltip && label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (xAxis === size && xAxis === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                ${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (yAxis === size && yAxis === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br> ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                ${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (xAxis === size && xAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br> ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (yAxis === size && yAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (xAxis === color && xAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                                ${selectors.size} ${size}: ${Data.symbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (yAxis === color && yAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (xAxis === size && yAxis === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                                `${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (yAxis === size && xAxis === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                                `${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (xAxis === size && yAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (yAxis === size && xAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (xAxis === color && yAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (yAxis === color && xAxis === tooltip) {
                            return `
                                ${getToolTipContent(Color, Data, apiData)}
                                ${selectors.yAxis} ${yAxis}: ${
                                Data.value[1]
                            }<br>
                                ${selectors.size} ${size}: ${
                                Data.symbolSize
                            }<br>
                                ${selectors.color} ${color}: ${
                                Data.itemStyle.colorValue
                            }<br>
                            `;
                        }
                        if (size === tooltip && label === color) {
                            return `
                                ${getToolTipContent(Color, Data, apiData)}
                                ${selectors.yAxis} ${yAxis}: ${
                                Data.value[1]
                            }<br>
                                ${selectors.size} ${size}: ${
                                Data.symbolSize
                            }<br>
                                ${selectors.color} ${color}: ${
                                Data.itemStyle.colorValue
                            }<br>
                            `;
                        }
                        if (xAxis == yAxis) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                                `${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (label === color) {
                            return `
                                ${getToolTipContent(Color, Data, apiData)}
                                ${selectors.yAxis} ${yAxis}: ${
                                Data.value[1]
                            }<br>
                                ${selectors.size} ${size}: ${
                                Data.symbolSize
                            }<br>
                                ${selectors.color} ${color}: ${
                                Data.itemStyle.colorValue
                            }<br>
                                ${selectors.tooltip} ${tooltip}: ${
                                Data.tooltipValue
                            }<br>
                            `;
                        }
                        if (size === label) {
                            return `
                                ${getToolTipContent(Color, Data, apiData)}
                                ${selectors.yAxis} ${yAxis}: ${
                                Data.value[1]
                            }<br>
                                ${selectors.size} ${size}: ${
                                Data.symbolSize
                            }<br>
                                ${selectors.color} ${color}: ${
                                Data.itemStyle.colorValue
                            }<br>
                                ${selectors.tooltip} ${tooltip}: ${
                                Data.tooltipValue
                            }<br>
                            `;
                        }
                        if (tooltip === label) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                                `${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (xAxis === size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                                 ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                 ${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (xAxis === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                                ${selectors.size} ${size}: ${Data.symbolSize}<br>
                                ${selectors.color} ${color}: ${Data.value[0]}<br>
                                ${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (xAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (yAxis === size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                                `${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (yAxis === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.value[1]}<br>` +
                                `${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (yAxis === tooltip) {
                            return `
                                ${getToolTipContent(Color, Data, apiData)}
                                ${selectors.yAxis} ${yAxis}: ${
                                Data.value[1]
                            }<br>
                                ${selectors.size} ${size}: ${
                                Data.symbolSize
                            }<br>
                                ${selectors.color} ${color}: ${
                                Data.itemStyle.colorValue
                            }<br>
                            `;
                        }
                        if (size === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.symbolSize}<br>` +
                                `${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (size === tooltip) {
                            return `
                                ${getToolTipContent(Color, Data, apiData)}
                                ${selectors.yAxis} ${yAxis}: ${
                                Data.value[1]
                            }<br>
                                ${selectors.size} ${size}: ${
                                Data.symbolSize
                            }<br>
                                ${selectors.color} ${color}: ${
                                Data.itemStyle.colorValue
                            }<br>
                            `;
                        }
                        if (color === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                                ${selectors.size} ${size}: ${Data.symbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        return (
                            getToolTipContent(Color, Data, apiData) +
                            `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                            `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                            `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                            `${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                        );
                    };
                }
                if (label && xAxis && yAxis && size && color) {
                    return function (params) {
                        const { data: Data, color: Color } = params;
                        if (
                            xAxis == yAxis &&
                            xAxis == size &&
                            (xAxis == color || xAxis == color)
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                ` ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            xAxis == yAxis &&
                            (xAxis == color || size == color)
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>
                                    ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (xAxis == yAxis && label == color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (xAxis == yAxis && xAxis == size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (xAxis === size && xAxis === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                ` ${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.value[0]}<br>`
                            );
                        }
                        if (yAxis === size && yAxis === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.value[1]}<br>`
                            );
                        }
                        if (xAxis === size && yAxis === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                ` ${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.value[0]}<br>`
                            );
                        }
                        if (yAxis === size && xAxis === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                ` ${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.value[0]}<br>`
                            );
                        }
                        if (xAxis === size && label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (yAxis === size && label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (xAxis == yAxis) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>
                                    ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                                `${selectors.color} ${data.option["_state"]["fields"]["color"]}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (size === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (xAxis === size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (yAxis === size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (xAxis === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                                ${selectors.size} ${size}: ${Data.symbolSize}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (yAxis === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        return (
                            getToolTipContent(Color, Data, apiData) +
                            `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                            `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                            `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                        );
                    };
                }
                if (label && xAxis && yAxis && color && tooltip) {
                    return function (params) {
                        const { data: Data, color: Color } = params;
                        if (
                            xAxis == yAxis &&
                            (xAxis == color || label == color) &&
                            xAxis == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (
                            xAxis == yAxis &&
                            (xAxis == color || label == color)
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                ${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (xAxis == yAxis && xAxis == tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}`
                            );
                        }
                        if (xAxis === color && xAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br> ${selectors.color} ${color}: ${Data.value[0]}<br>`
                            );
                        }
                        if (yAxis === color && yAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br> ${selectors.color} ${color}: ${Data.value[1]}<br>`
                            );
                        }
                        if (xAxis === color && yAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.value[0]}<br>  `
                            );
                        }
                        if (yAxis === color && xAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.value[1]}<br> `
                            );
                        }
                        if (xAxis === tooltip && label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${tooltip}: ${Data.itemStyle.colorValue}<br> `
                            );
                        }
                        if (yAxis === tooltip && label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${tooltip}: ${Data.itemStyle.colorValue}<br> `
                            );
                        }
                        if (xAxis == yAxis) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                ` ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                            ${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (label === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>
                                ${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (color === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (xAxis === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.value[0]}<br>${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (yAxis === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                ` ${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.value[1]}<br>${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (xAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (yAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br> ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        return (
                            getToolTipContent(Color, Data, apiData) +
                            `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>` +
                            `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>` +
                            `${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                        );
                    };
                }
                if (label && xAxis && yAxis && size && tooltip) {
                    return function (params) {
                        const { data: Data, color: Color } = params;
                        if (
                            xAxis == yAxis &&
                            xAxis == size &&
                            xAxis == tooltip
                        ) {
                            return getToolTipContent(Color, Data, apiData);
                        }
                        if (xAxis == yAxis && xAxis == size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.tooltip}${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (
                            (xAxis == yAxis && xAxis == tooltip) ||
                            size == tooltip
                        ) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>`
                            );
                        }
                        if (xAxis === size && xAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>`
                            );
                        }
                        if (yAxis === size && yAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>`
                            );
                        }
                        if (xAxis === size && yAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>`
                            );
                        }
                        if (yAxis === size && xAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>`
                            );
                        }
                        if (xAxis == yAxis) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>` +
                                `${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (size === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.size} ${size}: ${Data.symbolSize}<br>`
                            );
                        }
                        if (xAxis === size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.tooltip}${tooltip}: ${Data.value[0]}<br>`
                            );
                        }
                        if (yAxis === size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                            );
                        }
                        if (xAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                                ${selectors.size} ${size}: ${Data.symbolSize}<br>`
                            );
                        }
                        if (yAxis === tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                                ${selectors.size} ${size}: ${Data.symbolSize}<br>`
                            );
                        }
                        return `
                            ${getToolTipContent(Color, Data, apiData)}
                            ${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                            ${selectors.size} ${size}: ${Data.symbolSize}<br>
                            ${selectors.tooltip} ${tooltip}: ${
                            Data.tooltipValue
                        }<br>
                        `;
                    };
                }
                if (label && xAxis && yAxis && color) {
                    return function (params) {
                        const { data: Data, color: Color } = params;
                        if (
                            xAxis == yAxis &&
                            (xAxis == color || label == color)
                        ) {
                            return `
                                ${getToolTipContent(Color, Data, apiData)}
                                ${selectors.color} ${color}: ${
                                Data.itemStyle.colorValue
                            }<br>
                            `;
                        }
                        if (xAxis == yAxis) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        if (xAxis === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                                ${selectors.color} ${color}: ${Data.value[0]}<br>`
                            );
                        }
                        if (yAxis === color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                                ${selectors.color} ${color}: ${Data.value[1]}<br>`
                            );
                        }
                        if (label == color) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                                ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                            );
                        }
                        return (
                            getToolTipContent(Color, Data, apiData) +
                            `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                            ${selectors.color} ${color}: ${Data.itemStyle.colorValue}<br>`
                        );
                    };
                }
                if (label && xAxis && yAxis && size) {
                    return function (params) {
                        const { data: Data, color: Color } = params;
                        if (xAxis == yAxis && xAxis == size) {
                            return getToolTipContent(Color, Data, apiData);
                        }
                        if (xAxis == yAxis) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.size} ${size}: ${Data.symbolSize}<br>`
                            );
                        }
                        if (xAxis == size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `
                            ${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                            `
                            );
                        }
                        if (yAxis == size) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `
                            ${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                            `
                            );
                        }
                        return (
                            getToolTipContent(Color, Data, apiData) +
                            `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>
                            ${selectors.size} ${size}: ${Data.symbolSize}<br>`
                        );
                    };
                }
                if (label && xAxis && yAxis && tooltip) {
                    return function (params) {
                        const { data: Data, color: Color } = params;
                        if (xAxis == yAxis && xAxis == tooltip) {
                            return getToolTipContent(Color, Data, apiData);
                        }
                        if (xAxis == yAxis) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.tooltip} ${yAxis}: ${Data.tooltipValue}<br>
                        `
                            );
                        }
                        if (xAxis == tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>`
                            );
                        }
                        if (yAxis == tooltip) {
                            return (
                                getToolTipContent(Color, Data, apiData) +
                                `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>`
                            );
                        }
                        return (
                            getToolTipContent(Color, Data, apiData) +
                            `${selectors.tooltip} ${tooltip}: ${Data.tooltipValue}<br>`
                        );
                    };
                }
                if (label && xAxis && yAxis) {
                    if (xAxis == yAxis) {
                        return function (params) {
                            const { data: Data, color: Color } = params;
                            return getToolTipContent(Color, Data, apiData);
                        };
                    }
                    return function (params) {
                        const { data: Data, color: Color } = params;
                        return (
                            getToolTipContent(Color, Data, apiData) +
                            `${selectors.yAxis} ${yAxis}: ${Data.value[1]}<br>`
                        );
                    };
                }
            }
            return "";
        }
        return "";
    }
    return "";
};
