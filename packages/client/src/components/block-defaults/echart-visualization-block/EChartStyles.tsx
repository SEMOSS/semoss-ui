import { useEffect, useState } from 'react';
import CustomAccordianBlock from './CustomAccordianBlock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Button, Select, Slider, TextField } from '@semoss/ui';
import { BAR_CHART_DATA } from './Echart.constants';
export const EChartStyles = ({ updateChart, chartType, option }) => {
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

    function handleInputChange(event, newValue) {
        setStyleData((prevStyleData) => {
            return {
                ...prevStyleData,
                ['barwidth']: newValue,
            };
        });
    }
    function handleBarColourChange(e) {
        setStyleData((prevStyle) => {
            return {
                ...prevStyle,
                ['barColour']: e.target.value,
            };
        });
    }
    const accordionDetails = (
        <div>
            <div>
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
            </div>
            {/* <div>
                <label>Bar Symbol and Size</label>

                <label htmlFor='chart-symbol'>Select a Symbol</label>
                <Select>
                    <Select.Item value={''}>Select Symbol</Select.Item>
                    {
                        barSymbols.map((barSymbol, index)=>{
                            return (
                                <Select.Item value={barSymbol.value} key={index}>{barSymbol.label}</Select.Item>
                            )
                        })
                    }
                </Select>
                <Slider 
                    // value={0}
                    min={styleData.minBarWidth}
                    max={styleData.maxBarWidth}
                    valueLabelDisplay="auto"
                    onChange={(event, newValue)=>handleInputChange(event, newValue)}
                />
            </div>             */}
            <div>
                <label htmlFor="bar-colour">Change Bar Colours</label>
                <TextField
                    type={'text'}
                    value={styleData.barColour}
                    id="bar-colour"
                    style={{ width: '100%' }}
                    onChange={(e) => handleBarColourChange(e)}
                />
            </div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <Button onClick={(e) => updateChart(styleData)}>Execute</Button>
            </div>
        </div>
    );
    return (
        <div>
            <div
                style={{
                    width: '100%',
                }}
            >
                <CustomAccordianBlock
                    accordianExpanded={false}
                    accordianSummaryProps={<ExpandMoreIcon />}
                    accordianSummary={'Bar Chart Style'}
                    accordianDetails={accordionDetails}
                />
            </div>
        </div>
    );
};
