type SelectorAggregates = Record<string, Record<string, string>>;

type SelectorStateFields = Record<string, unknown>;

type SelectorOptionState = {
	fields: SelectorStateFields;
};

type SelectorSeries = {
	label?: {
		name?: unknown;
	};
};

type SelectorAxis = {
	pixelName?: unknown;
};

type SelectorOption = {
	state?: SelectorOptionState;
	_state?: SelectorOptionState;
	series?: SelectorSeries[];
	xAxis?: SelectorAxis;
	yAxis?: SelectorAxis;
};

type SelectorInput = {
	option: SelectorOption;
};

const getFirst = (value: unknown): string => {
	if (Array.isArray(value)) {
		return String(value[0] ?? "");
	}
	return String(value ?? "");
};

export const getSelector = (
	data: SelectorInput,
	aggregates: SelectorAggregates,
): string => {
	let fields: SelectorStateFields = {},
		label = "",
		xAxis = "",
		yAxis = "",
		size = "",
		color = "",
		tooltip = "",
		labelName = "",
		xAxisName = "",
		yAxisName = "";

	const optionState = data.option.state ?? data.option._state;

	if (optionState) {
		fields = optionState.fields;
		label = getFirst(fields["label"]);
		xAxis = getFirst(fields["XAxis"]);
		yAxis = getFirst(fields["YAxis"]);
		size = getFirst(fields["size"]);
		color = getFirst(fields["color"]);
		tooltip = getFirst(fields["tooltip"]);
		labelName = getFirst(data.option.series?.[0]?.label?.name);
		xAxisName = getFirst(data.option.xAxis?.pixelName);
		yAxisName = getFirst(data.option.yAxis?.pixelName);
	}
	const getSelectorType = (type: string): string => {
		if (!fields[type]) return "";
		const typeValues = fields[type];
		if (!Array.isArray(typeValues)) {
			return "";
		}
		return typeValues[0] === "NUMBER" ? "Average" : "Count";
	};

	const getAggregates = (field: string): string => {
		if (
			!fields[field] ||
			!aggregates[field] ||
			Object.values(aggregates[field]).length === 0
		)
			return "";
		return String(Object.values(aggregates[field])[0] ?? "");
	};
	const getSelectors = (): {
		xAxis: string;
		yAxis: string;
		size: string;
		tooltip: string;
	} => {
		void getSelectorType;
		return {
			xAxis: getAggregates("XAxis"),
			yAxis: getAggregates("YAxis"),
			size: getAggregates("size"),
			tooltip: getAggregates("tooltip"),
		};
	};
	const selectors = getSelectors();
	let selector = "";

	if (optionState) {
		if (Object.hasOwn(optionState, "fields")) {
			if (label && xAxis && yAxis && size && color && tooltip) {
				if (
					xAxis === yAxis &&
					xAxis === size &&
					xAxis === color &&
					xAxis === tooltip
				) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (
					xAxis === yAxis &&
					label === size &&
					label === color &&
					label === tooltip
				) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (
					xAxis === yAxis &&
					label === size &&
					label === color &&
					label === tooltip
				) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (
					xAxis === yAxis &&
					xAxis === size &&
					label === color &&
					xAxis === tooltip
				) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (
					xAxis === yAxis &&
					label === size &&
					xAxis === color &&
					label === tooltip
				) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (
					xAxis === yAxis &&
					label === size &&
					label === color &&
					xAxis === tooltip
				) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (
					xAxis === yAxis &&
					(size === color || label === color) &&
					size === tooltip
				) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis && label === color && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis && xAxis === color && size === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis && xAxis === tooltip && size === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === size && xAxis === color && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === size && yAxis === color && yAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === size && xAxis === color && yAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === size && yAxis === color && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === size && xAxis === color && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === size && yAxis === color && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === size && xAxis === color && yAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === size && yAxis === color && yAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (
					(xAxis === size && xAxis === tooltip && label === color) ||
					(yAxis === size && yAxis === tooltip && label === color) ||
					(xAxis === size && yAxis === tooltip && label === color) ||
					(yAxis === size && xAxis === tooltip && label === color)
				) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (
					xAxis === yAxis &&
					(label === size || xAxis === size) &&
					label === color
				) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis && label === color && label === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis && label === size && label === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),(${color})).as([${labelName}, ${xAxisName},${color}])|Group(${labelName},${color})`;
					return selector;
				}
				if (xAxis === yAxis && xAxis === size && xAxis === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis && xAxis === size && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),(${color})).as([${labelName}, ${xAxisName},${color}])|Group(${labelName},${color})`;
					return selector;
				}
				if (xAxis === yAxis && xAxis === color && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis && xAxis === size && label === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis && xAxis === size) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${color},${tooltip}])|Group(${labelName},${color})`;
					return selector;
				}
				if (
					(size === color && xAxis === tooltip) ||
					yAxis === tooltip ||
					(size === color && size === tooltip) ||
					(size === tooltip && xAxis === color) ||
					yAxis === color
				) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`;
					return selector;
				}

				if ((xAxis === yAxis && xAxis === color) || size === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${size},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (
					(xAxis === yAxis && xAxis === tooltip) ||
					size === tooltip
				) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${xAxisName},${size},${color}])|Group(${labelName},${color})`;
					return selector;
				}
				if (xAxis === yAxis && label === size) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${color},${tooltip}])|Group(${labelName},${color})`;
					return selector;
				}
				if (xAxis === yAxis && label === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${size},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis && label === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${xAxisName},${size},${color}])|Group(${labelName},${color})`;
					return selector;
				}
				if (xAxis === yAxis && label === size && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),(${color})).as([${labelName}, ${xAxisName}${color}])|Group(${labelName},${color})`;
					return selector;
				}

				if (
					(xAxis === size && label === color) ||
					(yAxis === size && label === color)
				) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (
					(xAxis === tooltip && label === color) ||
					(yAxis === tooltip && label === color)
				) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === size && xAxis === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === size && yAxis === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === size && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`;
					return selector;
				}
				if (yAxis === size && yAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`;
					return selector;
				}
				if (xAxis === color && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === color && yAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === size && yAxis === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === size && xAxis === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === size && yAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`;
					return selector;
				}
				if (yAxis === size && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`;
					return selector;
				}
				if (xAxis === color && yAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === color && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (size === tooltip && label === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${size},${color},${tooltip}])|Group(${labelName},${color})`;
					return selector;
				}
				if (label === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${size},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === size) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${color},${tooltip}])|Group(${labelName},${color})`;
					return selector;
				}
				if (xAxis === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${size},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${size},${color}])|Group(${labelName},${color})`;
					return selector;
				}
				if (yAxis === size) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${color},${tooltip}])|Group(${labelName},${color})`;
					return selector;
				}
				if (yAxis === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${size},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${size},${color}])|Group(${labelName},${color})`;
					return selector;
				}
				if (size === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${size},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (size === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${size},${color}])|Group(${labelName},${color})`;
					return selector;
				}
				if (color === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${size},${color}])|Group(${labelName},${color})`;
					return selector;
				}
				selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${size},${color},${tooltip}])|Group(${labelName},${color})`;
				return selector;
			}
			if (label && xAxis && yAxis && size && color) {
				if (
					xAxis === yAxis &&
					xAxis === size &&
					(xAxis === color || label === color)
				) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis && (xAxis === color || size === color)) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis && label === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis && xAxis === size) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),(${color})).as([${labelName}, ${xAxisName},${color}])|Group(${labelName},${color})`;
					return selector;
				}

				if (xAxis === size && xAxis === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === size && yAxis === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === size && yAxis === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === size && xAxis === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (
					(xAxis === size && label === color) ||
					(yAxis === size && label === color)
				) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${xAxisName},${size},${color}])|Group(${labelName},${color})`;
					return selector;
				}

				if (size === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === size) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`;
					return selector;
				}
				if (yAxis === size) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`;
					return selector;
				}
				if (xAxis === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (label === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`;
					return selector;
				}

				selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${size},${color}])|Group(${labelName},${color})`;
				return selector;
			}
			if (label && xAxis && yAxis && color && tooltip) {
				if (
					xAxis === yAxis &&
					(xAxis === color || label === color) &&
					xAxis === tooltip
				) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis && (xAxis === color || label === color)) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${tooltip}])|Group(${labelName})`;
					return selector;
				}

				if (xAxis === yAxis && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),(${color})).as([${labelName}, ${xAxisName},${color}])|Group(${labelName},${color})`;
					return selector;
				}

				if (xAxis === color && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === color && yAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === color && yAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === color && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (
					(xAxis === tooltip && label === color) ||
					(yAxis === tooltip && label === color)
				) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${color},${tooltip}])|Group(${labelName},${color})`;
					return selector;
				}
				if (label === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (color === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`;
					return selector;
				}
				if (xAxis === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`;
					return selector;
				}
				if (yAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`;
					return selector;
				}
				selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${color},${tooltip}])|Group(${labelName},${color})`;
				return selector;
			}
			if (label && xAxis && yAxis && size && tooltip) {
				if (xAxis === yAxis && xAxis === size && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis && xAxis === size) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (
					xAxis === yAxis &&
					(xAxis === tooltip || size === tooltip)
				) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === size && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === size && yAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === size && yAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === size && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${size},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (size === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === size) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === size) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`;
					return selector;
				}

				selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${size},${tooltip}])|Group(${labelName})`;
				return selector;
			}
			if (label && xAxis && yAxis && color) {
				if (xAxis === yAxis && (xAxis === color || label === color)) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),(${color})).as([${labelName}, ${xAxisName},${color}])|Group(${labelName},${color})`;
					return selector;
				}
				if (xAxis === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (label === color) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),(${color})).as([${labelName}, ${xAxisName},${yAxisName},${color}])|Group(${labelName},${color})`;
				return selector;
			}
			if (label && xAxis && yAxis && size) {
				if (xAxis === yAxis && xAxis === size) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${size}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === size) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === size) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.size}(${size})).as([${labelName}, ${xAxisName},${yAxisName},${size}])|Group(${labelName})`;
				return selector;
			}
			if (label && xAxis && yAxis && tooltip) {
				if (xAxis === yAxis && xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === yAxis) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${tooltip}])|Group(${labelName})`;
					return selector;
				}
				if (xAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				if (yAxis === tooltip) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
					return selector;
				}
				selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName}),${selectors.tooltip}(${tooltip})).as([${labelName}, ${xAxisName},${yAxisName},${tooltip}])|Group(${labelName})`;
				return selector;
			}
			if (label && xAxis && yAxis) {
				if (xAxis === yAxis) {
					selector = `Select(${labelName},${selectors.xAxis}(${xAxisName})).as([${labelName}, ${xAxisName}])|Group(${labelName})`;
					return selector;
				}
				selector = `Select(${labelName},${selectors.xAxis}(${xAxisName}),${selectors.yAxis}(${yAxisName})).as([${labelName}, ${xAxisName},${yAxisName}])|Group(${labelName})`;
				return selector;
			}
		}
	}
	return "";
};
