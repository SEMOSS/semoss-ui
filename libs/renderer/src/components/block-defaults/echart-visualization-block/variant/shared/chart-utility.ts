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

function updateColorData(seriesData, appliedRules = null) {
    const isPie = seriesData.seriesType === "pie";
    if (
        appliedRules === null ||
        appliedRules.length === 0 ||
        seriesData.value === null ||
        seriesData.value === undefined
    ) {
        return (
            COLOUR_PALATTE_DATA[
                seriesData.seriesIndex % COLOUR_PALATTE_DATA.length
            ] || ECHART_BAR_COLOUR
        );
    }
    const isStack =
        seriesData.seriesType === "bar" &&
        seriesData.data?.hasOwnProperty("category");
    const isMapScatt = seriesData.seriesType === "scatter";
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
    appliedRules?.forEach((appliedRule) => {
        const {
            columnColour,
            columnComparision,
            columnName,
            filterValue,
            valuesToColour,
        } = appliedRule;
        const isApply =
            columnName == seriesData.seriesName ||
            isPie ||
            isStack ||
            isMapScatt;
        const compareValue = isMapScatt
            ? seriesData.data[columnName]
            : seriesData.value;
        if (isApply) {
            if (
                columnComparision === "==" &&
                valuesToColour.includes(parseFloat(compareValue))
            ) {
                applyColor = columnColour;
            }
            if (
                columnComparision === "!=" &&
                !valuesToColour.includes(parseFloat(compareValue))
            ) {
                applyColor = columnColour;
            }
            if (
                columnComparision == "<=" &&
                compareValue <= parseFloat(filterValue)
            ) {
                applyColor = columnColour;
            }

            if (
                columnComparision === "<" &&
                compareValue < parseFloat(filterValue)
            ) {
                applyColor = columnColour;
            }
            if (
                columnComparision === ">" &&
                compareValue > parseFloat(filterValue)
            ) {
                applyColor = columnColour;
            }
            if (
                columnComparision === ">=" &&
                compareValue >= parseFloat(filterValue)
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

export { updateColorData, columnComparisionList };
