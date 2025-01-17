import { useEffect, useMemo, useRef, useState, Suspense, lazy } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Paths, PathValue } from '@/types';
import { useBlock, useBlockSettings, useBlocks } from '@/hooks';
import { Block, BlockDef, QueryState } from '@/stores';
import { getValueByPath } from '@/utility';
import {
    Stack,
    TextField,
    Typography,
    Checkbox,
    Slider,
    Select,
    MenuItem,
    Button,
    Accordion,
    styled,
} from '@semoss/ui';
import { ScatterPlotResize } from './ScatterPlotResize';
const StyledChartContainer = styled('div')(() => ({}));

// Reduce Initial Bundle

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    path: Paths<Block<D>['data'], 4>;
}

export const ChartFeatures = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [showXaxis, setShowXaxis] = useState(false);
        const [showYaxis, setShowYaxis] = useState(false);
        const [showXaxisTick, setShowXaxisTick] = useState(false);
        const [showYaxisTick, setShowYaxisTick] = useState(false);
        const [value, setChartFeaturesValue] = useState('');
        const [rotateXaxis, setRotateXaxis] = useState(0);
        const [rotateYaxis, setRotateYaxis] = useState(0);
        const [fontSizeYAxis, setFontSizeYAxis] = useState(12);
        const [fontSizeXAxis, setFontSizeXAxis] = useState(12);
        const [showXaxisTitle, setShowXaxisTitle] = useState(true);
        const [showYaxisTitle, setShowYaxisTitle] = useState(true);
        const [xaxisTitle, setXaxisTitle] = useState('');
        const [yaxisTitle, setYaxisTitle] = useState('');
        const [chartTitle, setChartTitle] = useState('');
        const [symbolShape, setSymbolShape] = useState('circle');
        const [labelPosition, setLabelPosition] = useState('top');
        const [symbolSize, setSymbolSize] = useState();
        const [labelRotation, setLabelRotation] = useState();
        const [labelFont, setLabelFont] = useState('sans-serif');
        const [labelFontSize, setLabelFontSize] = useState();
        const [labelColor, setLabelColor] = useState();
        const [showLabel, setShowLabel] = useState(true);
        const [showTooltips, setShowTooltip] = useState(true);
        const [selectedColor, setSelectedColor] = useState();
        const [fontSizeYAxisLabel, setFontSizeYAxisLabel] = useState();
        const [fontSizeXAxisLabel, setFontSizeXAxisLabel] = useState();
        const [selectedColorXAxisLabel, setSelectedColorXAxisLabel] =
            useState();
        const [selectedColorYAxisLabel, setSelectedColorYAxisLabel] =
            useState();
        const [axisExpand, setAxisExpand] = useState(true);
        const [featuresExpand, setFeatureExpand] = useState(false);
        const [stylingExpand, setStylingExpand] = useState(false);

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
            console.log(typeof data, data, 'testing');
            setChartFeaturesValue(computedValue);
        }, [computedValue, data]);
        useEffect(() => {
            if (data.hasOwnProperty('option')) {
                retainXAxisTitle(data.option);
            }
        }, [data.option['xAxis']['name']]);
        useEffect(() => {
            if (data.hasOwnProperty('option')) {
                retainYAxisTitle(data.option);
            }
        }, [data.option['yAxis']['name']]);
        const retainXAxisTitle = (options) => {
            if (options.hasOwnProperty('xAxis')) {
                if (options.xAxis && options.xAxis.hasOwnProperty('name')) {
                    setXaxisTitle(data.option['xAxis']['name']);
                }
                if (options.xAxis && options.xAxis.hasOwnProperty('name')) {
                    setShowXaxisTitle(
                        options['xAxis']['name'] == '' ? false : true,
                    );
                }
            }
        };
        const retainYAxisTitle = (options) => {
            if (options.hasOwnProperty('yAxis')) {
                if (options.yAxis && options.yAxis.hasOwnProperty('name')) {
                    setYaxisTitle(data.option['yAxis']['name']);
                }
                if (options.yAxis && options.yAxis.hasOwnProperty('name')) {
                    setShowYaxisTitle(
                        options['yAxis']['name'] == '' ? false : true,
                    );
                }
            }
        };
        useEffect(() => {
            if (data.hasOwnProperty('option')) {
                reinitializeFeatures(data.option);
            }
        }, [id]);

        const reinitializeFeatures = (options) => {
            if (options.hasOwnProperty('xAxis')) {
                if (options.xAxis && options.xAxis.hasOwnProperty('show')) {
                    setShowXaxis(options['xAxis']['show']);
                }
                if (
                    options.xAxis &&
                    options.xAxis.axisTick &&
                    options.xAxis.axisTick.hasOwnProperty('show')
                ) {
                    setShowXaxisTick(options['xAxis']['axisTick']['show']);
                }
                if (options.xAxis && options.xAxis.axisLabel) {
                    setRotateXaxis(options['xAxis']['axisLabel']['rotate']);
                    setFontSizeXAxisLabel(
                        options['xAxis']['axisLabel']['fontSize'],
                    );
                    setSelectedColorXAxisLabel(
                        options['xAxis']['axisLabel']['color'],
                    );
                }
                if (
                    options.xAxis &&
                    options.xAxis.nameTextStyle &&
                    options.xAxis.nameTextStyle.hasOwnProperty('fontSize')
                ) {
                    setFontSizeXAxis(
                        options['xAxis']['nameTextStyle']['fontSize'],
                    );
                }
            }
            if (options.hasOwnProperty('yAxis')) {
                if (options.yAxis && options.yAxis.hasOwnProperty('show')) {
                    setShowYaxis(options['yAxis']['show']);
                }
                if (
                    options.yAxis &&
                    options.yAxis.axisTick &&
                    options.yAxis.axisTick.hasOwnProperty('show')
                ) {
                    setShowYaxisTick(options['yAxis']['axisTick']['show']);
                }
                if (options.yAxis && options.yAxis.axisLabel) {
                    setRotateYaxis(options['yAxis']['axisLabel']['rotate']);
                    setFontSizeYAxisLabel(
                        options['yAxis']['axisLabel']['fontSize'],
                    );
                    setSelectedColorYAxisLabel(
                        options['yAxis']['axisLabel']['color'],
                    );
                }
                if (
                    options.yAxis &&
                    options.yAxis.nameTextStyle &&
                    options.xAxis.nameTextStyle.hasOwnProperty('fontSize')
                ) {
                    setFontSizeYAxis(
                        options['yAxis']['nameTextStyle']['fontSize'],
                    );
                }
            }
            if (options.hasOwnProperty('title')) {
                if (options.title.hasOwnProperty('text')) {
                    setChartTitle(options['title']['text']);
                }
            }
            if (options.hasOwnProperty('series')) {
                if (options.series[0].hasOwnProperty('symbol')) {
                    setSymbolShape(options['series'][0]['symbol']);
                }
            }
            if (options.hasOwnProperty('series')) {
                if (options.series[0].hasOwnProperty('symbolSize')) {
                    setSymbolSize(options['series'][0]['symbolSize']);
                }
            }
            if (options.hasOwnProperty('series')) {
                if (options.series[0].hasOwnProperty('label')) {
                    setLabelPosition(options['series'][0]['label']['position']);
                    setLabelRotation(options['series'][0]['label']['rotate']);
                    setLabelFont(options['series'][0]['label']['fontFamily']);
                    setLabelFontSize(options['series'][0]['label']['fontSize']);
                    setLabelColor(options['series'][0]['label']['color']);
                    setShowLabel(options['series'][0]['label']['show']);
                }
            }
            if (options.hasOwnProperty('tooltip')) {
                setShowTooltip(options['tooltip']['show']);
            }
            if (options.hasOwnProperty('series')) {
                if (options.series[0].hasOwnProperty('itemStyle')) {
                    setSelectedColor(
                        options['series'][0]['itemStyle']['color'],
                    );
                }
            }
        };
        console.log('value ', data, value);

        const showXAxis = (e) => {
            let option = JSON.parse(value);
            setShowXaxis(!showXaxis);
            option['xAxis']['show'] = e.target.checked;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const showValueLabel = (e) => {
            let option = JSON.parse(value);
            setShowLabel(!showLabel);
            option['series'][0]['label']['show'] = e.target.checked;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const showTooltip = (e) => {
            let option = JSON.parse(value);
            setShowTooltip(!showTooltips);
            option['tooltip']['show'] = e.target.checked;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const showYAxis = (e) => {
            let option = JSON.parse(value);
            setShowYaxis(!showYaxis);
            option['yAxis']['show'] = e.target.checked;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const showXAxisTick = (e) => {
            let option = JSON.parse(value);
            setShowXaxisTick(!showXaxisTick);
            option['xAxis']['axisTick']['show'] = e.target.checked;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const showYAxisTick = (e) => {
            let option = JSON.parse(value);
            setShowYaxisTick(!showYaxisTick);
            option['yAxis']['axisTick']['show'] = e.target.checked;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const rotateXAxis = (e) => {
            let option = JSON.parse(value);
            setRotateXaxis(e.target.value);
            option['xAxis']['axisLabel']['rotate'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };

        const rotateYAxis = (e) => {
            let option = JSON.parse(value);
            setRotateYaxis(e.target.value);
            option['yAxis']['axisLabel']['rotate'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };

        const handleChangeYAxisFontSize = (e) => {
            let option = JSON.parse(value);
            setFontSizeYAxis(e.target.value);
            option['yAxis']['nameTextStyle']['fontSize'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };

        const handleChangeXAxisFontSize = (e) => {
            let option = JSON.parse(value);
            setFontSizeXAxis(e.target.value);
            option['xAxis']['nameTextStyle']['fontSize'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const showXAxisTitle = (e) => {
            let option = JSON.parse(value);
            setShowXaxisTitle(!showXaxisTitle);
            option['xAxis']['name'] =
                option['xAxis']['name'] == ''
                    ? option['xAxis']['pixelName']
                    : '';
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const showYAxisTitle = (e) => {
            let option = JSON.parse(value);
            setShowYaxisTitle(!showYaxisTitle);
            option['yAxis']['name'] =
                option['yAxis']['name'] == ''
                    ? option['yAxis']['pixelName']
                    : '';
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const handleXaxisTitleChange = (e) => {
            setXaxisTitle(e.target.value);
            let option = JSON.parse(value);
            option['xAxis']['name'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const handleYaxisTitleChange = (e) => {
            setYaxisTitle(e.target.value);
            let option = JSON.parse(value);
            option['yAxis']['name'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const handleChartTitle = () => {
            let option = JSON.parse(value);
            option['title']['text'] = chartTitle;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const handleSymbolShape = (e) => {
            setSymbolShape(e.target.value);
            let option = JSON.parse(value);
            option['series'][0]['symbol'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const handleChangeSymbolSize = (e) => {
            let option = JSON.parse(value);
            setSymbolSize(e.target.value);
            option['series'][0]['symbolSize'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const handleValuePosition = (e) => {
            setLabelPosition(e.target.value);
            let option = JSON.parse(value);
            option['series'][0]['label']['position'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const handleChangelabelRotation = (e) => {
            let option = JSON.parse(value);
            setLabelRotation(e.target.value);
            option['series'][0]['label']['rotate'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const handlelabelFont = (e) => {
            setLabelFont(e.target.value);
            let option = JSON.parse(value);
            option['series'][0]['label']['fontFamily'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const handleLabelSize = (e) => {
            let option = JSON.parse(value);
            setLabelFontSize(e.target.value);
            option['series'][0]['label']['fontSize'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const handleLabelColor = (e) => {
            let option = JSON.parse(value);
            setLabelColor(e.target.value);
            option['series'][0]['label']['color'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const handleColorChange = (e) => {
            let option = JSON.parse(value);
            setSelectedColor(e.target.value);
            option['series'][0]['itemStyle']['color'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const handleChangeYAxisLabelFontSize = (e) => {
            let option = JSON.parse(value);
            setFontSizeYAxisLabel(e.target.value);
            option['yAxis']['axisLabel']['fontSize'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const handleChangeXAxisLabelFontSize = (e) => {
            let option = JSON.parse(value);
            setFontSizeXAxisLabel(e.target.value);
            option['xAxis']['axisLabel']['fontSize'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const handleColorChangeForXAxisLabel = (e) => {
            let option = JSON.parse(value);
            setSelectedColorXAxisLabel(e.target.value);
            option['xAxis']['axisLabel']['color'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const handleColorChangeForYAXisLabel = (e) => {
            let option = JSON.parse(value);
            setSelectedColorYAxisLabel(e.target.value);
            option['yAxis']['axisLabel']['color'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };

        return (
            <Stack>
                <Accordion
                    expanded={axisExpand}
                    onChange={() => setAxisExpand(!axisExpand)}
                >
                    <Accordion.Trigger>Axis Features</Accordion.Trigger>
                    <Accordion.Content>
                        <Stack>
                            <Checkbox
                                checked={showXaxis}
                                label={'Show/Hide X-Axis'}
                                onChange={(e) => {
                                    showXAxis(e);
                                }}
                            />
                            <Checkbox
                                checked={showYaxis}
                                label={'Show/Hide Y-Axis'}
                                onChange={(e) => {
                                    showYAxis(e);
                                }}
                            />
                            <Checkbox
                                checked={showXaxisTick}
                                label={'Show/Hide X-Axis Tick'}
                                onChange={(e) => {
                                    showXAxisTick(e);
                                }}
                            />
                            <Checkbox
                                checked={showYaxisTick}
                                label={'Show/Hide Y-Axis Tick'}
                                onChange={(e) => {
                                    showYAxisTick(e);
                                }}
                            />
                            <Checkbox
                                checked={showXaxisTitle}
                                label={'Show X-Axis Title'}
                                onChange={(e) => {
                                    showXAxisTitle(e);
                                }}
                            />
                            <Checkbox
                                checked={showYaxisTitle}
                                label={'Show Y-Axis Title'}
                                onChange={(e) => {
                                    showYAxisTitle(e);
                                }}
                            />
                            <Typography variant="h6">
                                Rotate X-Axis Values
                            </Typography>
                            <Slider
                                onChange={(e) => {
                                    rotateXAxis(e);
                                }}
                                value={rotateXaxis}
                                min={0}
                                max={360}
                                valueLabelDisplay="auto"
                            />
                            <Typography variant="h6">
                                Rotate Y-Axis Values
                            </Typography>
                            <Slider
                                onChange={(e) => {
                                    rotateYAxis(e);
                                }}
                                value={rotateYaxis}
                                min={0}
                                max={360}
                                valueLabelDisplay="auto"
                            />
                            <Typography variant="h6">
                                Font Size X-Axis:
                                <TextField
                                    focused={false}
                                    type="number"
                                    name="fontSize"
                                    value={fontSizeXAxis}
                                    onChange={handleChangeXAxisFontSize}
                                />
                            </Typography>
                            <Typography variant="h6">
                                Font Size Y-Axis:
                                <TextField
                                    focused={false}
                                    type="number"
                                    name="fontSize"
                                    value={fontSizeYAxis}
                                    onChange={handleChangeYAxisFontSize}
                                />
                            </Typography>
                            <Typography variant="h6" align="center">
                                X-Axis Title change:
                            </Typography>
                            <TextField
                                focused={false}
                                type="text"
                                name="text"
                                value={xaxisTitle}
                                onChange={(e) => {
                                    handleXaxisTitleChange(e);
                                }}
                            />
                            <Typography variant="h6" align="center">
                                Y-Axis Title change:
                            </Typography>
                            <TextField
                                focused={false}
                                type="text"
                                name="text"
                                value={yaxisTitle}
                                onChange={(e) => {
                                    handleYaxisTitleChange(e);
                                }}
                            />
                        </Stack>
                    </Accordion.Content>
                </Accordion>
                <Accordion
                    expanded={stylingExpand}
                    onChange={() => setStylingExpand(!stylingExpand)}
                >
                    <Accordion.Trigger>Styling</Accordion.Trigger>
                    <Accordion.Content>
                        <Stack>
                            <Typography variant="h6" align="center">
                                Chart Title:
                            </Typography>
                            <TextField
                                focused={false}
                                type="text"
                                name="text"
                                value={chartTitle}
                                onChange={(e) => {
                                    setChartTitle(e.target.value);
                                }}
                            />
                            <Button onClick={() => handleChartTitle()}>
                                Execute
                            </Button>
                            <Typography variant="h6" align="center">
                                SymbolShape
                            </Typography>
                            <Select
                                name="Choose a position for the Label"
                                value={symbolShape}
                                onChange={handleSymbolShape}
                            >
                                <MenuItem value="circle">Circle</MenuItem>
                                <MenuItem value="rect">Rectangle</MenuItem>
                                <MenuItem value="roundRect">
                                    RoundRectangle
                                </MenuItem>
                                <MenuItem value="triangle">Traingle</MenuItem>
                                <MenuItem value="arrow">Arrow</MenuItem>
                                <MenuItem value="pin">Pin</MenuItem>
                                <MenuItem value="diamond">Diamond</MenuItem>
                            </Select>
                            <Typography variant="h6">
                                SymbolSize:
                                <TextField
                                    focused={false}
                                    type="number"
                                    name="symbolsize"
                                    value={symbolSize}
                                    onChange={handleChangeSymbolSize}
                                />
                            </Typography>
                            <Typography variant="h6" align="center">
                                Choose a position for the Label:
                            </Typography>
                            <Select
                                name="Choose a position for the Label"
                                value={labelPosition}
                                onChange={handleValuePosition}
                            >
                                <MenuItem value="top">Top</MenuItem>
                                <MenuItem value="left">Left</MenuItem>
                                <MenuItem value="right">Right</MenuItem>
                                <MenuItem value="bottom">Bottom</MenuItem>
                                <MenuItem value="inside">Inside</MenuItem>
                                <MenuItem value="insideLeft">
                                    Inside Left
                                </MenuItem>
                                <MenuItem value="insideRight">
                                    Inside Right
                                </MenuItem>
                                <MenuItem value="insideBottom">
                                    Inside Bottom
                                </MenuItem>
                                <MenuItem value="insideTop">
                                    Inside Top
                                </MenuItem>
                            </Select>
                            <StyledChartContainer>
                                <Typography variant="h6">
                                    Select a Color
                                </Typography>
                                {/* Color Picker */}
                                <TextField
                                    fullWidth
                                    type="color"
                                    value={selectedColor}
                                    onChange={handleColorChange}
                                    size="small"
                                    variant="outlined"
                                    autoComplete="off"
                                />
                                {/* Text Box to Show Selected Color */}
                                <TextField type="text" value={selectedColor} />
                            </StyledChartContainer>
                            <Typography variant="h6">
                                Font Size Y-Axis Label:
                                <TextField
                                    focused={false}
                                    type="number"
                                    name="fontSize"
                                    value={fontSizeYAxisLabel}
                                    onChange={handleChangeYAxisLabelFontSize}
                                />
                            </Typography>
                            <Typography variant="h6">
                                Font Size X-Axis Label:
                                <TextField
                                    focused={false}
                                    type="number"
                                    name="fontSize"
                                    value={fontSizeXAxisLabel}
                                    onChange={handleChangeXAxisLabelFontSize}
                                />
                            </Typography>
                            <StyledChartContainer>
                                <Typography variant="h6">
                                    Select a Color for xAxisLabel
                                </Typography>
                                {/* Color Picker */}
                                <TextField
                                    fullWidth
                                    type="color"
                                    value={selectedColorXAxisLabel}
                                    onChange={handleColorChangeForXAxisLabel}
                                    size="small"
                                    variant="outlined"
                                    autoComplete="off"
                                />
                                {/* Text Box to Show Selected Color */}
                                <TextField
                                    type="text"
                                    value={selectedColorXAxisLabel}
                                />
                            </StyledChartContainer>
                            <StyledChartContainer>
                                <Typography variant="h6">
                                    Select a Color for Yaxis Label{' '}
                                </Typography>
                                {/* Color Picker */}
                                <TextField
                                    fullWidth
                                    type="color"
                                    value={selectedColorYAxisLabel}
                                    onChange={handleColorChangeForYAXisLabel}
                                    size="small"
                                    variant="outlined"
                                    autoComplete="off"
                                />
                                {/* Text Box to Show Selected Color */}
                                <TextField
                                    type="text"
                                    value={selectedColorYAxisLabel}
                                />
                            </StyledChartContainer>
                        </Stack>
                    </Accordion.Content>
                </Accordion>
                <Accordion
                    expanded={featuresExpand}
                    onChange={() => setFeatureExpand(!featuresExpand)}
                >
                    <Accordion.Trigger>Features</Accordion.Trigger>
                    <Accordion.Content>
                        <Stack>
                            <Typography variant="h6">
                                Rotate Label(degrees):
                                <TextField
                                    focused={false}
                                    type="number"
                                    name="symbolsize"
                                    value={labelRotation}
                                    onChange={handleChangelabelRotation}
                                />
                            </Typography>
                            <Typography variant="h6" align="center">
                                Select Font
                            </Typography>
                            <Select
                                name="Select Font"
                                value={labelFont}
                                onChange={handlelabelFont}
                            >
                                <MenuItem value="sans-serif">
                                    sans-serif
                                </MenuItem>
                                <MenuItem value="serif">serif</MenuItem>
                                <MenuItem value="monospace">monospace</MenuItem>
                            </Select>
                            <Typography variant="h6">
                                Label Font Size:
                                <TextField
                                    focused={false}
                                    type="number"
                                    name="symbolsize"
                                    value={labelFontSize}
                                    onChange={handleLabelSize}
                                />
                            </Typography>
                            <Typography variant="h6">
                                Label Font color:
                                <TextField
                                    focused={false}
                                    type="color"
                                    fullWidth={true}
                                    name="color"
                                    value={labelColor}
                                    onChange={handleLabelColor}
                                />
                                <TextField type="text" value={labelColor} />
                            </Typography>
                            <Checkbox
                                checked={showLabel}
                                label={'DisplayValueLabels'}
                                onChange={(e) => {
                                    showValueLabel(e);
                                }}
                            />
                            <Checkbox
                                checked={showTooltips}
                                label={'showTooltip'}
                                onChange={(e) => {
                                    showTooltip(e);
                                }}
                            />
                        </Stack>
                    </Accordion.Content>
                </Accordion>
                <ScatterPlotResize id={id} />
            </Stack>
        );
    },
);
