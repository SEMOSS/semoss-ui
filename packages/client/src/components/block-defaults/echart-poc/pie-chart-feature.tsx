import { useBlock, useBlocks, useBlockSettings } from '@/hooks';
import { Button, Select, Stack, styled, TextField } from '@semoss/ui';
import { EChartVisualizationToolDef } from './echartblocktools';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { Paths, PathValue } from '@/types';
import CustomAccordianBlock from './CustomAccordianBlock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Autocomplete, Checkbox } from '@mui/material';
import { CheckBox } from '@mui/icons-material';
import { TextBlock } from '../text-block';
import { CustomizeValueLabels } from './CustomizeValueLabels';
import { CustomizeTitle } from './CustomTitle';
import { ToolTips } from './toolTips';

const StyledChartContainer = styled('div')(() => ({
    width: 'fit-content',
    minWidth: '50px',
    minHeight: '50px',
}));
const Alignment = ['Left', 'Right', 'Center'];
const fontWeights = [
    'bold',
    'normal',
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '900',
];
const fontFamilys = [
    'Arail',
    'Arail Black',
    'Arail Narrow',
    'Calibri',
    'Century Gothic',
    'Comic Sans MS',
    'Courier New',
    'Garamond',
    'Georgia',
    'Helvetica',
    'Inter',
    'Open Sans',
    'Sans-Serif',
    'Segoe UI',
    'Times New Roman',
    'Verdana',
];
const colorPalettes = [
    {
        name: 'Palette1',
        colors: [
            '#40A0FF',
            '#9A74B6',
            '#FBB83A',
            '#F18630',
            '#51ACA8',
            '#187687',
            '#CD5498',
            '#364A90',
        ],
    },
    {
        name: 'Palette2',
        colors: [
            '#a832a6',
            '#32a8a6',
            '#f54242',
            '#42f560',
            '#7a42f5',
            '#d1f542',
            '#42f5d4',
            '#f542a3',
        ],
    },
    {
        name: 'Palette3',
        colors: [
            '#ff6f61',
            '#6b5b95',
            '#88b04b',
            '#f7cac9',
            '#92a8d1',
            '#034f84',
            '#f7786b',
            '#deeaee',
        ],
    },
];

const ColorPalettes = ({ palettes, onPaletteClick }) => {
    return (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {palettes.map((palette, index) => (
                <div
                    key={index}
                    onClick={() => onPaletteClick(palette.colors)}
                    style={{
                        display: 'flex',
                        padding: '10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: '1px solid #ccc',
                        width: '180px',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                    }}
                >
                    {palette.colors.map((color, colorIndex) => (
                        <div
                            key={colorIndex}
                            style={{
                                backgroundColor: color,
                                width: '20px',
                                height: '20px',
                                margin: '2px',
                                borderRadius: '3px',
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export interface E_PieChartDef {
    showTool: boolean;
    id: any;
}
const E_PieChart = observer<EChartVisualizationToolDef>(({ showTool, id }) => {
    const { data, setData } = useBlockSettings<any>(id);
    const [chartType, SetChartType] = useState('');

    console.log('Dattaaaaa', data);
    const [custonFontFlag, setcustonFontFlag] = useState(false);
    const [chartValues, setChartValues] = useState({
        chartTitle: '',
    });
    //For Title Section
    const [TitleSection, setTitleSection] = useState({
        titleName: '',
        alignment: 'center',
        titleSize: 16,
        titleColor: '#000000',
        titleFontWeight: 'normal',
        titleFontFamily: '',
    });
    //For Custom Label Section
    const [LabelSection, setLabelSection] = useState({
        labelPostion: 'outside',
        labelSize: 10,
        labelLineLength: 15,
    });
    const [LegendSection, setlegendSection] = useState({
        legendVertical: '',
        legendHorizontal: '',
        legendOrientation: '',
        legendFontSize: '',
        legendFontFamily: '',
        legendFontColor: '#000000',
        legendBackgroundColor: '#FFFFFF',
    });
    const [FeatureSection, setFeatureSection] = useState({
        selectedColorPallet: colorPalettes[0].colors,
        donutToggleFlag: false,
        showTitleFlag: false,
        tooltipToggleFlag: false,
        valueLabelFlag: true,
        titleSection: {
            titleName: '',
            alignment: 'center',
            titleSize: 16,
            titleColor: '#000000',
            titleFontWeight: 'normal',
            titleFontFamily: '',
        },
        labelSection: {
            labelPostion: 'outside',
            labelSize: 10,
            labelLineLength: 15,
        },
        legendSection: {
            legendVertical: '',
            legendHorizontal: '',
            legendOrientation: '',
            legendFontSize: '',
            legendFontFamily: '',
            legendFontColor: '#000000',
            legendBackgroundColor: '#FFFFFF',
        },
    });
    // useEffect(()=>{
    //     let option = data.option;
    //     if(option.hasOwnProperty('title')){
    //         setTitleSection((prveChartValues)=>{
    //             return {
    //                 ...prveChartValues,
    //                 ['chartTitle']:option['title'].hasOwnProperty('text') ? option['title']['text'] : ''
    //             }
    //         })
    //     }
    // },[])

    // useEffect(()=>{
    //     if(data.variation.startsWith("echart")){
    //         SetChartType("Echart")
    //     }
    //     else{
    //         SetChartType("Vega")
    //     }
    //     let option = data.option;
    //     let pieindex = option['series'].findIndex((opt) =>
    //      opt.type === 'pie',
    //      );
    //      if(Array.isArray(option['series'][pieindex].radius)){
    //         FeatureSection.donutToggleFlag = true
    //      }
    //      else{
    //         FeatureSection.donutToggleFlag = false
    //      }
    //      if(option['tooltip'].show){
    //         FeatureSection.tooltipToggleFlag = false
    //      }
    //      else{
    //         FeatureSection.tooltipToggleFlag = true
    //      }
    //      if(option['series'][pieindex]['label'].show){
    //         FeatureSection.valueLabelFlag = true
    //      }else{
    //         FeatureSection.valueLabelFlag = false
    //      }
    // },[])
    // useEffect(()=>{
    //     let option = data.option;
    //     let pieindex = option['series'].findIndex((opt) =>
    //      opt.type === 'pie',
    //      );

    //      //color palet
    //     option['color'] = FeatureSection.selectedColorPallet;
    //     //title Section
    //     // option['title'].text = FeatureSection.titleSection.titleName;
    //     // option['title'].left = FeatureSection.titleSection.alignment;
    //     // option['title']['textStyle'].fontSize = FeatureSection.titleSection.titleSize;
    //     // option['title']['textStyle'].color = FeatureSection.titleSection.titleColor;
    //     // option['title']['textStyle'].fontWeight = FeatureSection.titleSection.titleFontWeight;
    //     // option['title']['textStyle'].fontFamily = FeatureSection.titleSection.titleFontFamily;
    //     //custom Label
    //     option['series'][pieindex]['label'].show = true;
    //     option['series'][pieindex]['label'].color = '#000000';
    //     // option['series'][pieindex]['label'].position = FeatureSection.labelSection.labelPostion;
    //     // option['series'][pieindex]['label'].fontSize = FeatureSection.labelSection.labelSize;
    //     // option['series'][pieindex]['labelLine'].length = FeatureSection.labelSection.labelLineLength;
    //     //Legend Section
    //     option['legend'].show = true;
    //     option['legend'].orient = FeatureSection.legendSection.legendOrientation;
    //     option['legend'].left = FeatureSection.legendSection.legendHorizontal;
    //     option['legend'].top = FeatureSection.legendSection.legendVertical;
    //     option['legend']['textStyle'].fontSize = FeatureSection.legendSection.legendFontSize;
    //     option['legend']['textStyle'].color = FeatureSection.legendSection.legendFontColor;
    //     option['legend']['textStyle'].backgroundColor = FeatureSection.legendSection.legendBackgroundColor;
    //     if(FeatureSection.donutToggleFlag ){
    //         option['series'][pieindex].radius = ['30%','80%']
    //     }
    //     else
    //     {
    //         option['series'][pieindex].radius = '80%'
    //     }
    //     if(FeatureSection.tooltipToggleFlag){
    //         option['tooltip'].show = false;
    //     }
    //     else{
    //         option['tooltip'].show = true;
    //     }
    //     if(FeatureSection.valueLabelFlag){
    //         option['series'][pieindex]['label'].show = true;
    //     }
    //     else{
    //         option['series'][pieindex]['label'].show = false;
    //     }
    //     setData('option', option as PathValue<any, any>);
    // },[FeatureSection]);

    const chartTitle = (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxWidth: '200px',
            }}
        >
            <label htmlFor="Dummy-input">Chart Title</label>
            <TextField
                onChange={handleTitleNameChange}
                id="Dummy-input"
            ></TextField>
            <label htmlFor="Dummy-input">Select Alignment</label>
            <Select
                placeholder="Select Alignment"
                onChange={handleTitleAlingmentChange}
            >
                <Select.Item value={'left'}>Left</Select.Item>
                <Select.Item value={'right'}>Right</Select.Item>
                <Select.Item value={'center'}>Center</Select.Item>
            </Select>
            <label htmlFor="Dummy-input">Font Size</label>
            <TextField
                onChange={handleTitleSizeChange}
                id="Dummy-input"
            ></TextField>
            <label htmlFor="Dummy-input">Font Color</label>
            <input
                type="color"
                onChange={handleTitleColorChange}
                style={{
                    width: '40px',
                    height: '30px',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                }}
            ></input>
            <label htmlFor="Dummy-input">Font Weight</label>
            <Select onChange={handleTitleWeightChange}>
                {fontWeights.map((fontWeight) => (
                    <Select.Item value={fontWeight}>{fontWeight}</Select.Item>
                ))}
            </Select>
            <label htmlFor="Dummy-input">Font Family</label>
            <Select
                disabled={custonFontFlag}
                onChange={handleTitleFontFamilyChange}
            >
                {fontFamilys.map((fontFamily) => (
                    <Select.Item value={fontFamily}>{fontFamily}</Select.Item>
                ))}
            </Select>
            <label htmlFor="Dummy-input">
                <input
                    checked={custonFontFlag}
                    type="checkbox"
                    onClick={handleCustomFont}
                />
                Enter Custon Font
            </label>
            {custonFontFlag && (
                <label htmlFor="Dummy-input">
                    Enter Font Family Name
                    <TextField
                        onChange={handleTitleFontFamilyChange}
                    ></TextField>
                </label>
            )}
            <button onClick={applyTitleChanges}>Execute</button>
        </div>
    );

    const customValueLabels = (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxWidth: '200px',
            }}
        >
            <label htmlFor="Dummy-input">Choose a position for the Label</label>
            <Select
                placeholder="Select Alignment"
                onChange={handleLabelPosition}
            >
                <Select.Item value={'outside'}>Outside</Select.Item>
                <Select.Item value={'inside'}>Inside</Select.Item>
            </Select>
            <label htmlFor="Dummy-input">Select Font size of labels</label>
            <TextField onChange={handleLabelSize} id="Dummy-input"></TextField>
            <label htmlFor="Dummy-input">Set label line length</label>
            <TextField
                onChange={handleLabelLineLength}
                id="Dummy-input"
            ></TextField>
            <Button onClick={applyLabelChanges}>Execute</Button>
        </div>
    );
    const Legend = (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxWidth: '200px',
            }}
        >
            <label htmlFor="Dummy-input">Vertical Align:</label>
            <Select
                placeholder="Select Alignment"
                onChange={handleLegendVerticalChange}
            >
                <Select.Item value={'top'}>Top</Select.Item>
                <Select.Item value={'bottom'}>Bottom</Select.Item>
            </Select>
            <label htmlFor="Dummy-input">Horizontal Align:</label>
            <Select
                placeholder="Select Alignment"
                onChange={handleTitleHorizontalChange}
            >
                <Select.Item value={'left'}>Left</Select.Item>
                <Select.Item value={'right'}>Right</Select.Item>
                <Select.Item value={'center'}>Center</Select.Item>
            </Select>
            <label htmlFor="Dummy-input">Legend Orientation:</label>
            <Select
                placeholder="Select Alignment"
                onChange={handleTitleOrientationChange}
            >
                <Select.Item value={'horizontal'}>Horizontal</Select.Item>
                <Select.Item value={'vertical'}>Vertical</Select.Item>
            </Select>
            <label htmlFor="Dummy-input">Font Size</label>
            <TextField
                onChange={handleLegendSizeChange}
                id="Dummy-input"
            ></TextField>
            <label htmlFor="Dummy-input">Font Family</label>
            <Select onChange={handleLegendFontFamilyChange}>
                {fontFamilys.map((fontFamily) => (
                    <Select.Item value={fontFamily}>{fontFamily}</Select.Item>
                ))}
            </Select>
            <label htmlFor="Dummy-input">Font Color</label>
            <TextField
                type="color"
                onChange={handleLegendFontColor}
                style={{
                    width: '40px',
                    height: '30px',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                }}
            ></TextField>
            <label htmlFor="Dummy-input">Background Color</label>
            <TextField
                type="color"
                onChange={handleLegendBackgroundColor}
                style={{
                    width: '40px',
                    height: '30px',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                }}
            ></TextField>
            <Button onClick={applyLegendChanges}>Execute</Button>
        </div>
    );
    function handleLegendVerticalChange(e) {
        setlegendSection((prev) => {
            return {
                ...prev,
                legendVertical: e.target.value,
            };
        });
    }
    function handleTitleHorizontalChange(e) {
        setlegendSection((prev) => {
            return {
                ...prev,
                legendHorizontal: e.target.value,
            };
        });
    }
    function handleTitleOrientationChange(e) {
        setlegendSection((prev) => {
            return {
                ...prev,
                legendOrientation: e.target.value,
            };
        });
    }
    function handleLegendSizeChange(e) {
        setlegendSection((prev) => {
            return {
                ...prev,
                legendFontSize: e.target.value,
            };
        });
    }
    function handleLegendFontFamilyChange(e) {
        setlegendSection((prev) => {
            return {
                ...prev,
                legendFontFamily: e.target.value,
            };
        });
    }
    function handleLegendFontColor(e) {
        setlegendSection((prev) => {
            return {
                ...prev,
                legendFontColor: e.target.value,
            };
        });
    }
    function handleLegendBackgroundColor(e) {
        setlegendSection((prev) => {
            return {
                ...prev,
                legendBackgroundColor: e.target.value,
            };
        });
    }
    function applyLegendChanges() {
        setFeatureSection((prev) => ({
            ...prev,
            legendSection: {
                legendVertical: LegendSection.legendVertical,
                legendHorizontal: LegendSection.legendHorizontal,
                legendOrientation: LegendSection.legendOrientation,
                legendFontSize: LegendSection.legendFontSize,
                legendFontFamily: LegendSection.legendFontFamily,
                legendFontColor: LegendSection.legendFontColor,
                legendBackgroundColor: LegendSection.legendBackgroundColor,
            },
        }));
    }
    function applyLabelChanges() {
        setFeatureSection((prev) => ({
            ...prev,
            labelSection: {
                labelPostion: LabelSection.labelPostion,
                labelSize: LabelSection.labelSize,
                labelLineLength: LabelSection.labelLineLength,
            },
        }));
    }
    function handleLabelPosition(e) {
        setLabelSection((prev) => {
            return {
                ...prev,
                labelPostion: e.target.value,
            };
        });
    }
    function handleLabelSize(e) {
        setLabelSection((prev) => {
            return {
                ...prev,
                labelSize: e.target.value,
            };
        });
    }
    function handleLabelLineLength(e) {
        setLabelSection((prev) => {
            return {
                ...prev,
                labelLineLength: e.target.value,
            };
        });
    }
    function applyTitleChanges() {
        // data.option['title'].text =TitleSection.titleName;
        // setData('option', data.option as PathValue<any, any>);
        setFeatureSection((prev) => ({
            ...prev,
            titleSection: {
                titleName: TitleSection.titleName,
                alignment: TitleSection.alignment,
                titleSize: TitleSection.titleSize,
                titleColor: TitleSection.titleColor,
                titleFontWeight: TitleSection.titleFontWeight,
                titleFontFamily: TitleSection.titleFontFamily,
            },
        }));
    }
    function handleCustomFont(e) {
        setcustonFontFlag(e.target.checked);
    }
    function handleTitleWeightChange(e) {
        setTitleSection((prev) => {
            return {
                ...prev,
                titleFontWeight: e.target.value,
            };
        });
    }
    function handleTitleFontFamilyChange(e) {
        setTitleSection((prev) => {
            return {
                ...prev,
                titleFontFamily: e.target.value,
            };
        });
    }
    function handleTitleColorChange(e) {
        setTitleSection((prev) => {
            return {
                ...prev,
                titleColor: e.target.value,
            };
        });
    }
    function handleTitleNameChange(e) {
        // setChartValues((prev)=>{
        //     return {
        //         ...prev,
        //         chartTitle : e.target.value
        //     }
        // })
        setTitleSection((prev) => {
            return {
                ...prev,
                titleName: e.target.value,
            };
        });
    }
    function handleTitleSizeChange(e) {
        setTitleSection((prev) => {
            return {
                ...prev,
                titleSize: e.target.value,
            };
        });
    }
    function handleTitleAlingmentChange(e) {
        setTitleSection((prev) => {
            return {
                ...prev,
                alignment: e.target.value,
            };
        });
    }
    function donutToggle() {
        setFeatureSection((prev) => {
            return { ...prev, donutToggleFlag: !prev.donutToggleFlag };
        });
    }
    function handlePaletteClick(colors) {
        setFeatureSection((prev) => {
            return { ...prev, selectedColorPallet: colors };
        });
    }
    function tooltipToogle() {
        setFeatureSection((prev) => {
            return {
                ...prev,
                tooltipToggleFlag: !prev.tooltipToggleFlag,
            };
        });
    }
    function handleValueLabels() {
        setFeatureSection((prev) => {
            return {
                ...prev,
                valueLabelFlag: !prev.valueLabelFlag,
            };
        });
    }
    function updateCustonValueLabels(values: any) {
        let options = data.option;
        let pieindex = options['series']?.findIndex(
            (opt) => opt.type === 'pie',
        );
        options['series'][pieindex]['label'].position = values.labelPosition;
        options['series'][pieindex]['label'].fontSize = values.labelSize;
        options['series'][pieindex]['labelLine'].length =
            values.labelLineLength;
        setData('option', options as PathValue<any, any>);
    }
    function updateCustonTitle(values: any) {
        let option = data.option;
        option['title'].text = values.titleName;
        option['title'].left = values.alignment;
        option['title']['textStyle'].fontSize = values.titleSize;
        option['title']['textStyle'].color = values.titleColor;
        option['title']['textStyle'].fontWeight = values.titleFontWeight;
        option['title']['textStyle'].fontFamily = values.titleFontFamily;
        setData('option', option as PathValue<any, any>);
    }
    return (
        <Stack height={'100%'}>
            <StyledChartContainer>
                <Button onClick={donutToggle}>Donut toggle</Button>
                <div>
                    <CustomizeValueLabels
                        updateChart={updateCustonValueLabels}
                        option={data.option}
                        chartType={data.variation}
                    ></CustomizeValueLabels>
                    <CustomizeTitle
                        updateChart={updateCustonTitle}
                        data={data}
                        chartType={chartType}
                    ></CustomizeTitle>
                    <h2>Select a Color Palette</h2>
                    <ColorPalettes
                        palettes={colorPalettes}
                        onPaletteClick={handlePaletteClick}
                    />
                    <CustomAccordianBlock
                        accordianExpanded={false}
                        accordianSummaryProps={<ExpandMoreIcon />}
                        accordianSummary={'Chart Title'}
                        accordianDetails={chartTitle}
                    ></CustomAccordianBlock>
                    <Button color="success" onClick={tooltipToogle}>
                        Tooltip Toggle
                    </Button>
                    <ToolTips id={id} path={data} />
                    <Button onClick={handleValueLabels}>
                        Display Value Labels
                    </Button>
                    <CustomAccordianBlock
                        accordianExpanded={false}
                        accordianSummaryProps={<ExpandMoreIcon />}
                        accordianSummary={'Customize Value Labels'}
                        accordianDetails={customValueLabels}
                    ></CustomAccordianBlock>
                    <CustomAccordianBlock
                        accordianExpanded={false}
                        accordianSummaryProps={<ExpandMoreIcon />}
                        accordianSummary={'Legend'}
                        accordianDetails={Legend}
                    ></CustomAccordianBlock>
                </div>
            </StyledChartContainer>
        </Stack>
    );
});

export default E_PieChart;
