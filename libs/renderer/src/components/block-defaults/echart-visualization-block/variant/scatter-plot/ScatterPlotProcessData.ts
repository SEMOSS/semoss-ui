type ScatterApiData = {
	values?: unknown[][];
};

type ScatterStateFields = Record<string, unknown>;

type ScatterOptionState = {
	fields: ScatterStateFields;
};

type ScatterOption = {
	state?: ScatterOptionState;
	_state?: ScatterOptionState;
	color: string[];
};

type ScatterDataInput = {
	option: ScatterOption;
};

const asString = (value: unknown): string => String(value ?? "");

const resolveColor = (
	option: ScatterOption,
	colorMap: Map<string, string>,
	colorValue: unknown,
): string => {
	const colorKey = asString(colorValue);
	if (!colorMap.has(colorKey)) {
		const palette = option.color ?? [];
		const paletteColor =
			palette.length > 0 ? palette[colorMap.size % palette.length] : "";
		colorMap.set(colorKey, asString(paletteColor));
	}

	return colorMap.get(colorKey) ?? "";
};

export const processData = (
	apiData: ScatterApiData,
	data: ScatterDataInput,
) => {
	let fields: ScatterStateFields = {},
		label = "",
		xAxis = "",
		yAxis = "",
		size = "",
		color = "",
		tooltip = "";

	const stateKey: "state" | "_state" | undefined = Object.hasOwn(
		data.option,
		"state",
	)
		? "state"
		: Object.hasOwn(data.option, "_state")
			? "_state"
			: undefined;

	const getFirst = (value: unknown): string => {
		if (Array.isArray(value)) {
			return asString(value[0]);
		}
		return asString(value);
	};

	if (stateKey) {
		const optionState = data.option[stateKey];
		if (!optionState) {
			return;
		}

		fields = optionState.fields;
		label = getFirst(fields["label"]);
		xAxis = getFirst(fields["XAxis"]);
		yAxis = getFirst(fields["YAxis"]);
		size = getFirst(fields["size"]);
		color = getFirst(fields["color"]);
		tooltip = getFirst(fields["tooltip"]);
	}
	const formatItem = (
		labelValue: unknown,
		xAxisValue: unknown,
		yAxisValue: unknown,
	) => ({
		value: [xAxisValue, yAxisValue], // x and y values
		label: {
			formatter: asString(labelValue), // Use array[0] as the label
		},
	});

	const formatDataItem = (
		labelValue: unknown,
		xAxisValue: unknown,
		yAxisValue: unknown,
		sizeValue: unknown,
		colorValue: unknown,
		tooltipValue: unknown,
		colorMap: Map<string, string>,
	) => {
		return {
			value: [xAxisValue, yAxisValue], // x and y values
			label: {
				formatter: asString(labelValue), // Use array[0] as the label
			},
			symbolSize: sizeValue, // Individual symbol size
			itemStyle: {
				color: resolveColor(data.option, colorMap, colorValue),
				colorValue,
			},
			tooltipValue, //tooltip value
		};
	};
	const formatData = (
		labelValue: unknown,
		xAxisValue: unknown,
		yAxisValue: unknown,
		sizeValue: unknown,
		colorValue: unknown,
		colorMap: Map<string, string>,
	) => {
		return {
			value: [xAxisValue, yAxisValue], // x and y values
			label: {
				formatter: asString(labelValue), // Use array[0] as the label
			},
			symbolSize: sizeValue, // Individual symbol size
			itemStyle: {
				color: resolveColor(data.option, colorMap, colorValue),
				colorValue,
			},
		};
	};
	const formatItemData = (
		labelValue: unknown,
		xAxisValue: unknown,
		yAxisValue: unknown,
		colorValue: unknown,
		tooltipValue: unknown,
		colorMap: Map<string, string>,
	) => {
		return {
			value: [xAxisValue, yAxisValue], // x and y values
			label: {
				formatter: asString(labelValue), // Use array[0] as the label
			},
			itemStyle: {
				color: resolveColor(data.option, colorMap, colorValue),
				colorValue,
			},
			tooltipValue, //tooltip value
		};
	};
	const formatItems = (
		labelValue: unknown,
		xAxisValue: unknown,
		yAxisValue: unknown,
		sizeValue: unknown,
		tooltipValue: unknown,
	) => ({
		value: [xAxisValue, yAxisValue], // x and y values
		label: {
			formatter: asString(labelValue), // Use array[0] as the label
		},
		symbolSize: sizeValue, // Individual symbol size
		tooltipValue, //tooltip value
	});
	const formatColorDataItem = (
		labelValue: unknown,
		xAxisValue: unknown,
		yAxisValue: unknown,
		colorValue: unknown,
		colorMap: Map<string, string>,
	) => {
		return {
			value: [xAxisValue, yAxisValue], // x and y values
			label: {
				formatter: asString(labelValue),
			},
			itemStyle: {
				color: resolveColor(data.option, colorMap, colorValue),
				colorValue,
			},
		};
	};
	const formatSizeDataItem = (
		labelValue: unknown,
		xAxisValue: unknown,
		yAxisValue: unknown,
		sizeValue: unknown,
	) => ({
		value: [xAxisValue, yAxisValue], // x and y values
		label: {
			formatter: asString(labelValue), // Use array[0] as the label
		},
		symbolSize: sizeValue, // Individual symbol size
	});
	const formatTooltipDataItem = (
		labelValue: unknown,
		xAxisValue: unknown,
		yAxisValue: unknown,
		tooltipValue: unknown,
	) => ({
		value: [xAxisValue, yAxisValue], // x and y values
		label: {
			formatter: asString(labelValue), // Use array[0] as the label
		},
		tooltipValue, //tooltip value
	});

	if (apiData["values"]) {
		if (stateKey) {
			const optionState = data.option[stateKey];
			if (optionState && Object.hasOwn(optionState, "fields")) {
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
						xAxis === yAxis &&
						label === size &&
						label === color &&
						label === tooltip
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
						xAxis === yAxis &&
						xAxis === size &&
						label === color &&
						label === tooltip
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
						xAxis === yAxis &&
						xAxis === size &&
						label === color &&
						xAxis === tooltip
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
						xAxis === yAxis &&
						label === size &&
						xAxis === color &&
						label === tooltip
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
						xAxis === yAxis &&
						label === size &&
						label === color &&
						xAxis === tooltip
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
					if (xAxis === yAxis && size === color && size === tooltip) {
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
						xAxis === yAxis &&
						label === color &&
						size === tooltip
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
						xAxis === yAxis &&
						size === tooltip &&
						xAxis === color
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
						xAxis === yAxis &&
						size === color &&
						xAxis === tooltip
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
					if (
						xAxis === yAxis &&
						label === size &&
						xAxis === tooltip
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
						xAxis === yAxis &&
						xAxis === size &&
						xAxis === tooltip
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
						xAxis === yAxis &&
						label === color &&
						xAxis === tooltip
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
					if (xAxis === yAxis && label === size && label === color) {
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
						xAxis === yAxis &&
						label === color &&
						label === tooltip
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
						xAxis === yAxis &&
						label === size &&
						label === tooltip
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
					if (xAxis === yAxis && xAxis === size && xAxis === color) {
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
						xAxis === yAxis &&
						xAxis === size &&
						xAxis === tooltip
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
						xAxis === yAxis &&
						xAxis === color &&
						xAxis === tooltip
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
					if (size === color && xAxis === tooltip) {
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
					if (size === color && yAxis === tooltip) {
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
					if (size === color && yAxis === tooltip) {
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
					if (size === color && size === tooltip) {
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
					if (size === tooltip && xAxis === color) {
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
					if (size === tooltip && yAxis === color) {
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
					if (xAxis === yAxis && xAxis === size) {
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
					if (xAxis === yAxis && xAxis === color) {
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
					if (xAxis === yAxis && size === color) {
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
					if (xAxis === yAxis && xAxis === tooltip) {
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
					if (xAxis === yAxis && size === tooltip) {
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
					if (xAxis === yAxis && label === size) {
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
					if (xAxis === yAxis && label === color) {
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
					if (xAxis === yAxis && label === tooltip) {
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
					if (xAxis === size && label === color) {
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
					if (xAxis === yAxis) {
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
					if (xAxis === yAxis && xAxis === size && label === color) {
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
					if (xAxis === yAxis && xAxis === size && xAxis === color) {
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
					if (xAxis === yAxis && xAxis === color) {
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
					if (xAxis === yAxis && size === color) {
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
					if (xAxis === yAxis && label === color) {
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
					if (xAxis === yAxis && xAxis === size) {
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
					if (xAxis === yAxis) {
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
					if (
						xAxis === yAxis &&
						xAxis === tooltip &&
						label === color
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
						xAxis === yAxis &&
						xAxis === tooltip &&
						xAxis === color
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
					if (xAxis === yAxis && xAxis === color) {
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
					if (xAxis === yAxis && label === color) {
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
					if (xAxis === yAxis && xAxis === tooltip) {
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
					if (xAxis === color && xAxis === tooltip) {
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
					if (xAxis === yAxis) {
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
					if (
						xAxis === yAxis &&
						xAxis === size &&
						xAxis === tooltip
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
					if (xAxis === yAxis && xAxis === size) {
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
					if (xAxis === yAxis && xAxis === tooltip) {
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
					if (xAxis === yAxis && size === tooltip) {
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
					if (xAxis === yAxis) {
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
					return apiData.values.map((item) => ({
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
};
