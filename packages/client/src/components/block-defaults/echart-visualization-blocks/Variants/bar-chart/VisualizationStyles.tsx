import { useEffect, useMemo, useState } from 'react';
import CustomAccordianBlock from './CustomAccordianBlock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Button, Select, Slider, styled, TextField } from '@semoss/ui';
import { BAR_CHART_DATA } from '../../Visualization.constants';
import { useBlockSettings } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { getValueByPath } from '@/utility';
import { PathValue } from '@/types';

const StyledBarStylesContainer = styled('div')<{
    width?: string;
    display?: string;
    justifyContent?: string;
}>(({ theme, width, display, justifyContent }) => ({
    width: width ?? undefined,
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    padding: '0.95rem',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    width: '100%',
}));

interface EChartVisualizationColumns {
    id: string;
    option: any;
    chartType: string;
    updateChart: (data) => void;
}

//Updating bar chart specific styles like bar width and its colour
export const VisualizationStyles = observer<EChartVisualizationColumns>(
    ({ updateChart, chartType, option, id }) => {
        const [styleData, setStyleData] = useState({
            barwidth: 45,
            minBarWidth: 1,
            maxBarWidth: 45,
            barColour: '#5470c6',
        });
        const { data, setData } = useBlockSettings<any>(id);
        const [value, setValue] = useState(data.option);
        const path = 'option';
        const barSymbols = [
            { label: 'Default(Bar)', value: 'bar' },
            { label: 'Circle', value: 'circle' },
            { label: 'Rectangle', value: 'rectangle' },
            { label: 'Rounded Rectangle', value: 'rounded_rectangle' },
            { label: 'Triangle', value: 'triangle' },
            { label: 'Diamond', value: 'diamond' },
            { label: 'Pin', value: 'pin' },
        ];
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
                                ] ?? 45,
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
                    setStyleData((prevStyleObj) => {
                        return {
                            ...prevStyleObj,
                            ...styleDataObj,
                        };
                    });
                }
            }
        }, []);

        function getFilteredSeriesIndex() {
            let index = [];
            let seriesAvailable: any[] = data.option['series'].filter((item) =>
                BAR_CHART_DATA.JSONVALUE.includes(item.type),
            );
            seriesAvailable.forEach((item, seriesIndex) => {
                index.push(seriesIndex);
            });
            return index;
        }

        //handles bar width changes and updates the value to state
        function handleInputChange(event, newValue) {
            setStyleData((prevStyleData) => {
                return {
                    ...prevStyleData,
                    ['barwidth']: newValue,
                };
            });
        }
        //handles bar colour changes and updates the value to state
        function handleBarColourChange(e) {
            setStyleData((prevStyle) => {
                return {
                    ...prevStyle,
                    ['barColour']: e.target.value,
                };
            });
        }
        //update bar chart data
        function updateChartData(barData) {
            const barWidth = barData['barwidth'];
            const barColour = barData['barColour'];
            let option = typeof value === 'string' ? JSON.parse(value) : value;
            let optionUpdated = option;
            if (option['series']) {
                let seriesDataIndex = getFilteredSeriesIndex();
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
        function runStateUpdateCustom(option) {
            setTimeout(() => {
                try {
                    setData('option', option as PathValue<any, typeof path>);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }
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
                <StyledBarStylesContainer
                    display="flex"
                    justifyContent="center"
                >
                    <Button onClick={(e) => updateChartData(styleData)}>
                        Execute
                    </Button>
                </StyledBarStylesContainer>
            </StyledBarStylesContainer>
        );
        return (
            <StyledBarStylesContainer>
                <StyledBarStylesContainer width="100%">
                    {/* <CustomAccordianBlock
                    accordianExpanded={false}
                    accordianSummaryProps={<ExpandMoreIcon />}
                    accordianSummary={'Bar Chart Style'}
                    accordianDetails={accordionDetails}
                /> */}
                    {accordionDetails}
                </StyledBarStylesContainer>
            </StyledBarStylesContainer>
        );
    },
);
