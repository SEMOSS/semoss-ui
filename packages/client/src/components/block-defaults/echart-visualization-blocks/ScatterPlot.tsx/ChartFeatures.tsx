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
} from '@semoss/ui';

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
        const [symbolSize, setSymbolSize] = useState();
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
                    console.log('nameX');
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
                    console.log('nameY');
                    setShowYaxisTitle(
                        options['yAxis']['name'] == '' ? false : true,
                    );
                }
            }
        };
        useEffect(() => {
            if (data.hasOwnProperty('option')) {
                console.log('rei');
                reinitializeFeatures(data.option);
            }
        }, [id]);

        const reinitializeFeatures = (options) => {
            console.log('rei');
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
                if (
                    options.xAxis &&
                    options.xAxis.axisLabel &&
                    options.xAxis.axisLabel.hasOwnProperty('rotate')
                ) {
                    console.log(
                        'rottae',
                        options['xAxis']['axisLabel']['rotate'],
                    );
                    setRotateXaxis(options['xAxis']['axisLabel']['rotate']);
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
                if (
                    options.yAxis &&
                    options.yAxis.axisLabel &&
                    options.yAxis.axisLabel.hasOwnProperty('rotate')
                ) {
                    setRotateYaxis(options['yAxis']['axisLabel']['rotate']);
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
        };

        const showXAxis = (e) => {
            let option = JSON.parse(value);
            console.log(data, option, e, 'data value');
            setShowXaxis(!showXaxis);
            option['xAxis']['show'] = e.target.checked;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const showYAxis = (e) => {
            let option = JSON.parse(value);
            console.log(data, value, 'data value');
            setShowYaxis(!showYaxis);
            option['yAxis']['show'] = e.target.checked;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const showXAxisTick = (e) => {
            let option = JSON.parse(value);
            console.log(data, option, e, 'data value');
            setShowXaxisTick(!showXaxisTick);
            option['xAxis']['axisTick']['show'] = e.target.checked;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const showYAxisTick = (e) => {
            let option = JSON.parse(value);
            console.log(data, value, 'data value');
            setShowYaxisTick(!showYaxisTick);
            option['yAxis']['axisTick']['show'] = e.target.checked;
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        const rotateXAxis = (e) => {
            console.log(e, 'e');
            let option = JSON.parse(value);
            setRotateXaxis(e.target.value);
            option['xAxis']['axisLabel']['rotate'] = e.target.value;
            setData(path, option as PathValue<D['data'], typeof path>);
        };

        const rotateYAxis = (e) => {
            console.log(e, 'e');
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

        return (
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
                <Typography variant="h6">Rotate X-Axis Values</Typography>
                <Slider
                    onChange={(e) => {
                        rotateXAxis(e);
                    }}
                    value={rotateXaxis}
                    min={0}
                    max={360}
                    valueLabelDisplay="auto"
                />
                <Typography variant="h6">Rotate Y-Axis Values</Typography>
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
                <Button onClick={() => handleChartTitle()}>Execute</Button>
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
                    <MenuItem value="roundRect">RoundRectangle</MenuItem>
                    <MenuItem value="traingle">Traingle</MenuItem>
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
            </Stack>
        );
    },
);
