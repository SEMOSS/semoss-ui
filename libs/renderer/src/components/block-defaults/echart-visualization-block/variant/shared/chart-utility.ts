export function updateSeriesColor(
    option,
    colorArr,
    colorParent = "label",
): Object {
    let optionUpdated = option;
    optionUpdated["series"].forEach((item, index) => {
        optionUpdated["series"][index][colorParent] = {
            ...optionUpdated["series"][index][colorParent],
            ["color"]: colorArr[index],
        };
    });
    option = optionUpdated;
    return option;
}
