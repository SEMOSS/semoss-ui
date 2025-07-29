import { ECHART_BAR_COLOUR } from "../../Visualization.constants";

const COLOUR_PALATTE_DATA = [
	"#5470c6",
	"#91cc75",
	"#fac858",
	"#ee6666",
	"#73c0de",
	"#3ba272",
	"#fc8452",
	"#9a60b4",
	"#ea7ccc",
];

// const pieColors = [
//     "#ff6f61",
//     "#6b5b95",
//     "#88b04b",
//     "#f7cac9",
//     "#92a8d1",
//     "#034f84",
//     "#f7786b",
//     "#deeaee",
// ];

const columnComparisionList = [
	{
		name: "is Equal To",
		value: "==",
	},
	{
		name: "is Not Equal To",
		value: "!=",
	},
	{
		name: "is Less than",
		value: "<",
	},
	{
		name: "is greater than",
		value: ">",
	},
	{
		name: "is Lesser than or Equal to",
		value: "<=",
	},
	{
		name: "is greater than or Equal to",
		value: ">=",
	},
];

function updateColorData(seriesData: any, appliedRules: any[] = null) {
	const isPie = seriesData.seriesType === "pie";
	const isStack =
		seriesData.seriesType === "bar" &&
		seriesData.data?.hasOwnProperty("category");
	const isScatter = seriesData.seriesType === "scatter";

	// Fallback to palette if no rules or value is invalid
	if (
		!appliedRules ||
		appliedRules.length === 0 ||
		seriesData.value == null
	) {
		return (
			COLOUR_PALATTE_DATA[
				seriesData.seriesIndex % COLOUR_PALATTE_DATA.length
			] || ECHART_BAR_COLOUR
		);
	}

	let applyColor =
		seriesData.color ||
		(seriesData.seriesType === "bar"
			? COLOUR_PALATTE_DATA[seriesData.dataIndex]
			: COLOUR_PALATTE_DATA[seriesData.seriesIndex]) ||
		ECHART_BAR_COLOUR;

	if (isPie) {
		applyColor =
			COLOUR_PALATTE_DATA[
				seriesData.seriesIndex % COLOUR_PALATTE_DATA.length
			];
	}

	for (const rule of appliedRules) {
		const {
			columnColour,
			columnComparision,
			columnName,
			filterValue,
			valuesToColour,
		} = rule;

		const isApply =
			columnName === seriesData.seriesName ||
			isPie ||
			isStack ||
			isScatter;

		const compareValue = isScatter
			? seriesData.data[columnName]
			: seriesData.value;

		if (!isApply) continue;

		switch (columnComparision) {
			case "==":
				if (valuesToColour.includes(parseFloat(compareValue))) {
					applyColor = columnColour;
				}
				break;
			case "!=":
				if (!valuesToColour.includes(parseFloat(compareValue))) {
					applyColor = columnColour;
				}
				break;
			case "<=":
				if (compareValue <= parseFloat(filterValue)) {
					applyColor = columnColour;
				}
				break;
			case "<":
				if (compareValue < parseFloat(filterValue)) {
					applyColor = columnColour;
				}
				break;
			case ">":
				if (compareValue > parseFloat(filterValue)) {
					applyColor = columnColour;
				}
				break;
			case ">=":
				if (compareValue >= parseFloat(filterValue)) {
					applyColor = columnColour;
				}
				break;
			default:
				break;
		}
	}

	return applyColor;
}

export function updateSeriesColor(
	option,
	colorArr,
	colorParent = "label",
): Object {
	const optionUpdated = option;
	optionUpdated["series"].forEach((item, index) => {
		optionUpdated["series"][index][colorParent] = {
			...optionUpdated["series"][index][colorParent],
			["color"]: colorArr[index],
		};
	});
	option = optionUpdated;
	return option;
}

export { updateColorData, columnComparisionList };
