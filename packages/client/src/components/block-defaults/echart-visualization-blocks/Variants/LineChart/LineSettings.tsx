import { observer } from 'mobx-react-lite';
import {
    Autocomplete,
    TextField,
    IconButton,
    Button,
    Select,
    styled,
} from '@semoss/ui';
import { BaseSettingSection, Fields } from '@/components/block-settings';
import { EchartVisualizationBlockDef } from '@/components/block-defaults/echart-visualization-blocks';
import { useBlockSettings, useBlocksPixel } from '@/hooks';
import { Sync } from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { CustomizeTitle } from './LineTitle';
import { Paths, PathValue } from '@/types';
import { LineValueLabel } from './LineValueLabels';
import { computed } from 'mobx';
import { getValueByPath } from '@/utility';
import { Block, BlockDef } from '@/stores';

const StyledSelect = styled(Select)(() => ({
    width: '100%',
}));
interface LineSettingsProps<D extends BlockDef = BlockDef> {
    /** Id of the block */
    id: string;
    path: Paths<Block<D>['data'], 4>;
}
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
export const LineSettings = observer(
    <D extends BlockDef = BlockDef>({ id, path }: LineSettingsProps<D>) => {
        const curveType = ['Smooth', 'Exact', 'Step'];
        const lineType = ['Solid', 'Dashed', 'Dotted'];
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        const [AxisVisible, SetAxisVisible] = useState({
            isXAxisVisible: true,
            isYAxisVisible: true,
            valueLabelVisible: true,
            tooltipVisible: true,
            legendVisible: false,
            XAxisTick: true,
            YAxisTick: true,
            XAxisTitle: true,
            YAxisTitle: true,
            toggleTrendline: false,
        });

        const [xAxisTitle, SetXAxisTitle] = useState('');
        const [yAxisTitle, SetYAxisTitle] = useState('');
        const [value, setChartFeaturesValue] = useState('');
        // get all of the frames
        const getFrames = useBlocksPixel<string[]>('GetFrames();', {
            data: [],
        });

        // options for the autocomplete
        const options = getFrames.status === 'SUCCESS' ? getFrames.data : [];

        // sync block data
        const syncBlockData = () => {
            getFrames.refresh();
        };
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
            let option = data.option;
            let dataLength = option['series'].length;
            option['xAxis'].show = AxisVisible.isXAxisVisible;
            option['yAxis'].show = AxisVisible.isYAxisVisible;
            for (let i = 0; i < dataLength; i++) {
                option['series'][i]['label'].show =
                    AxisVisible.valueLabelVisible;
            }
            option['tooltip'].show = AxisVisible.tooltipVisible;
            option['xAxis']['axisTick'].show = AxisVisible.XAxisTick;
            option['yAxis']['axisTick'].show = AxisVisible.YAxisTick;
            option['legend'].show = AxisVisible.legendVisible;
            if (AxisVisible.XAxisTitle && option['_state']) {
                option['xAxis']['name'] = option['_state']['fields']['xAxis'];
            } else {
                option['xAxis']['name'] = '';
            }
            if (AxisVisible.YAxisTitle && option['_state']) {
                option['yAxis']['name'] = option['_state']['fields']['yAxis'];
                for (let i = 0; i < dataLength; i++) {
                    option['series'][i]['name'] =
                        option['_state']['fields']['yAxis'][i];
                }
            } else {
                option['yAxis']['name'] = '';
                for (let i = 0; i < dataLength; i++) {
                    option['series'][i]['name'] = '';
                }
            }
            if (AxisVisible.toggleTrendline) {
                let data = option['series'];
                let a = option['series'].map((series, index) => ({
                    id: `TrendLine${index + 1}`,
                    name: `TrendLine ${series.name}`,
                    lineStyle: { type: 'dashed' },
                    data: series.data,
                    label: series.label,
                }));
                let names = a.map((item) => item.name);
                option['yAxis']['name'] = option['yAxis']['name'].concat(names);
                option['series'] = data.concat(a);
            } else {
            }
        }, [AxisVisible]);
        useEffect(() => {
            if (data.hasOwnProperty) {
                retainXaxisTitle(data.option);
            }
        }, [data.option['xAxis']['name']]);
        useEffect(() => {
            if (data.hasOwnProperty) {
                retainYaxisTitle(data.option);
            }
        }, [data.option['yAxis']['name']]);
        const retainXaxisTitle = (option) => {
            if (option.hasOwnProperty('xAxis')) {
                if (option.xAxis && option.xAxis.hasOwnProperty('name')) {
                    SetXAxisTitle(data.option['xAxis']['name']);
                }
            }
        };
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
                </div>
            );
        };
        const retainYaxisTitle = (option) => {
            if (option.hasOwnProperty('xAxis')) {
                if (option.xAxis && option.xAxis.hasOwnProperty('name')) {
                    let axisNames = data.option['yAxis']['name'];
                    SetYAxisTitle(axisNames);
                }
            }
        };
        function handleAxisVisible(title) {
            if (title === 'XAXIS') {
                SetAxisVisible((prev) => {
                    return {
                        ...prev,
                        isXAxisVisible: !AxisVisible.isXAxisVisible,
                    };
                });
            } else if (title === 'YAXIS') {
                SetAxisVisible((prev) => {
                    return {
                        ...prev,
                        isYAxisVisible: !AxisVisible.isYAxisVisible,
                    };
                });
            } else if (title === 'ValueLabel') {
                SetAxisVisible((prev) => {
                    return {
                        ...prev,
                        valueLabelVisible: !AxisVisible.valueLabelVisible,
                    };
                });
            } else if (title === 'Legend') {
                SetAxisVisible((prev) => {
                    return {
                        ...prev,
                        legendVisible: !AxisVisible.legendVisible,
                    };
                });
            } else if (title === 'Tooltip') {
                SetAxisVisible((prev) => {
                    return {
                        ...prev,
                        tooltipVisible: !AxisVisible.tooltipVisible,
                    };
                });
            } else if (title === 'XAxisTick') {
                SetAxisVisible((prev) => {
                    return {
                        ...prev,
                        XAxisTick: !AxisVisible.XAxisTick,
                    };
                });
            } else if (title === 'YAxisTick') {
                SetAxisVisible((prev) => {
                    return {
                        ...prev,
                        YAxisTick: !AxisVisible.YAxisTick,
                    };
                });
            } else if (title === 'XAxisTitle') {
                SetAxisVisible((prev) => {
                    return {
                        ...prev,
                        XAxisTitle: !AxisVisible.XAxisTitle,
                    };
                });
            } else if (title === 'YAxisTitle') {
                SetAxisVisible((prev) => {
                    return {
                        ...prev,
                        YAxisTitle: !AxisVisible.YAxisTitle,
                    };
                });
            } else if (title === 'toggleTrendline') {
                SetAxisVisible((prev) => {
                    return {
                        ...prev,
                        toggleTrendline: !AxisVisible.toggleTrendline,
                    };
                });
            }
        }

        function updateCustomTitle(values: any) {
            let option = data.option;
            option['title'].text = values.titleName;
            option['title'].left = values.alignment;
            option['title']['textStyle'].fontSize = values.titleSize;
            option['title']['textStyle'].color = values.titleColor;
            option['title']['textStyle'].fontWeight = values.titleFontWeight;
            option['title']['textStyle'].fontFamily = values.titleFontFamily;
            setData('option', option as PathValue<any, any>);
        }
        function updateValueLabels(values: any) {
            let option = data.option;
            let dataLength = option['series'].length;
            for (let i = 0; i < dataLength; i++) {
                option['series'][i]['label'].position = values.labelPosition;
                option['series'][i]['label'].rotate = values.labelAngle;
                option['series'][i]['label'].fontSize = values.labelSize;
                option['series'][i]['label'].fontFamily =
                    values.labelFontFamily;
                option['series'][i]['label'].color = values.labelColor;
            }
            setData('option', option as PathValue<any, any>);
        }
        function updateCurveType(e) {
            let option = data.option;
            let dataLength = option['series'].length;
            let type = e.target.value;
            for (let i = 0; i < dataLength; i++) {
                if (type === 'Smooth') {
                    option['series'][i]['step'] = '';
                    option['series'][i]['smooth'] = true;
                } else if (type === 'Exact') {
                    option['series'][i]['smooth'] = false;
                    option['series'][i]['step'] = '';
                } else if (type === 'Step') {
                    option['series'][i]['step'] = 'start';
                }
            }

            setData('option', option as PathValue<any, any>);
        }
        function updateLineType(e) {
            let option = data.option;
            let dataLength = option['series'].length;
            let type = e.target.value;
            for (let i = 0; i < dataLength; i++) {
                if (type === 'Solid') {
                    option['series'][i]['lineStyle'].type = 'solid';
                } else if (type === 'Dashed') {
                    option['series'][i]['lineStyle'].type = 'dashed';
                } else if (type === 'Dotted') {
                    option['series'][i]['lineStyle'].type = 'dotted';
                }
            }
        }
        function handleLineWeight(e) {
            let option = data.option;
            let dataLength = option['series'].length;
            for (let i = 0; i < dataLength; i++) {
                option['series'][i]['lineStyle'].width = e.target.value;
            }
            setData('option', option as PathValue<any, any>);
        }
        function handleXAxisRotate(e) {
            let option = data.option;
            option['xAxis']['axisLabel'].rotate = e.target.value;
            setData('option', option as PathValue<any, any>);
        }
        function handleYAxisRotate(e) {
            let option = data.option;
            option['yAxis']['axisLabel'].rotate = e.target.value;
            setData('option', option as PathValue<any, any>);
        }
        function handleXFontSize(e) {
            let option = data.option;
            option['xAxis']['nameTextStyle'].fontSize = e.target.value;
            setData('option', option as PathValue<any, any>);
        }
        function handleYFontSize(e) {
            let option = data.option;
            option['yAxis']['nameTextStyle'].fontSize = e.target.value;
            setData('option', option as PathValue<any, any>);
        }
        function handleXAxisTitle(e) {
            let option = data.option;
            SetXAxisTitle(e.target.value);
            option['xAxis']['name'] = e.target.value;
            setData('option', option as PathValue<any, any>);
        }
        function handleYAxisTitle(e) {
            let option = data.option;
            SetYAxisTitle(e.target.value);
            let tilteNames = e.target.value.split(',');
            option['yAxis']['name'] = tilteNames;
            let dataLength = option['series'].length;
            if (dataLength > 0) {
                for (let i = 0; i < dataLength; i++) {
                    option['series'][i]['name'] = tilteNames[i];
                }
            }
            setData('option', option as PathValue<any, any>);
        }
        function handlePaletteClick(colors) {
            let option = data.option;
            option['color'] = colors;
            setData('option', option as PathValue<any, any>);
        }
        return (
            <>
                {/* Frame selection */}
                <BaseSettingSection label="Frame">
                    <Autocomplete
                        fullWidth
                        multiple={false}
                        disabled={getFrames.status !== 'SUCCESS'}
                        value={data.frame.name}
                        options={options}
                        getOptionLabel={(option) => {
                            return option;
                        }}
                        onChange={(_, value) => {
                            // update the frame
                            setData('frame.name', value);
                        }}
                        freeSolo={false}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Select frame"
                                size="small"
                                variant="outlined"
                            />
                        )}
                    />
                    <IconButton size="small" onClick={() => syncBlockData()}>
                        <Sync />
                    </IconButton>
                </BaseSettingSection>

                {/* Fields section */}
                <Fields id={id} path={'option'} />
                <div
                    style={{
                        width: '100%',
                        paddingTop: '0.5rem',
                    }}
                >
                    <Button
                        title="xaxis"
                        onClick={() => handleAxisVisible('XAXIS')}
                    >
                        {AxisVisible.isXAxisVisible
                            ? 'Hide X Axis'
                            : 'Show X Axis'}
                    </Button>
                    <Button
                        title="yaxis"
                        onClick={() => handleAxisVisible('YAXIS')}
                    >
                        {AxisVisible.isYAxisVisible
                            ? 'Hide Y Axis'
                            : 'Show Y Axis'}
                    </Button>
                    <Button
                        title="valueLabel"
                        onClick={() => handleAxisVisible('ValueLabel')}
                    >
                        {AxisVisible.isYAxisVisible
                            ? 'Hide Value Label'
                            : 'Show Value Label'}
                    </Button>
                    <Button
                        title="Legend"
                        onClick={() => handleAxisVisible('Legend')}
                    >
                        {AxisVisible.legendVisible
                            ? 'Hide Legend'
                            : 'Show Legend'}
                    </Button>
                    <Button
                        title="Tooltip"
                        onClick={() => handleAxisVisible('Tooltip')}
                    >
                        {AxisVisible.tooltipVisible
                            ? 'Hide Tooltip'
                            : 'Show Tooltip'}
                    </Button>
                    <Button
                        title="XAxisTick"
                        onClick={() => handleAxisVisible('XAxisTick')}
                    >
                        {AxisVisible.XAxisTick
                            ? 'Hide XAxis Tick'
                            : 'Show XAxis Tick'}
                    </Button>
                    <Button
                        title="YAxisTick"
                        onClick={() => handleAxisVisible('YAxisTick')}
                    >
                        {AxisVisible.YAxisTick
                            ? 'Hide YAxis Tick'
                            : 'Show YAxis Tick'}
                    </Button>
                    <Button
                        title="XAxisTitle"
                        onClick={() => handleAxisVisible('XAxisTitle')}
                    >
                        {AxisVisible.XAxisTitle
                            ? 'Hide XAxis Title'
                            : 'Show XAxis Title'}
                    </Button>
                    <Button
                        title="YAxisTitle"
                        onClick={() => handleAxisVisible('YAxisTitle')}
                    >
                        {AxisVisible.YAxisTitle
                            ? 'Hide YAxis Title'
                            : 'Show YAxis Title'}
                    </Button>
                    <Button
                        title="toggleTrendline"
                        onClick={() => handleAxisVisible('toggleTrendline')}
                    >
                        {AxisVisible.toggleTrendline
                            ? 'Hide Toggle Trendline'
                            : 'Show TYoggle Trendline'}
                    </Button>
                </div>

                {/* <div style={{
                width: '100%',
                paddingTop: '0.5rem',
            }}>
                <Button title="xaxis" onClick={() => handleAxisVisible("XAXIS")}>{AxisVisible.isXAxisVisible ? "Hide X Axis Title" : "Show X Axis Title"}</Button>
                <Button title="yaxis" onClick={() => handleAxisVisible("YAXIS")}>{AxisVisible.isYAxisVisible ? "Hide Y Axis Title" : "Show Y Axis Title"}</Button>
            </div> */}
                <div
                    style={{
                        width: '100%',
                        paddingTop: '0.5rem',
                    }}
                >
                    <label htmlFor="label-position">
                        Select Graph curve type
                    </label>
                    <StyledSelect
                        id="label-position"
                        label="Select Graph Curve"
                        name="GraphCurve"
                        //value={titleData.titleFontFamily}
                        onChange={updateCurveType}
                    >
                        <Select.Item key="-1" value="">
                            Select
                        </Select.Item>
                        {curveType.map((label, index) => {
                            return (
                                <Select.Item value={label} key={index}>
                                    {label}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </div>
                <div
                    style={{
                        width: '100%',
                        paddingTop: '0.5rem',
                    }}
                >
                    <label htmlFor="label-position">Select Line type</label>
                    <StyledSelect
                        id="label-position"
                        label="Select Graph Curve"
                        name="GraphCurve"
                        //value={titleData.titleFontFamily}
                        onChange={updateLineType}
                    >
                        <Select.Item key="-1" value="">
                            Select
                        </Select.Item>
                        {lineType.map((label, index) => {
                            return (
                                <Select.Item value={label} key={index}>
                                    {label}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </div>
                <div
                    style={{
                        width: '100%',
                        paddingTop: '0.5rem',
                    }}
                >
                    <label
                        style={{ paddingTop: '0.5rem' }}
                        htmlFor="label-position"
                    >
                        Line Weight
                    </label>
                    <TextField
                        variant={'outlined'}
                        label="Enter Line Weight"
                        type="number"
                        id="rotate-label"
                        onChange={handleLineWeight}
                    ></TextField>
                </div>
                <div
                    style={{
                        width: '100%',
                        paddingTop: '0.5rem',
                    }}
                >
                    <label
                        style={{ paddingTop: '0.5rem' }}
                        htmlFor="label-position"
                    >
                        X Axis Rotate
                    </label>
                    <TextField
                        variant={'outlined'}
                        label="Rotate Axis"
                        type="number"
                        id="rotate-label"
                        onChange={handleXAxisRotate}
                    ></TextField>
                </div>
                <div
                    style={{
                        width: '100%',
                        paddingTop: '0.5rem',
                    }}
                >
                    <label
                        style={{ paddingTop: '0.5rem' }}
                        htmlFor="label-position"
                    >
                        Y Axis Rotate
                    </label>
                    <TextField
                        variant={'outlined'}
                        label="Rotate Axis"
                        type="number"
                        id="rotate-label"
                        onChange={handleYAxisRotate}
                    ></TextField>
                </div>
                <div
                    style={{
                        width: '100%',
                        paddingTop: '0.5rem',
                    }}
                >
                    <label
                        style={{ paddingTop: '0.5rem' }}
                        htmlFor="label-position"
                    >
                        Edit X Axis Label Font Size
                    </label>
                    <TextField
                        variant={'outlined'}
                        label="Edit Font Size"
                        type="number"
                        id="label-font-size"
                        onChange={handleXFontSize}
                    ></TextField>
                </div>
                <div
                    style={{
                        width: '100%',
                        paddingTop: '0.5rem',
                    }}
                >
                    <label
                        style={{ paddingTop: '0.5rem' }}
                        htmlFor="label-position"
                    >
                        Edit Y Axis Label Font Size
                    </label>
                    <TextField
                        variant={'outlined'}
                        label="Edit Font Size"
                        type="number"
                        id="label-font-size"
                        onChange={handleYFontSize}
                    ></TextField>
                </div>
                <div
                    style={{
                        width: '100%',
                        paddingTop: '0.5rem',
                    }}
                >
                    <label
                        style={{ paddingTop: '0.5rem' }}
                        htmlFor="label-position"
                    >
                        Add / Edit X Axis Title
                    </label>
                    <TextField
                        variant={'outlined'}
                        label="Axis Title"
                        type="text"
                        id="axis-title"
                        value={xAxisTitle}
                        onChange={handleXAxisTitle}
                    ></TextField>
                </div>
                <div
                    style={{
                        width: '100%',
                        paddingTop: '0.5rem',
                    }}
                >
                    <label
                        style={{ paddingTop: '0.5rem' }}
                        htmlFor="label-position"
                    >
                        Add / Edit Y Axis Title
                    </label>
                    <TextField
                        variant={'outlined'}
                        label="Axis Title"
                        type="text"
                        id="axis-title"
                        value={yAxisTitle}
                        onChange={handleYAxisTitle}
                    ></TextField>
                </div>
                <ColorPalettes
                    palettes={colorPalettes}
                    onPaletteClick={handlePaletteClick}
                />
                <LineValueLabel
                    updateChart={updateValueLabels}
                    data={data}
                ></LineValueLabel>
                <CustomizeTitle
                    updateChart={updateCustomTitle}
                    data={data}
                ></CustomizeTitle>
            </>
        );
    },
);
