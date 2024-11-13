import { useEffect, useMemo, useRef, useState, Suspense, lazy } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { Block, BlockDef, QueryState } from '@/stores';
import { getValueByPath } from '@/utility';
import {
    Button,
    useNotification,
    Modal,
    Select,
    Stack,
    MenuItem,
    TextField,
    Tooltip,
    Container,
    Accordion,
} from '@semoss/ui';
import { ToolTips } from './ToolTips';

// Reduce Initial Bundle
const colorPalettes = {
    Default: {
        scheme: 'category10',
        colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'],
    },
    Accent: {
        scheme: 'accent',
        colors: ['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0'],
    },
    Dark2: {
        scheme: 'dark2',
        colors: ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e'],
    },
    Paired: {
        scheme: 'paired',
        colors: ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99'],
    },
    Pastel1: {
        scheme: 'pastel1',
        colors: ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6'],
    },
    Set1: {
        scheme: 'set1',
        colors: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00'],
    },
    Set2: {
        scheme: 'set2',
        colors: ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854'],
    },
};
const colorPalettes1 = [
    {
        name: 'Semoss',
        displayName: 'Semoss',
        colors: [
            '#4575b4',
            '#74add1',
            '#abd9e9',
            '#e0f3f8',
            '#ffffbf',
            '#EECF96',
            '#DD9080',
            '#CE6661',
            '#C0444E',
            '#E3B28B',
        ],
    },
    {
        name: 'One',
        displayName: 'Option 1',
        colors: [
            '#ffffe5',
            '#fff2d8',
            '#F8EEA8',
            '#EECF96',
            '#E3B28B',
            '#DD9080',
            '#D9776D',
            '#CE6661',
            '#C75756',
            '#C0444E',
        ],
    },
    {
        name: 'Two',
        displayName: 'Option 2',
        colors: [
            '#ffffe5',
            '#f7fcb9',
            '#d9f0a3',
            '#addd8e',
            '#78c679',
            '#41ab5d',
            '#238443',
            '#006837',
            '#004529',
            '#00331f',
        ],
    },
    {
        name: 'Three',
        displayName: 'Option 3',
        colors: [
            '#f7fcfd',
            '#e0ecf4',
            '#bfd3e6',
            '#9ebcda',
            '#90aed5',
            '#8c96c6',
            '#8c6bb1',
            '#88419d',
            '#810f7c',
            '#4d004b',
        ],
    },
    {
        name: 'Four',
        displayName: 'Option 4',
        colors: [
            '#dae4f1',
            '#c8d6ea',
            '#a3bbdc',
            '#90aed5',
            '#6b93c7',
            '#5985c0',
            '#3f6ca6',
            '#386094',
            '#315481',
            '#2a486f',
        ],
    },
    {
        name: 'Five',
        displayName: 'Option 5',
        colors: [
            '#C0444E',
            '#CE6661',
            '#DD9080',
            '#EECF96',
            '#F8EEA8',
            '#ffffbf',
            '#e0f3f8',
            '#abd9e9',
            '#74add1',
            '#4575b4',
        ],
    },
    {
        name: 'Six',
        displayName: 'Option 6',
        colors: [
            '#4575b4',
            '#74add1',
            '#abd9e9',
            '#e0f3f8',
            '#ffffbf',
            '#F8EEA8',
            '#EECF96',
            '#DD9080',
            '#CE6661',
            '#C0444E',
        ],
    },
    {
        name: 'Seven',
        displayName: 'Option 7',
        colors: [
            '#C0444E',
            '#CE6661',
            '#DD9080',
            '#EECF96',
            '#F8EEA8',
            '#ffffbf',
            '#d9f0a3',
            '#addd8e',
            '#238443',
            '#004529',
        ],
    },
    {
        name: 'Eight',
        displayName: 'Option 8',
        colors: [
            '#004529',
            '#238443',
            '#addd8e',
            '#d9f0a3',
            '#ffffbf',
            '#F8EEA8',
            '#EECF96',
            '#DD9080',
            '#CE6661',
            '#C0444E',
        ],
    },
    {
        name: 'Nine',
        displayName: 'Option 9',
        colors: [
            '#cc3300',
            '#ff3300',
            '#ff9900',
            '#ffcc00',
            '#ffff00',
            '#ccff33',
            '#33cc33',
            '#0099cc',
            '#0066ff',
            '#6600cc',
        ],
    },
    {
        name: 'Ten',
        displayName: 'Option 10',
        colors: [
            '#6600cc',
            '#0066ff',
            '#0099cc',
            '#33cc33',
            '#ccff33',
            '#ffff00',
            '#ffcc00',
            '#ff9900',
            '#ff3300',
            '#cc3300',
        ],
    },
    {
        name: 'Eleven',
        displayName: 'Option 11',
        colors: [
            '#30a9fc',
            '#2d9deb',
            '#288dd3',
            '#237eba',
            '#2175ad',
            '#1e699c',
            '#195a85',
            '#164e74',
            '#12405e',
            '#0f344d',
        ],
    },
    // Add more palettes as needed
];

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
}

export const ChartFeatures = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const [activeFeature, setActiveFeature] = useState('features');
        return (
            <div>
                <h1>Chart Features</h1>
                <div>
                    <Button
                        onClick={() => setActiveFeature('styling')}
                        className={activeFeature === 'styling' ? 'active' : ''}
                    >
                        Styling
                    </Button>
                    <Button
                        onClick={() => setActiveFeature('features')}
                        className={activeFeature === 'features' ? 'active' : ''}
                    >
                        Features
                    </Button>
                </div>

                <div>
                    {activeFeature === 'styling' && (
                        <PieChartStyling id={id} path={path} />
                    )}
                    {activeFeature === 'features' && (
                        <PieChartFeatures id={id} path={path} />
                    )}
                </div>
            </div>
        );
    },
);
const PieChartStyling = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [range, setRange] = useState<any>(50);
        const [titleSettings, setTitleSettings] = useState('');
        const [selectedPalette, setSelectedPalette] = useState<any>(
            colorPalettes1[0],
        );
        const [expanded, setExpanded] = useState(false);
        const handlePaletteClick = (palette) => {
            setSelectedPalette(palette); // Updates selected palette immediately on change
        };
        const handleExecute = () => {
            console.log(selectedPalette, 'selectedPalette');
            const spec = JSON.parse(value);
            spec.layer[0].encoding.color.scale.range = selectedPalette.colors;
            console.log(spec, 'spec');
            spec['_state'] =
                spec['_state'] && Object.keys(spec['_state']).length > 0
                    ? spec['_state']
                    : {};
            spec['_state']['styling'] = {
                ...spec['_state']['styling'],
                colors: selectedPalette.colors,
                colorName: selectedPalette.name,
                displaycolorName: selectedPalette.displayName,
            };
            setData(path, spec as PathValue<D['data'], typeof path>);
            setChartFeaturesValue(JSON.stringify(spec));
        };

        // track the value
        const [value, setChartFeaturesValue] = useState('');
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
            if (data) {
                const json: PathValue<D['data'], typeof path> =
                    JSON.parse(computedValue);
                let state = json['_state'];
                if (state && state.hasOwnProperty('styling')) {
                    reinitializeFeatures(state['styling']);
                }
            }
        }, []);
        const reinitializeFeatures = (state) => {
            console.log(state, 'state');
            setTitleSettings(state.pieTitle ? state.pieTitle : titleSettings);
            if (
                state.colors.length > 0 &&
                state.colorName.length > 0 &&
                state.displaycolorName.length > 0
            ) {
                const palatteSelected = {
                    name: state.colorName,
                    displayName: state.displaycolorName,
                    colors: [state.colors],
                };
                console.log(palatteSelected, 'palatteSelected');
                setSelectedPalette(palatteSelected);
            }
        };
        // const [titleSettings, setTitleSettings] = useState('');
        // track the ref to debounce the input
        const donutChart = () => {
            console.log(data, 'DOnut Chart');
            console.log(data.specJson, 'test');
            console.log(value, 'test value');
            const spec = JSON.parse(value);
            spec.layer[0].mark.innerRadius = spec.layer[0].mark.innerRadius
                ? 0
                : 50;
            setData(path, spec as PathValue<D['data'], typeof path>);
            console.log(spec, ' test spec');
        };
        const handlePaletteChange = (palette) => {
            console.log(palette, 'event');
            console.log(palette, 'event.target');
            const spec = JSON.parse(value);
            spec.encoding.color.scale.scheme = colorPalettes[palette].scheme;
            spec.encoding.color.scale.colors = colorPalettes[palette].colors;
            console.log(spec, 'spec');
            setData(path, spec as PathValue<D['data'], typeof path>);
        };
        const handleChange = (e) => {
            console.log(e, 'e');
            // const { name, value } = e.target;
            setTitleSettings(e.target.value);
        };
        const titlechange = () => {
            let spec = JSON.parse(value);
            console.log(titleSettings, 'titleSettings');
            spec.title.text = titleSettings;
            // spec.title.fontSize= titleSettings.fontSize;
            // spec.title.color= titleSettings.fontColor;
            // spec.title.fontWeight= titleSettings.fontWeight;
            // spec.title.font= titleSettings.fontFamily;
            // spec.title.anchor= titleSettings.anchor;
            spec['_state'] =
                spec['_state'] && Object.keys(spec['_state']).length > 0
                    ? spec['_state']
                    : {};
            spec['_state']['styling'] = {
                ...spec['_state']['styling'],
                pieTitle: titleSettings,
            };
            setData(path, spec as PathValue<D['data'], typeof path>);
            setChartFeaturesValue(JSON.stringify(spec));
        };

        // update the value whenever the computed one changes
        {
            console.log(selectedPalette, 's{console.log(selectedPalette)}');
        }
        return (
            <Suspense fallback={<>...</>}>
                <Button onClick={() => donutChart()}>
                    Convert it to donut chart{' '}
                </Button>
                <div></div>
                <div>
                    {/* Form to customize the title settings */}
                    <div>
                        <Stack>
                            <label>
                                Title Text:
                                <TextField
                                    focused={false}
                                    type="text"
                                    name="text"
                                    value={titleSettings}
                                    onChange={handleChange}
                                />
                            </label>

                            {/* <label>
      Font Size:
      <TextField
        focused={false}
        type="number"
        name="fontSize"
        value={titleSettings.fontSize}
        onChange={handleChange}
      />
    </label>
    
    <label>
      Font Color:
      <input 
        type="color"
        name="fontColor"
        value={titleSettings.fontColor}
        onChange={handleChange}
      />
    </label>
    
    <label>
      Font Weight:
      <Select name="fontWeight" value={titleSettings.fontWeight} onChange={(e)=>handleChange(e)}>
        <MenuItem value="normal">Normal</MenuItem>
        <MenuItem value="bold">Bold</MenuItem>
        <MenuItem value="100">100</MenuItem>
        <MenuItem value="200">200</MenuItem>
        <MenuItem value="300">300</MenuItem>
        <MenuItem value="400">400</MenuItem>
        <MenuItem value="500">500</MenuItem>
        <MenuItem value="600">600</MenuItem>
        <MenuItem value="700">700</MenuItem>
        <MenuItem value="800">800</MenuItem>
        <MenuItem value="900">900</MenuItem>
      </Select>
    </label> 
    
    <label>
      Font Family:
      <Select name="fontFamily" value={titleSettings.fontFamily} onChange={handleChange}>
        <MenuItem value="Arial">Arial</MenuItem>
        <MenuItem value="Courier New">Courier New</MenuItem>
        <MenuItem value="Georgia">Georgia</MenuItem>
        <MenuItem value="Times New Roman">Times New Roman</MenuItem>
        <MenuItem value="Brush Script MT">Brush Script MT</MenuItem>
      </Select>
    </label>
    
    <label>
      Anchor:
      <Select name="anchor" value={titleSettings.anchor} onChange={handleChange}>
        <MenuItem value="start">Start</MenuItem>
        <MenuItem value="middle">Middle</MenuItem>
        <MenuItem value="end">End</MenuItem>
      </Select>
    </label> 
     */}
                            {/* Execute button to apply settings */}
                            <Button onClick={() => titlechange()}>
                                Execute
                            </Button>
                            <Accordion
                                expanded={expanded}
                                onChange={() => setExpanded(!expanded)}
                            >
                                <Accordion.Trigger>Color</Accordion.Trigger>
                                <Accordion.Content>
                                    <div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '10px',
                                            }}
                                        >
                                            {colorPalettes1.map(
                                                (palette, index) => (
                                                    <div
                                                        key={palette.name}
                                                        onClick={() =>
                                                            handlePaletteClick(
                                                                palette,
                                                            )
                                                        }
                                                        style={{
                                                            cursor: 'pointer',
                                                            marginBottom:
                                                                '10px',
                                                            borderRadius: '8px',
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontWeight:
                                                                    'bold',
                                                                marginBottom:
                                                                    '5px',
                                                            }}
                                                        >
                                                            {
                                                                palette.displayName
                                                            }
                                                        </span>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                gap: '3px',
                                                                padding: '10px',
                                                                borderRadius:
                                                                    '20px',
                                                                backgroundColor:
                                                                    selectedPalette.name ===
                                                                    palette.name
                                                                        ? '#4CAF50'
                                                                        : '#F0F0F0',
                                                                boxShadow:
                                                                    selectedPalette.name ===
                                                                    palette.name
                                                                        ? '0px 0px 5px rgba(0, 0, 0, 0.3)'
                                                                        : 'none',
                                                                width: '100%',
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    display:
                                                                        'flex',
                                                                    gap: '5px',
                                                                }}
                                                            >
                                                                {palette.colors.map(
                                                                    (color) => (
                                                                        <div
                                                                            key={
                                                                                color
                                                                            }
                                                                            style={{
                                                                                backgroundColor:
                                                                                    color,
                                                                                width: '9px',
                                                                                height: '20px',
                                                                                borderRadius:
                                                                                    '7%',
                                                                            }}
                                                                        />
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                        <Button
                                            onClick={handleExecute}
                                            color="primary"
                                        >
                                            Execute
                                        </Button>
                                    </div>
                                </Accordion.Content>
                            </Accordion>
                        </Stack>
                    </div>
                </div>
            </Suspense>
        );
    },
);
const PieChartFeatures = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

        // track the value
        const [value, setValue] = useState('');
        const [labelPosition, setLabelPosition] = useState('Outside');
        const [fontSize, setFontSize] = useState(12);
        const [showLabel, setShowLabel] = useState(false);
        // track the ref to debounce the input
        const showTooltip = () => {
            const spec = JSON.parse(value);
            console.log(spec, 'spec');
            spec.layer[0].mark.tooltip = spec.layer[0].mark.tooltip
                ? false
                : true;
            setData(path, spec as PathValue<D['data'], typeof path>);
        };
        const showLabels = () => {
            const spec = JSON.parse(value);
            console.log(spec, 'spec');
            spec.layer[1].encoding.theta.field =
                showLabel == false ? 'value' : '';
            spec.layer[1].encoding.color.field =
                showLabel == false ? 'value' : '';
            spec.layer[1].encoding.text.field =
                showLabel == false ? 'value' : '';
            setShowLabel(!showLabel);
            setData(path, spec as PathValue<D['data'], typeof path>);
            spec['_state'] =
                spec['_state'] && Object.keys(spec['_state']).length > 0
                    ? spec['_state']
                    : {};
            spec['_state']['styling'] = {
                ...spec['_state']['styling'],
                canShowLabl: showLabel,
            };
            setValue(JSON.stringify(spec));
        };
        const handleChangeLabelPosition = (e) => {
            setLabelPosition(e.target.value);
        };
        const handleChangeFontSize = (e) => {
            setFontSize(e.target.value);
        };
        const excecute = () => {
            console.log(labelPosition, fontSize, 'test');
            const spec = JSON.parse(value);
            console.log(spec, 'spec');
            spec.layer[1].mark.radius = labelPosition === 'Inside' ? 90 : 160;
            spec.layer[1].mark.fontSize = fontSize;
            spec['_state'] =
                spec['_state'] && Object.keys(spec['_state']).length > 0
                    ? spec['_state']
                    : {};
            spec['_state']['styling'] = {
                ...spec['_state']['styling'],
                labelPosition: labelPosition,
                fontSize: fontSize,
            };
            setData(path, spec as PathValue<D['data'], typeof path>);
            setValue(JSON.stringify(spec));
        };

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

        // update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue, data]);
        useEffect(() => {
            if (data) {
                const json: PathValue<D['data'], typeof path> =
                    JSON.parse(computedValue);
                let state = json['_state'];
                if (state && state.hasOwnProperty('styling')) {
                    reinitializeFeatures(state['styling']);
                }
            }
        }, []);
        const reinitializeFeatures = (state) => {
            setLabelPosition(
                state.labelPosition ? state.labelPosition : labelPosition,
            );
            setFontSize(state.fontSize ? state.fontSize : fontSize);
        };

        return (
            <Suspense fallback={<>...</>}>
                <Stack>
                    <ToolTips id={id} path={path} />
                    <Button onClick={showLabels}>Display value labels</Button>
                    {showLabel ? (
                        <Stack>
                            <label>
                                Choose a position for the Label
                                <Select
                                    name="Choose a position for the Label"
                                    value={labelPosition}
                                    onChange={handleChangeLabelPosition}
                                >
                                    <MenuItem value="Inside">Inside</MenuItem>
                                    <MenuItem value="Outside">Outside</MenuItem>
                                </Select>
                            </label>
                            <label>
                                Font Size:
                                <TextField
                                    focused={false}
                                    type="number"
                                    name="fontSize"
                                    value={fontSize}
                                    onChange={handleChangeFontSize}
                                />
                            </label>
                            <Button onClick={excecute}>Execute</Button>
                        </Stack>
                    ) : (
                        ''
                    )}
                </Stack>
            </Suspense>
        );
    },
);
