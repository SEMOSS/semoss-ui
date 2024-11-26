import {
    useBlock,
    useBlocks,
    useBlockSettings,
    useBlocksPixel,
    useFrameHeaders,
} from '@/hooks';
import { Button, Select, Stack, styled, TextField } from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { Paths, PathValue } from '@/types';
import { CustomizeValueLabels } from './CustomizeValueLabels';
import { CustomizeTitle } from './CustomTitle';
import { EchartVisualizationBlockDef } from './echartblocks';
import { CustomBlockColumnSettings } from './CustomBlockColumnSettings';

const StyledChartContainer = styled('div')(() => ({
    width: 'fit-content',
    minWidth: '50px',
    minHeight: '50px',
}));
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

export interface E_PieChartDef {
    showTool: boolean;
    id: any;
}
const E_PieChart = observer<any>(({ showTool, id }) => {
    const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
    setData('frame.name', '');
    setData('columns', []);
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
        isCustomColorEditing: false,
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

    useEffect(() => {
        let option = data.option;
        let pieindex = option['series'].findIndex((opt) => opt.type === 'pie');
        if (Array.isArray(option['series'][pieindex].radius)) {
            FeatureSection.donutToggleFlag = true;
        } else {
            FeatureSection.donutToggleFlag = false;
        }
        if (option['tooltip'].show) {
            FeatureSection.tooltipToggleFlag = false;
        } else {
            FeatureSection.tooltipToggleFlag = true;
        }
        if (option['series'][pieindex]['label'].show) {
            FeatureSection.valueLabelFlag = true;
        } else {
            FeatureSection.valueLabelFlag = false;
        }
        if (option['color'].length > 0) {
            FeatureSection.selectedColorPallet = option['color'];
        }
    }, []);
    useEffect(() => {
        let option = data.option;
        let pieindex = option['series'].findIndex((opt) => opt.type === 'pie');
        option['color'] = FeatureSection.selectedColorPallet;
        option['series'][pieindex]['label'].show = true;
        option['series'][pieindex]['label'].color = '#000000';
        option['legend'].show = true;
        option['legend'].orient =
            FeatureSection.legendSection.legendOrientation;
        option['legend'].left = FeatureSection.legendSection.legendHorizontal;
        option['legend'].top = FeatureSection.legendSection.legendVertical;
        option['legend']['textStyle'].fontSize =
            FeatureSection.legendSection.legendFontSize;
        option['legend']['textStyle'].color =
            FeatureSection.legendSection.legendFontColor;
        option['legend']['textStyle'].backgroundColor =
            FeatureSection.legendSection.legendBackgroundColor;
        if (FeatureSection.donutToggleFlag) {
            option['series'][pieindex].radius = ['30%', '80%'];
        } else {
            option['series'][pieindex].radius = '80%';
        }
        if (FeatureSection.tooltipToggleFlag) {
            option['tooltip'].show = false;
        } else {
            option['tooltip'].show = true;
        }
        if (FeatureSection.valueLabelFlag) {
            option['series'][pieindex]['label'].show = true;
        } else {
            option['series'][pieindex]['label'].show = false;
        }
        setData('option', option as PathValue<any, any>);
    }, [FeatureSection]);

    const ColorPalettes = ({ palettes, onPaletteClick }) => {
        return (
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {palettes.map((palette, index) => (
                    <div>
                        <div>{palette.name}</div>
                        <div
                            key={index}
                            onClick={() => onPaletteClick(palette.colors)}
                            style={{
                                display: 'flex',
                                padding: '10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                border: '1px solid #ccc',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                            }}
                        >
                            {palette.colors.map((color, colorIndex) => (
                                <div
                                    key={colorIndex}
                                    style={{
                                        backgroundColor: color,
                                        width: '15px',
                                        height: '20px',
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                {/* <Button onClick={customColorToggle} style={{ marginBottom: "10px" }}>Custom Color</Button>
                {FeatureSection.isCustomColorEditing && (
                    <div>
                        <div style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
                        <label htmlFor="colorPicker" style={{ display: "block", marginBottom: "5px" }}>
                                Palette Name
                            </label>
                            <input
                                type="color"
                                id="colorPicker"
                                onChange={handleColorClick}
                                style={{ marginBottom: "10px" }}
                            />
                            <label htmlFor="colorPicker" style={{ display: "block", marginBottom: "5px" }}>
                                Pick a Color:
                            </label>
                            <input
                                type="color"
                                id="colorPicker"
                                value={currentColor}
                                onChange={handleColorClick}
                                style={{ marginBottom: "10px" }}
                            />
                            <br />
                            <label htmlFor="colorCode" style={{ display: "block", marginBottom: "5px" }}>
                                Selected Colors (Hex Codes):
                            </label>
                            <input
                                type="text"
                                id="colorCode"
                                value={selectedColors.join(", ")}
                                onChange={handleColorTextChange}
                                style={{
                                    width: "100%",
                                    padding: "5px",
                                    border: "1px solid #ccc",
                                    borderRadius: "3px",
                                }}
                            />
                            <Button>Execute</Button>
                        </div>
                    </div>
                )

                } */}
            </div>
        );
    };
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
                <Button color="success" onClick={tooltipToogle}>
                    Tooltip Toggle
                </Button>
                <Button onClick={handleValueLabels}>
                    Display Value Labels
                </Button>
                <div>
                    <CustomizeValueLabels
                        updateChart={updateCustonValueLabels}
                        option={data.option}
                    ></CustomizeValueLabels>
                    <CustomizeTitle
                        updateChart={updateCustonTitle}
                        data={data}
                    ></CustomizeTitle>
                    {/* <CustomizeColorPalette
                        updateChart={updateCustonTitle}
                        option={data}
                    ></CustomizeColorPalette> */}
                    <h2>Select a Color Palette</h2>
                    <ColorPalettes
                        palettes={colorPalettes}
                        onPaletteClick={handlePaletteClick}
                    />
                    <CustomBlockColumnSettings
                        id={id}
                    ></CustomBlockColumnSettings>
                </div>
            </StyledChartContainer>
        </Stack>
    );
});

export default E_PieChart;
