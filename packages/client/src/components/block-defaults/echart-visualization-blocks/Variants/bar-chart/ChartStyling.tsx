import { useState } from 'react';
import { useEffect } from 'react';
import CustomAccordianBlock from './CustomAccordianBlock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Button, Select, styled, TextField } from '@semoss/ui';

const StyledSelect = styled(Select)(() => ({
    width: '100%',
}));

const StyledChartMainSection = styled('div')(() => ({
    display: 'block',
    width: '100%',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    width: '100%',
}));

const StyledChartSubSection = styled('div', {
    shouldForwardProp: (prop) => prop != 'display' && prop != 'justifyContent',
})<{ display?: string; justifyContent?: string }>(
    ({ theme, display, justifyContent }) => ({
        width: '100%',
        paddingTop: '0.5rem',
        display: display ?? undefined,
        justifyContent: justifyContent ?? undefined,
    }),
);
//handles chart styling with custom title, colour, etc
export const ChartStyling = ({ updateChart, chartType, option }) => {
    const [chartStyle, setChartStyle] = useState({
        title: '',
        alignment: '',
        textSize: 12,
        fontColour: '#000000',
        fontWeight: '',
        fontFamily: '',
    });
    const [chartPageState, setChartPageState] = useState({
        accordionExpanded: false,
    });
    const chartAlignment = [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
        { label: 'Center', value: 'center' },
    ];
    const fontWeightDetails = [
        { label: 'Normal', value: 'normal' },
        { label: 'Bold', value: 'bold' },
        { label: '100', value: '100' },
        { label: '200', value: '200' },
        { label: '300', value: '300' },
        { label: '400', value: '400' },
        { label: '500', value: '500' },
        { label: '600', value: '600' },
        { label: '700', value: '700' },
        { label: '800', value: '800' },
        { label: '900', value: '900' },
    ];
    const fontFamilyDetails = [
        { label: 'Arial', value: 'Arial' },
        { label: 'Arial Black', value: 'Arial Black' },
        { label: 'Arial Narrow', value: 'Arial Narrow' },
        { label: 'Calibri', value: 'Calibri' },
        { label: 'Century Gothic', value: 'Century Gothic' },
        { label: 'Comic Sans MS', value: 'Comic Sans MS' },
        { label: 'Courier New', value: 'Courier New' },
        { label: 'Garamound', value: 'Garamound' },
        { label: 'Georgia', value: 'Georgia' },
        { label: 'Helvetica', value: 'Helvetica' },
        { label: 'Inter', value: 'Inter' },
        { label: 'Open Sans', value: 'Open Sans' },
        { label: 'Sans-Serif', value: 'Sans-Serif' },
        { label: 'Segoe UI', value: 'Segoe UI' },
        { label: 'Times New Roman', value: 'Times New Roman' },
    ];
    //for retaining the previously selected values, this useeffect will help
    useEffect(() => {
        let chartStyleData = {
            title: '',
            alignment: '',
            textSize: 12,
            fontColour: '#000000',
            fontWeight: '',
            fontFamily: '',
        };
        if (option['title']) {
            console.log('comes');
            if (option['title'].hasOwnProperty('text')) {
                chartStyleData = {
                    ...chartStyleData,
                    ['title']: option['title']['text'],
                };
            }
            // if(option['title'].hasOwnProperty('show')){
            //     chartStyleData = {
            //         ...chartStyleData,
            //         ['show']:option['title']['show'],
            //     };
            // }
            if (option['title'].hasOwnProperty('left')) {
                chartStyleData = {
                    ...chartStyleData,
                    ['alignment']: option['title']['left'],
                };
            }
            if (
                option['title'].hasOwnProperty('textStyle') &&
                option['title']['textStyle'].hasOwnProperty('color')
            ) {
                chartStyleData = {
                    ...chartStyleData,
                    ['fontColour']: option['title']['textStyle']['color'],
                };
            }
            if (
                option['title'].hasOwnProperty('textStyle') &&
                option['title']['textStyle'].hasOwnProperty('fontWeight')
            ) {
                chartStyleData = {
                    ...chartStyleData,
                    ['fontWeight']: option['title']['textStyle']['fontWeight'],
                };
            }
            if (
                option['title'].hasOwnProperty('textStyle') &&
                option['title']['textStyle'].hasOwnProperty('fontFamily')
            ) {
                chartStyleData = {
                    ...chartStyleData,
                    ['fontFamily']: option['title']['textStyle']['fontFamily'],
                };
            }
            if (
                option['title'].hasOwnProperty('textStyle') &&
                option['title']['textStyle'].hasOwnProperty('textSize')
            ) {
                chartStyleData = {
                    ...chartStyleData,
                    ['textSize']: option['title']['textStyle']['textSize'],
                };
            }
            console.log(chartStyleData);
            setChartStyle((prevChartStyle) => {
                return {
                    ...prevChartStyle,
                    ...chartStyleData,
                };
            });
        }
    }, [, option]);
    //handles different input fields by setting values to state, whenever a change happens
    function handleInputChange(event, field) {
        setChartStyle((prevChartStyle) => {
            return {
                ...prevChartStyle,
                [field]: event.target.value,
            };
        });
        console.log(field, event.target.value);
    }
    const accordionDetails = (
        <StyledChartMainSection>
            <StyledChartSubSection>
                <label htmlFor="change-chart-title">Set Chart Title</label>
                <StyledTextField
                    value={chartStyle.title}
                    id="change-chart-title"
                    onChange={(e) => handleInputChange(e, 'title')}
                />
            </StyledChartSubSection>
            <StyledChartSubSection>
                <label htmlFor="change-alignment">Select Alignment</label>
                <StyledSelect
                    id="change-alignment"
                    value={chartStyle.alignment}
                    onChange={(e) => handleInputChange(e, 'alignment')}
                >
                    <Select.Item value="" key="-1">
                        Select Alignment
                    </Select.Item>
                    {chartAlignment.map((chart, index) => {
                        return (
                            <Select.Item value={chart.value} key={index}>
                                {chart.label}
                            </Select.Item>
                        );
                    })}
                </StyledSelect>
            </StyledChartSubSection>
            <StyledChartSubSection>
                <label htmlFor="change-text-size">Choose Text Size(px)</label>
                <StyledTextField
                    value={chartStyle.textSize}
                    type="number"
                    id="change-text-size"
                    onChange={(e) => handleInputChange(e, 'textSize')}
                />
            </StyledChartSubSection>
            <StyledChartSubSection>
                <label htmlFor="change-font-colour">Font Colour</label>
                <StyledTextField
                    value={chartStyle.fontColour}
                    id="change-font-colour"
                    type="color"
                    onChange={(e) => handleInputChange(e, 'fontColour')}
                />
            </StyledChartSubSection>
            <StyledChartSubSection>
                <label htmlFor="change-font-weight">Font Weight</label>
                <StyledSelect
                    id="change-font-weight"
                    value={chartStyle.fontWeight}
                    onChange={(e) => handleInputChange(e, 'fontWeight')}
                >
                    <Select.Item value="" key="-1">
                        Font Weight
                    </Select.Item>
                    {fontWeightDetails.map((chart, index) => {
                        return (
                            <Select.Item value={chart.value} key={index}>
                                {chart.label}
                            </Select.Item>
                        );
                    })}
                </StyledSelect>
            </StyledChartSubSection>
            <StyledChartSubSection>
                <label htmlFor="change-font-family">Font Family</label>
                <StyledSelect
                    id="change-font-family"
                    value={chartStyle.fontFamily}
                    onChange={(e) => handleInputChange(e, 'fontFamily')}
                >
                    <Select.Item value="" key="-1">
                        Select Font Family
                    </Select.Item>
                    {fontFamilyDetails.map((chart, index) => {
                        return (
                            <Select.Item value={chart.value} key={index}>
                                {chart.label}
                            </Select.Item>
                        );
                    })}
                </StyledSelect>
            </StyledChartSubSection>
            <StyledChartSubSection
                display="flex"
                justifyContent="space-between"
            >
                <Button
                    onClick={(e) => updateChart(e, chartStyle)}
                    style={{ width: '100%' }}
                >
                    Execute
                </Button>
            </StyledChartSubSection>
        </StyledChartMainSection>
    );
    return (
        <CustomAccordianBlock
            accordianExpanded={chartPageState.accordionExpanded}
            accordianSummaryProps={<ExpandMoreIcon />}
            accordianSummary={'Change Chart Properties'}
            accordianDetails={accordionDetails}
        />
    );
};
