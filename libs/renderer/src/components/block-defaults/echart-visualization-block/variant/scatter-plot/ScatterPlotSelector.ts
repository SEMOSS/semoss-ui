export const getSelector = (data) => {
    let fields = "",
        label = "",
        xAxis = "",
        yAxis = "",
        size = "",
        color = "",
        tooltip = "",
        labelName = "",
        xAxisName = "",
        yAxisName = "";
    if (data.option.hasOwnProperty("_state")) {
        fields = data.option["_state"]["fields"];
        label = fields["label"];
        xAxis = fields["XAxis"];
        yAxis = fields["YAxis"];
        size = fields["size"];
        color = fields["color"];
        tooltip = fields["tooltip"];
        labelName = data.option["series"][0]["label"]["name"];
        xAxisName = data.option["xAxis"]["pixelName"];
        yAxisName = data.option["yAxis"]["pixelName"];
    }
    const getSelectorType = (type) => {
        return fields[type] === "NUMBER" ? "Average" : "Count";
    };
    const getSelectors = () => {
        return {
            xAxis: getSelectorType("XAxisDataType"),
            yAxis: getSelectorType("YAxisDataType"),
            size: getSelectorType("sizeDataType"),
            tooltip: getSelectorType("tooltipDataType"),
        };
    };
    const selectors = getSelectors();
    let selector = "";
    if (data.hasOwnProperty("columns")) {
        if (data.option.hasOwnProperty("_state")) {
            if (data.option["_state"].hasOwnProperty("fields")) {
                if (label && xAxis && yAxis && size && color && tooltip) {
                    if (
                        xAxis == yAxis &&
                        xAxis == size &&
                        xAxis == color &&
                        xAxis == tooltip
                    ) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`);
                    }
                    if (
                        xAxis == yAxis &&
                        label == size &&
                        label == color &&
                        label == tooltip
                    ) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`);
                    }
                    if (
                        xAxis == yAxis &&
                        label == size &&
                        label == color &&
                        label == tooltip
                    ) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`);
                    }
                    if (
                        xAxis == yAxis &&
                        xAxis == size &&
                        label == color &&
                        xAxis == tooltip
                    ) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`);
                    }
                    if (
                        xAxis == yAxis &&
                        label == size &&
                        xAxis == color &&
                        label == tooltip
                    ) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`);
                    }
                    if (
                        xAxis == yAxis &&
                        label == size &&
                        label == color &&
                        xAxis == tooltip
                    ) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`);
                    }
                    if (
                        xAxis == yAxis &&
                        (size == color || label == color) &&
                        size == tooltip
                    ) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`);
                    }
                    if (xAxis == yAxis && label == color && xAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`);
                    }
                    if (xAxis == yAxis && xAxis == color && size == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`);
                    }
                    if (xAxis == yAxis && xAxis == tooltip && size == color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`);
                    }
                    if (xAxis == size && xAxis == color && xAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (yAxis == size && yAxis == color && yAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (xAxis == size && xAxis == color && yAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (xAxis == size && yAxis == color && xAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (yAxis == size && xAxis == color && xAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (yAxis == size && yAxis == color && xAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (yAxis == size && xAxis == color && yAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (xAxis == size && yAxis == color && yAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (
                        (xAxis == size && xAxis == tooltip && label == color) ||
                        (yAxis == size && yAxis == tooltip && label == color) ||
                        (xAxis == size && yAxis == tooltip && label == color) ||
                        (yAxis == size && xAxis == tooltip && label == color)
                    ) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (
                        xAxis == yAxis &&
                        (label == size || xAxis == size) &&
                        label == color
                    ) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${tooltip}])|Group(${labelName})`);
                    }
                    if (xAxis == yAxis && label == color && label == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`);
                    }
                    if (xAxis == yAxis && label == size && label == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),(${color})).as([${labelName}, ${xAxisName},${color}])|Group(${labelName},${color})`);
                    }
                    if (xAxis == yAxis && xAxis == size && xAxis == color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${tooltip}])|Group(${labelName})`);
                    }
                    if (xAxis == yAxis && xAxis == size && xAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),(${color})).as([${labelName}, ${xAxisName},${color}])|Group(${labelName},${color})`);
                    }
                    if (xAxis == yAxis && xAxis == color && xAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`);
                    }
                    if (xAxis === yAxis && xAxis === size && label === color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${tooltip}])|Group(${labelName})`);
                    }
                    if (xAxis == yAxis && xAxis == size) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${color},${tooltip}])|Group(${labelName},${color})`);
                    }
                    if (
                        (size == color && xAxis == tooltip) ||
                        yAxis == tooltip ||
                        (size == color && size == tooltip) ||
                        (size == tooltip && xAxis == color) ||
                        yAxis == color
                    ) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`);
                    }

                    if ((xAxis == yAxis && xAxis == color) || size == color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${size},${tooltip}])|Group(${labelName})`);
                    }
                    if (
                        (xAxis == yAxis && xAxis == tooltip) ||
                        size == tooltip
                    ) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${xAxisName},${size},${color}])|Group(${labelName},${color})`);
                    }
                    if (xAxis == yAxis && label == size) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${color},${tooltip}])|Group(${labelName},${color})`);
                    }
                    if (xAxis == yAxis && label == color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${size},${tooltip}])|Group(${labelName})`);
                    }
                    if (xAxis == yAxis && label == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${xAxisName},${size},${color}])|Group(${labelName},${color})`);
                    }
                    if (xAxis == yAxis && label == size && xAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),(${color})).as([${labelName}, ${xAxisName}${color}])|Group(${labelName},${color})`);
                    }

                    if (
                        (xAxis == size && label == color) ||
                        (yAxis == size && label == color)
                    ) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`);
                    }
                    if (
                        (xAxis == tooltip && label == color) ||
                        (yAxis == tooltip && label == color)
                    ) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`);
                    }
                    if (xAxis == size && xAxis == color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`);
                    }
                    if (yAxis == size && yAxis == color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`);
                    }
                    if (xAxis == size && xAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`);
                    }
                    if (yAxis == size && yAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`);
                    }
                    if (xAxis == color && xAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`);
                    }
                    if (yAxis == color && yAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`);
                    }
                    if (xAxis == size && yAxis == color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`);
                    }
                    if (yAxis == size && xAxis == color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`);
                    }
                    if (xAxis == size && yAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`);
                    }
                    if (yAxis == size && xAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`);
                    }
                    if (xAxis == color && yAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`);
                    }
                    if (yAxis == color && xAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`);
                    }
                    if (size === tooltip && label === color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`);
                    }
                    if (xAxis == yAxis) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${size},${color},${tooltip}])|Group(${labelName},${color})`);
                    }
                    if (label === color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${size},${tooltip}])|Group(${labelName})`);
                    }
                    if (xAxis == size) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${color},${tooltip}])|Group(${labelName},${color})`);
                    }
                    if (xAxis == color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${size},${tooltip}])|Group(${labelName})`);
                    }
                    if (xAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${size},${color}])|Group(${labelName},${color})`);
                    }
                    if (yAxis == size) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${color},${tooltip}])|Group(${labelName},${color})`);
                    }
                    if (yAxis == color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${size},${tooltip}])|Group(${labelName})`);
                    }
                    if (yAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${size},${color}])|Group(${labelName},${color})`);
                    }
                    if (size === color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${size},${tooltip}])|Group(${labelName})`);
                    }
                    if (size === tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${size},${color}])|Group(${labelName},${color})`);
                    }
                    if (color === tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${size},${color}])|Group(${labelName},${color})`);
                    }
                    return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${size},${color},${tooltip}])|Group(${labelName},${color})`);
                }
                if (label && xAxis && yAxis && size && color) {
                    if (
                        xAxis == yAxis &&
                        xAxis == size &&
                        (xAxis == color || label == color)
                    ) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`);
                    }
                    if (xAxis == yAxis && (xAxis == color || size == color)) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`);
                    }
                    if (xAxis == yAxis && label == color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`);
                    }
                    if (xAxis == yAxis && xAxis == size) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),(${color})).as([${labelName}, ${xAxisName},${color}])|Group(${labelName},${color})`);
                    }

                    if (xAxis == size && xAxis == color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (yAxis == size && yAxis == color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (xAxis == size && yAxis == color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (yAxis === size && xAxis === color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (
                        (xAxis == size && label == color) ||
                        (yAxis == size && label == color)
                    ) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (xAxis == yAxis) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${xAxisName},${size},${color}])|Group(${labelName},${color})`);
                    }

                    if (size == color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`);
                    }
                    if (xAxis === size) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`);
                    }
                    if (yAxis === size) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`);
                    }
                    if (xAxis === color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`);
                    }
                    if (yAxis === color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`);
                    }
                    if (label === color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`);
                    }

                    return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${size},${color}])|Group(${labelName},${color})`);
                }
                if (label && xAxis && yAxis && color && tooltip) {
                    if (
                        xAxis == yAxis &&
                        (xAxis == color || label == color) &&
                        xAxis == tooltip
                    ) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`);
                    }
                    if (xAxis == yAxis && (xAxis == color || label == color)) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${tooltip}])|Group(${labelName})`);
                    }

                    if (xAxis == yAxis && xAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),(${color})).as([${labelName}, ${xAxisName},${color}])|Group(${labelName},${color})`);
                    }

                    if (xAxis == color && xAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (yAxis == color && yAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (xAxis === color && yAxis === tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (yAxis === color && xAxis === tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (
                        (xAxis === tooltip && label === color) ||
                        (yAxis === tooltip && label === color)
                    ) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (xAxis == yAxis) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${color},${tooltip}])|Group(${labelName},${color})`);
                    }
                    if (label === color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`);
                    }
                    if (color == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`);
                    }
                    if (xAxis == color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`);
                    }
                    if (yAxis === color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`);
                    }
                    if (xAxis === tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`);
                    }
                    if (yAxis === tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`);
                    }
                    return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${color},${tooltip}])|Group(${labelName},${color})`);
                }
                if (label && xAxis && yAxis && size && tooltip) {
                    if (xAxis == yAxis && xAxis == size && xAxis == tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`);
                    }
                    if (xAxis == yAxis && xAxis == size) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${tooltip}])|Group(${labelName})`);
                    }
                    if (
                        xAxis == yAxis &&
                        (xAxis == tooltip || size == tooltip)
                    ) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`);
                    }
                    if (xAxis === size && xAxis === tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (yAxis === size && yAxis === tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (xAxis === size && yAxis === tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (yAxis === size && xAxis === tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (xAxis == yAxis) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${size},${tooltip}])|Group(${labelName})`);
                    }
                    if (size === tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`);
                    }
                    if (xAxis === size) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`);
                    }
                    if (yAxis === size) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`);
                    }
                    if (xAxis === tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`);
                    }
                    if (yAxis === tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`);
                    }

                    return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${size},${tooltip}])|Group(${labelName})`);
                }
                if (label && xAxis && yAxis && color) {
                    if (xAxis == yAxis && (xAxis == color || label == color)) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`);
                    }
                    if (xAxis === yAxis) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),(${color})).as([${labelName}, ${xAxisName},${color}])|Group(${labelName},${color})`);
                    }
                    if (xAxis === color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (yAxis === color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (label === color) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`);
                }
                if (label && xAxis && yAxis && size) {
                    if (xAxis === yAxis && xAxis === size) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`);
                    }
                    if (xAxis === yAxis) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`);
                    }
                    if (xAxis === size) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (yAxis === size) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`);
                }
                if (label && xAxis && yAxis && tooltip) {
                    if (xAxis === yAxis && xAxis === tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`);
                    }
                    if (xAxis === yAxis) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${tooltip}])|Group(${labelName})`);
                    }
                    if (xAxis === tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    if (yAxis === tooltip) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                    }
                    return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`);
                }
                if (label && xAxis && yAxis) {
                    if (xAxis == yAxis) {
                        return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`);
                    }
                    return (selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`);
                }
            }
        }
        return "";
    }
    return "";
};
