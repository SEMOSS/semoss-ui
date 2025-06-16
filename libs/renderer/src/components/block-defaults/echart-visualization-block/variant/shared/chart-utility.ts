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

function updateColorData(seriesData, appliedRules = null) {
    console.log("pi chart update color ", seriesData, appliedRules);
    const isPie = seriesData.seriesType === "pie";
    if (appliedRules === null || appliedRules.length === 0) {
        if (isPie) {
            return COLOUR_PALATTE_DATA[
                seriesData.seriesIndex % COLOUR_PALATTE_DATA.length
            ];
        }
        return COLOUR_PALATTE_DATA[seriesData.seriesIndex] || ECHART_BAR_COLOUR;
    }
    let applyColor =
        seriesData.color ||
        COLOUR_PALATTE_DATA[seriesData.seriesIndex] ||
        ECHART_BAR_COLOUR;
    if (isPie) {
        applyColor =
            COLOUR_PALATTE_DATA[
                seriesData.seriesIndex % COLOUR_PALATTE_DATA.length
            ];
    }
    appliedRules?.forEach((appliedRule) => {
        const {
            columnColour,
            columnComparision,
            columnName,
            filterValue,
            valuesToColour,
        } = appliedRule;
        if (columnComparision === "==") {
            if (
                (columnName == seriesData.seriesName || isPie) &&
                valuesToColour.includes(seriesData.value)
            ) {
                applyColor = columnColour;
            }
        }
        if (columnComparision === "!=") {
            if (
                (columnName == seriesData.seriesName || isPie) &&
                !valuesToColour.includes(seriesData.value)
            ) {
                applyColor = columnColour;
            }
        }
        if (columnComparision == "<=") {
            if (
                (columnName == seriesData.seriesName || isPie) &&
                seriesData.value <= parseFloat(filterValue)
            ) {
                applyColor = columnColour;
            }
        }

        if (columnComparision === "<") {
            if (
                (columnName == seriesData.seriesName || isPie) &&
                seriesData.value < parseFloat(filterValue)
            ) {
                applyColor = columnColour;
            }
        }
        if (columnComparision === ">") {
            if (
                (columnName == seriesData.seriesName || isPie) &&
                seriesData.value > parseFloat(filterValue)
            ) {
                applyColor = columnColour;
            }
        }
        if (columnComparision === ">=") {
            if (
                (columnName == seriesData.seriesName || isPie) &&
                seriesData.value >= parseFloat(filterValue)
            ) {
                applyColor = columnColour;
            }
        }
    });

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

export { updateColorData };
