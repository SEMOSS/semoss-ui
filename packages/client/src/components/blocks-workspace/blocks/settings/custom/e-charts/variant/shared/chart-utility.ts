export function updateSeriesColor(
	option,
	colorArr,
	colorParent = "label",
	// biome-ignore lint/complexity/noBannedTypes: echart option type
): Object {
	const optionUpdated = option;
	optionUpdated.series.forEach((_item, index) => {
		optionUpdated.series[index][colorParent] = {
			...optionUpdated.series[index][colorParent],
			color: colorArr[index],
		};
	});
	option = optionUpdated;
	return option;
}
