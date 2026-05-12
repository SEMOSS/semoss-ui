type MapValue = string | number;
type MapRow = MapValue[];

interface MapApiData {
	values?: MapRow[];
	headers?: string[];
}

interface MapOptionFields {
	label?: string;
	Latitude?: string;
	Longitude?: string;
	size?: string;
	color?: string;
	tooltip?: string;
	[key: string]: string | undefined;
}

interface MapOptionState {
	fields?: MapOptionFields;
}

interface MapChartOption {
	state?: MapOptionState;
	_state?: MapOptionState;
	color: string[];
	symbolSize: number | string;
}

interface MapChartInput {
	option: MapChartOption;
}

interface MapPointData {
	value: [number, number];
	label: {
		formatter: string;
	};
	tempSymbolSize?: number;
	symbolSize?: number;
	itemStyle?: {
		color: string;
		colorValue: MapValue;
	};
	tooltipValue?: MapValue;
}

const toNumber = (value: MapValue): number => Number(value);

const resolveColor = (
	colorValue: MapValue,
	colorMap: Map<MapValue, string>,
	palette: string[],
): string => {
	if (!colorMap.has(colorValue)) {
		const paletteIndex = colorMap.size % (palette.length || 1);
		colorMap.set(colorValue, palette[paletteIndex] ?? "");
	}

	return colorMap.get(colorValue) ?? "";
};

export const processData = (
	apiData: MapApiData,
	data: MapChartInput,
): MapPointData[] | undefined => {
	let fields: MapOptionFields = {};
	let label = "";
	let latitude = "";
	let longitude = "";
	let size = "";
	let color = "";
	let tooltip = "";
	const optionState = data.option?.state ?? data.option?._state;
	if (optionState?.fields) {
		fields = optionState.fields;
		label = fields["label"] ?? "";
		latitude = fields["Latitude"] ?? "";
		longitude = fields["Longitude"] ?? "";
		size = fields["size"] ?? "";
		color = fields["color"] ?? "";
		tooltip = fields["tooltip"] ?? "";
	}
	const baseSymbolSize = Number(data.option.symbolSize ?? 0);
	const formatItem = (
		labelValue: MapValue,
		latitudeValue: MapValue,
		longitudeValue: MapValue,
	): MapPointData => ({
		value: [toNumber(longitudeValue), toNumber(latitudeValue)],
		label: {
			formatter: labelValue.toString(),
		},
	});

	const formatDataItem = (
		labelValue: MapValue,
		latitudeValue: MapValue,
		longitudeValue: MapValue,
		sizeValue: MapValue,
		colorValue: MapValue,
		tooltipValue: MapValue,
		colorMap: Map<MapValue, string>,
	): MapPointData => {
		const adjustedSize = Math.min(toNumber(sizeValue) + baseSymbolSize, 50);
		return {
			value: [toNumber(longitudeValue), toNumber(latitudeValue)],
			label: {
				formatter: labelValue.toString(),
			},
			tempSymbolSize: toNumber(sizeValue),
			symbolSize: adjustedSize,
			itemStyle: {
				color: resolveColor(colorValue, colorMap, data.option.color),
				colorValue,
			},
			tooltipValue,
		};
	};
	const formatData = (
		labelValue: MapValue,
		latitudeValue: MapValue,
		longitudeValue: MapValue,
		sizeValue: MapValue,
		colorValue: MapValue,
		colorMap: Map<MapValue, string>,
	): MapPointData => {
		const adjustedSize = Math.min(toNumber(sizeValue) + baseSymbolSize, 50);
		return {
			value: [toNumber(longitudeValue), toNumber(latitudeValue)],
			label: {
				formatter: labelValue.toString(),
			},
			tempSymbolSize: toNumber(sizeValue),
			symbolSize: adjustedSize,
			itemStyle: {
				color: resolveColor(colorValue, colorMap, data.option.color),
				colorValue,
			},
		};
	};
	const formatItemData = (
		labelValue: MapValue,
		latitudeValue: MapValue,
		longitudeValue: MapValue,
		colorValue: MapValue,
		tooltipValue: MapValue,
		colorMap: Map<MapValue, string>,
	): MapPointData => {
		return {
			value: [toNumber(longitudeValue), toNumber(latitudeValue)],
			label: {
				formatter: labelValue.toString(),
			},
			itemStyle: {
				color: resolveColor(colorValue, colorMap, data.option.color),
				colorValue,
			},
			tooltipValue,
		};
	};
	const formatItems = (
		labelValue: MapValue,
		latitudeValue: MapValue,
		longitudeValue: MapValue,
		sizeValue: MapValue,
		tooltipValue: MapValue,
	): MapPointData => {
		const adjustedSize = Math.min(toNumber(sizeValue) + baseSymbolSize, 50);
		return {
			value: [toNumber(longitudeValue), toNumber(latitudeValue)],
			label: {
				formatter: labelValue.toString(),
			},
			tempSymbolSize: toNumber(sizeValue),
			symbolSize: adjustedSize,
			tooltipValue,
		};
	};
	const formatColorDataItem = (
		labelValue: MapValue,
		latitudeValue: MapValue,
		longitudeValue: MapValue,
		colorValue: MapValue,
		colorMap: Map<MapValue, string>,
	): MapPointData => {
		return {
			value: [toNumber(longitudeValue), toNumber(latitudeValue)],
			label: {
				formatter: labelValue.toString(),
			},
			itemStyle: {
				color: resolveColor(colorValue, colorMap, data.option.color),
				colorValue,
			},
		};
	};
	const formatSizeDataItem = (
		labelValue: MapValue,
		latitudeValue: MapValue,
		longitudeValue: MapValue,
		sizeValue: MapValue,
	): MapPointData => {
		const adjustedSize = Math.min(toNumber(sizeValue) + baseSymbolSize, 50);

		return {
			value: [toNumber(longitudeValue), toNumber(latitudeValue)],
			label: {
				formatter: labelValue.toString(),
			},
			tempSymbolSize: toNumber(sizeValue),
			symbolSize: adjustedSize,
		};
	};
	const formatTooltipDataItem = (
		labelValue: MapValue,
		latitudeValue: MapValue,
		longitudeValue: MapValue,
		tooltipValue: MapValue,
	): MapPointData => ({
		value: [toNumber(longitudeValue), toNumber(latitudeValue)],
		label: {
			formatter: labelValue.toString(),
		},
		tooltipValue,
	});

	if (apiData["values"]) {
		if (optionState?.fields) {
			if (label && latitude && longitude && size && color && tooltip) {
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
					latitude === longitude &&
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
					latitude === longitude &&
					latitude === size &&
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
					latitude === longitude &&
					latitude === size &&
					label === color &&
					latitude === tooltip
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
					latitude === longitude &&
					label === size &&
					latitude === color &&
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
					latitude === longitude &&
					label === size &&
					label === color &&
					latitude === tooltip
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
					latitude === longitude &&
					size === color &&
					size === tooltip
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
					latitude === longitude &&
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
					latitude === longitude &&
					size === tooltip &&
					latitude === color
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
					latitude === longitude &&
					size === color &&
					latitude === tooltip
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
					latitude === longitude &&
					label === size &&
					latitude === tooltip
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
					latitude === longitude &&
					latitude === size &&
					latitude === tooltip
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
					latitude === longitude &&
					label === color &&
					latitude === tooltip
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
					latitude === longitude &&
					label === size &&
					label === color
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
					latitude === longitude &&
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
					latitude === longitude &&
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
				if (
					latitude === longitude &&
					latitude === size &&
					latitude === color
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
					latitude === longitude &&
					latitude === size &&
					latitude === tooltip
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
					latitude === longitude &&
					latitude === color &&
					latitude === tooltip
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
				if (size === color && latitude === tooltip) {
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
				if (size === color && longitude === tooltip) {
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
				if (size === color && longitude === tooltip) {
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
				if (size === tooltip && latitude === color) {
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
				if (size === tooltip && longitude === color) {
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
				if (latitude === longitude && latitude === size) {
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
				if (latitude === longitude && latitude === color) {
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
				if (latitude === longitude && size === color) {
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
				if (latitude === longitude && latitude === tooltip) {
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
				if (latitude === longitude && size === tooltip) {
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
				if (latitude === longitude && label === size) {
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
				if (latitude === longitude && label === color) {
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
				if (latitude === longitude && label === tooltip) {
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
				if (latitude === size && label === color) {
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
				if (latitude === longitude) {
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
					latitude === longitude &&
					latitude === size &&
					label === color
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
					latitude === longitude &&
					latitude === size &&
					latitude === color
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
				if (latitude === longitude && latitude === color) {
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
				if (latitude === longitude && size === color) {
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
				if (latitude === longitude && label === color) {
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
				if (latitude === longitude && latitude === size) {
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
				if (latitude === longitude) {
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
					latitude === longitude &&
					latitude === tooltip &&
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
					latitude === longitude &&
					latitude === tooltip &&
					latitude === color
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
				if (latitude === longitude && latitude === color) {
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
				if (latitude === longitude && label === color) {
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
				if (latitude === longitude && latitude === tooltip) {
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
				if (latitude === color && latitude === tooltip) {
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
				if (latitude === longitude) {
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
					latitude === longitude &&
					latitude === size &&
					latitude === tooltip
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
				if (latitude === longitude && latitude === size) {
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
				if (latitude === longitude && latitude === tooltip) {
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
				if (latitude === longitude && size === tooltip) {
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
				if (latitude === longitude) {
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
					...formatItems(item[0], item[1], item[2], item[4], item[4]),
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
					...formatSizeDataItem(item[0], item[1], item[2], item[3]),
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
		if (label && latitude && longitude) {
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
};
