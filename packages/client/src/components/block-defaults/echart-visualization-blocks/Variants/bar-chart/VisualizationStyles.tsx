import { useEffect, useState } from 'react';
import CustomAccordianBlock from './CustomAccordianBlock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Button, Select, Slider, styled, TextField } from '@semoss/ui';
import { BAR_CHART_DATA } from '../../Visualization.constants';

const StyledBarStylesContainer = styled('div')<{
    width?: string;
    display?: string;
    justifyContent?: string;
}>(({ theme, width, display, justifyContent }) => ({
    width: width ?? undefined,
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    width: '100%',
}));

//Updating bar chart specific styles like bar width and its colour
export const VisualizationStyles = ({ updateChart, chartType, option }) => {
    const [styleData, setStyleData] = useState({
        barwidth: 45,
        minBarWidth: 1,
        maxBarWidth: 45,
        barColour: '#5470c6',
    });
    const barSymbols = [
        { label: 'Default(Bar)', value: 'bar' },
        { label: 'Circle', value: 'circle' },
        { label: 'Rectangle', value: 'rectangle' },
        { label: 'Rounded Rectangle', value: 'rounded_rectangle' },
        { label: 'Triangle', value: 'triangle' },
        { label: 'Diamond', value: 'diamond' },
        { label: 'Pin', value: 'pin' },
    ];
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
                            option['series'][barChartDataIndex]['barWidth'] ??
                            45,
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
                            ? option['series'][barChartDataIndex]['itemStyle'][
                                  'color'
                              ]
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
            <StyledBarStylesContainer display="flex" justifyContent="center">
                <Button onClick={(e) => updateChart(styleData)}>Execute</Button>
            </StyledBarStylesContainer>
        </StyledBarStylesContainer>
    );
    return (
        <StyledBarStylesContainer>
            <StyledBarStylesContainer width="100%">
                <CustomAccordianBlock
                    accordianExpanded={false}
                    accordianSummaryProps={<ExpandMoreIcon />}
                    accordianSummary={'Bar Chart Style'}
                    accordianDetails={accordionDetails}
                />
            </StyledBarStylesContainer>
        </StyledBarStylesContainer>
    );
};
