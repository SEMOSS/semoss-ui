import { useEffect, useMemo, useRef, useState } from 'react';
import { Slider, styled, TextField } from '@semoss/ui';
import { BAR_CHART_DATA } from '../../Visualization.constants';
import { useBlockSettings } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { getValueByPath } from '@/utility';
import { Paths, PathValue } from '@/types';
import { EchartVisualizationBlockDef } from '../../VisualizationBlock';
import { EchartVisualizationBlockConfig } from '@/components/block-defaults';
import { Block, BlockDef } from '@/stores';
//Styled container for bar chart
const StyledBarStylesContainer = styled('div')<{
    width?: string;
    display?: string;
    justifyContent?: string;
}>(({ width, display, justifyContent }) => ({
    width: width ?? undefined,
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    padding: '0.95rem',
}));
//styled text field for customizing text field size
const StyledTextField = styled(TextField)(({ theme }) => ({
    width: '100%',
}));

//bar chart styling component structure
interface BarChartStyle {
    barwidth: number;
    minBarWidth: number;
    maxBarWidth: number;
    barColour: string;
}
//initial bar chart style
const INITIAL_BAR_CHART_STYLES = {
    barwidth: 10,
    minBarWidth: 1,
    maxBarWidth: 45,
    barColour: '#5470c6',
};

//Updating bar chart specific styles like bar width and its colour
export const VisualizationStyles = observer(
    <D extends BlockDef = BlockDef>({
        updateChart,
        chartType,
        option,
        id,
        path,
    }) => {
        //style data for bar chart with initial styles
        const [styleData, setStyleData] = useState<BarChartStyle>(
            INITIAL_BAR_CHART_STYLES,
        );
        //chart data
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        const [value, setValue] = useState<
            typeof EchartVisualizationBlockConfig.data.option
        >(data.option);
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
        const [stylesUpdated, setStylesUpdated] = useState<
            'initial' | 'updated'
        >('initial');
        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return '';
                }
                const v = getValueByPath(data, path);
                if (typeof v === 'undefined') {
                    return '';
                } else if (typeof v === 'string') {
                    return v;
                }
                return JSON.stringify(v, null, 2);
            });
        }, [data, path]).get();
        //update the value when the computed value is changed
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);

        //for retaining the previously selected values, this will help
        useEffect(() => {
            let styleDataObj = {
                barwidth: styleData.barwidth,
                barColour: styleData.barColour,
            };
            if (option.hasOwnProperty('series') && option['series']) {
                const barChartDataIndex = option['series'].findIndex((opt) =>
                    BAR_CHART_DATA.JSONVALUE.includes(opt.type),
                );
                if (barChartDataIndex > -1) {
                    if (
                        option['series'][barChartDataIndex].hasOwnProperty(
                            'barWidth',
                        )
                    ) {
                        styleDataObj = {
                            ...styleDataObj,
                            ['barwidth']:
                                option['series'][barChartDataIndex][
                                    'barWidth'
                                ] ?? 10,
                        };
                    }
                    if (
                        option['series'][barChartDataIndex].hasOwnProperty(
                            'itemStyle',
                        )
                    ) {
                        styleDataObj = {
                            ...styleDataObj,
                            ['barColour']: option['series'][barChartDataIndex][
                                'itemStyle'
                            ].hasOwnProperty('color')
                                ? option['series'][barChartDataIndex][
                                      'itemStyle'
                                  ]['color']
                                : styleData.barColour,
                        };
                    }
                    //retaining the current component data by fetching data from json
                    setStyleData((prevStyleObj) => {
                        return {
                            ...prevStyleObj,
                            ...styleDataObj,
                        };
                    });
                }
            }
        }, []);
        //whenever input values changed, the stules updated will get new value 'updated', so retaining the state from main state object will not call updatechartdata
        useEffect(() => {
            if (stylesUpdated === 'updated') {
                updateChartData(styleData);
            }
        }, [styleData]);
        //this function will return filtered series index with type 'bar'
        function getFilteredSeriesIndex(): number[] {
            let index: number[] = [];
            let seriesAvailable = data.option['series'].filter((item) =>
                BAR_CHART_DATA.JSONVALUE.includes(item.type),
            );
            seriesAvailable.forEach((item, seriesIndex) => {
                index.push(seriesIndex);
            });
            return index;
        }

        //handles bar width changes and updates the value to state
        function handleInputChange(event, newValue) {
            if (stylesUpdated === 'initial') setStylesUpdated('updated');
            setStyleData((prevStyleData) => {
                return {
                    ...prevStyleData,
                    ['barwidth']: newValue,
                };
            });
        }
        //handles bar colour changes and updates the value to state
        function handleBarColourChange(e) {
            if (stylesUpdated === 'initial') setStylesUpdated('updated');
            setStyleData((prevStyle) => {
                return {
                    ...prevStyle,
                    ['barColour']: e.target.value,
                };
            });
        }
        //update bar chart data
        function updateChartData(barData: BarChartStyle) {
            const barWidth: number = barData['barwidth'];
            const barColour: string = barData['barColour'];
            let option = typeof value === 'string' ? JSON.parse(value) : value;
            if (option['series']) {
                let seriesDataIndex: number[] = getFilteredSeriesIndex();
                seriesDataIndex.forEach((index) => {
                    const barChartDataIndex = index;
                    if (barChartDataIndex > -1) {
                        if (barWidth !== undefined && barWidth > 0) {
                            option['series'][barChartDataIndex] = {
                                ...option['series'][barChartDataIndex],
                                ['barWidth']: barWidth,
                            };
                        }
                        if (barColour !== undefined) {
                            if (
                                option['series'][barChartDataIndex]['itemStyle']
                            ) {
                                option['series'][barChartDataIndex] = {
                                    ...option['series'][barChartDataIndex],
                                    ['itemStyle']: {
                                        ...option['series'][barChartDataIndex][
                                            'itemStyle'
                                        ],
                                        ['color']: barColour,
                                    },
                                };
                            } else {
                                option['series'][barChartDataIndex] = {
                                    ...option['series'][barChartDataIndex],
                                    ['itemStyle']: {
                                        ['color']: barColour,
                                    },
                                };
                            }
                        }
                    }
                });
            }
            runStateUpdateCustom(option);
        }
        //this function will update chart json to new option value
        function runStateUpdateCustom(
            option: typeof EchartVisualizationBlockConfig.data.option,
        ) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            timeoutRef.current = setTimeout(() => {
                try {
                    setData(
                        'option',
                        option as PathValue<D['data'], typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }
        //bar chart component content is rendered into a single variable
        const accordionDetails = (
            <StyledBarStylesContainer>
                <StyledBarStylesContainer>
                    <label>Bar Width</label>
                    <Slider
                        value={styleData.barwidth}
                        min={styleData.minBarWidth}
                        max={styleData.maxBarWidth}
                        valueLabelDisplay="auto"
                        onChange={(event, newValue) =>
                            handleInputChange(event, newValue)
                        }
                    />
                </StyledBarStylesContainer>
                <StyledBarStylesContainer>
                    <label htmlFor="bar-colour">Change Bar Colours</label>
                    <StyledTextField
                        type={'color'}
                        value={styleData.barColour}
                        id="bar-colour"
                        onChange={(e) => handleBarColourChange(e)}
                    />
                </StyledBarStylesContainer>
            </StyledBarStylesContainer>
        );
        return (
            <StyledBarStylesContainer width="100%">
                {accordionDetails}
            </StyledBarStylesContainer>
        );
    },
);
