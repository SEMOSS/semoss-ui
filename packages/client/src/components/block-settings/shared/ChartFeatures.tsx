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
    Typography,
} from '@semoss/ui';
import { ToolTips } from './ToolTips';
import { AccordionActions } from '@mui/material';

// Reduce Initial Bundle
const colorPalettes = [
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
    initialPalettes: [];
}

export const ChartFeatures = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const [activeFeature, setActiveFeature] = useState('features');
        const [initialPalattes, setInitialPalattes] = useState<any>([]);
        useEffect(() => {
            setInitialPalattes(colorPalettes);
        }, []);
        return (
            <div>
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
                        <PieChartStyling
                            id={id}
                            path={path}
                            initialPalettes={initialPalattes}
                        />
                    )}
                    {activeFeature === 'features' && (
                        <PieChartFeatures
                            id={id}
                            path={path}
                            initialPalettes={[]}
                        />
                    )}
                </div>
            </div>
        );
    },
);
const PieChartStyling = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [titleSettings, setTitleSettings] = useState('');
        const [initialPalattes, setInitialPalattes] = useState<any>([]);
        const [selectedPalette, setSelectedPalette] = useState<any>([]);
        const [expanded, setExpanded] = useState(false);
        const [newPaletteName, setNewPaletteName] = useState('');
        const [newColors, setNewColors] = useState('');
        const [editIndex, setEditIndex] = useState(null);
        const [expand, setExpand] = useState(false);
        const [colorPickerValue, setColorPickerValue] = useState('');
        const handlePaletteClick = (palette) => {
            setSelectedPalette(palette); // Updates selected palette immediately on change
        };
        const handleAddOrUpdatePalette = () => {
            if (!newPaletteName || !newColors) return;

            const colorsArray = newColors
                .split(',')
                .map((color) => color.trim());

            if (editIndex !== null) {
                // Update existing palette
                const updatedPalettes = [...initialPalattes];
                updatedPalettes[editIndex] = {
                    name: newPaletteName,
                    displayName: newPaletteName,
                    colors: colorsArray,
                    isCustom: true,
                };
                setInitialPalattes(updatedPalettes);
                setEditIndex(null); // Reset edit mode
            } else {
                // Add new palette
                setInitialPalattes((prevPalettes) => [
                    ...prevPalettes,
                    {
                        name: newPaletteName,
                        displayName: newPaletteName,
                        colors: colorsArray,
                        isCustom: true,
                    },
                ]);
            }
            // Reset input fields
            setNewPaletteName('');
            setNewColors('');
        };
        useEffect(() => {
            if (value && initialPalattes && initialPalattes.length > 0) {
                const spec = JSON.parse(value);
                spec['_state'] =
                    spec['_state'] && Object.keys(spec['_state']).length > 0
                        ? spec['_state']
                        : {};

                if (spec['_state']?.styling?.initialPalattes) {
                    // Clear the initialPalattes object
                    spec['_state'].styling.initialPalattes = {};
                }
                spec['_state']['styling'] = {
                    ...spec['_state']['styling'],
                    initialPalattes: initialPalattes,
                };
                setData(path, spec as PathValue<D['data'], typeof path>);
                setChartFeaturesValue(JSON.stringify(spec));
            }
        }, [initialPalattes]);
        const handleExecute = () => {
            const spec = JSON.parse(value);
            spec.layer[0].encoding.color.scale.range = selectedPalette.colors;
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
        const handleResetColor = () => {
            setSelectedPalette(colorPalettes[0]);
            const spec = JSON.parse(value);
            spec.layer[0].encoding.color.scale.range = colorPalettes[0].colors;
            spec['_state'] =
                spec['_state'] && Object.keys(spec['_state']).length > 0
                    ? spec['_state']
                    : {};
            spec['_state']['styling'] = {
                ...spec['_state']['styling'],
                colors: colorPalettes[0].colors,
                colorName: colorPalettes[0].name,
                displaycolorName: colorPalettes[0].displayName,
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
            setInitialPalattes(colorPalettes);
            setSelectedPalette(colorPalettes[0]);
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
            setTitleSettings(state.pieTitle ? state.pieTitle : titleSettings);
            if (state?.initialPalattes && state?.initialPalattes?.length > 0) {
                setInitialPalattes(state.initialPalattes);
            }
            if (
                state?.colors?.length > 0 &&
                state?.colorName?.length > 0 &&
                state?.displaycolorName?.length > 0
            ) {
                const palatteSelected = {
                    name: state.colorName,
                    displayName: state.displaycolorName,
                    colors: [state.colors],
                };
                setSelectedPalette(palatteSelected);
            }
        };
        // track the ref to debounce the input
        const donutChart = () => {
            const spec = JSON.parse(value);
            spec.layer[0].mark.innerRadius = spec.layer[0].mark.innerRadius
                ? 0
                : 75; // initial radius of the chart to be declared otherwise this value may vary
            setData(path, spec as PathValue<D['data'], typeof path>);
        };
        const handleEditPalette = (index) => {
            const palette = initialPalattes[index];
            setNewPaletteName(palette.name);
            setNewColors(palette.colors.join(', '));
            setEditIndex(index); // Enter edit mode for this palette
        };
        const isNameUnique = (custom, existing) => {
            return !existing.some((palette) => palette.name === custom.name);
        };

        const handleColorPickerChange = (color) => {
            setColorPickerValue(color);
            const colorsArray = newColors
                ? newColors.split(',').map((c) => c.trim())
                : [];
            if (!colorsArray.includes(color)) {
                colorsArray.push(color);
                setNewColors(colorsArray.join(', '));
            }
        };

        // Handle deleting a palette
        const handleDeletePalette = (index) => {
            const updatedPalettes = initialPalattes.filter(
                (_, i) => i !== index,
            );
            setInitialPalattes(updatedPalettes);
            const isUnique = isNameUnique(selectedPalette, updatedPalettes);
            if (isUnique) {
                handlePaletteClick(updatedPalettes[0]);
                const spec = JSON.parse(value);
                spec.layer[0].encoding.color.scale.range =
                    colorPalettes[0].colors;
                spec['_state'] =
                    spec['_state'] && Object.keys(spec['_state']).length > 0
                        ? spec['_state']
                        : {};
                spec['_state']['styling'] = {
                    ...spec['_state']['styling'],
                    colors: colorPalettes[0].colors,
                    colorName: colorPalettes[0].name,
                    displaycolorName: colorPalettes[0].displayName,
                };
                setData(path, spec as PathValue<D['data'], typeof path>);
                setChartFeaturesValue(JSON.stringify(spec));
            }
        };

        useEffect(() => {
            if (selectedPalette && selectedPalette.length > 0)
                setSelectedPalette(selectedPalette);
        }, [selectedPalette]);
        const handleChange = (e) => {
            setTitleSettings(e.target.value);
        };
        const titlechange = () => {
            let spec = JSON.parse(value);
            spec.title.text = titleSettings;
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

        return (
            <Suspense fallback={<>...</>}>
                <Accordion
                    expanded={expand}
                    onChange={() => setExpand(!expand)}
                >
                    <Accordion.Trigger>Styling</Accordion.Trigger>
                    <Accordion.Content>
                        <Stack>
                            <Button onClick={() => donutChart()}>
                                Convert it to donut chart{' '}
                            </Button>
                            <div></div>
                            <div>
                                {/* Form to customize the title settings */}
                                <div>
                                    <Stack>
                                        <Typography variant="h6" align="center">
                                            Title Text:
                                        </Typography>
                                        <TextField
                                            focused={false}
                                            type="text"
                                            name="text"
                                            value={titleSettings}
                                            onChange={handleChange}
                                        />

                                        {/* Execute button to apply settings */}
                                        <Button onClick={() => titlechange()}>
                                            Execute
                                        </Button>
                                        <Accordion
                                            expanded={expanded}
                                            onChange={() =>
                                                setExpanded(!expanded)
                                            }
                                        >
                                            <Accordion.Trigger>
                                                Color
                                            </Accordion.Trigger>
                                            <Accordion.Content>
                                                <div>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            flexWrap: 'wrap',
                                                            gap: '10px',
                                                        }}
                                                    >
                                                        {initialPalattes.map(
                                                            (
                                                                palette,
                                                                index,
                                                            ) => (
                                                                <div>
                                                                    <div
                                                                        key={
                                                                            palette.name
                                                                        }
                                                                        onClick={() =>
                                                                            handlePaletteClick(
                                                                                palette,
                                                                            )
                                                                        }
                                                                        style={{
                                                                            cursor: 'pointer',
                                                                            marginBottom:
                                                                                '10px',
                                                                            borderRadius:
                                                                                '8px',
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
                                                                                display:
                                                                                    'flex',
                                                                                gap: '3px',
                                                                                padding:
                                                                                    '10px',
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
                                                                                    (
                                                                                        color,
                                                                                    ) => (
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
                                                                    {palette.isCustom && (
                                                                        <>
                                                                            <Button
                                                                                onClick={() =>
                                                                                    handleEditPalette(
                                                                                        index,
                                                                                    )
                                                                                }
                                                                                color="primary"
                                                                            >
                                                                                Edit
                                                                            </Button>
                                                                            <Button
                                                                                onClick={() =>
                                                                                    handleDeletePalette(
                                                                                        index,
                                                                                    )
                                                                                }
                                                                                color="error"
                                                                            >
                                                                                Delete
                                                                            </Button>
                                                                        </>
                                                                    )}
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
                                                    <Button
                                                        onClick={
                                                            handleResetColor
                                                        }
                                                        color="error"
                                                    >
                                                        Reset
                                                    </Button>
                                                </div>
                                                <h4>Add New Color Palette</h4>
                                                <TextField
                                                    type="text"
                                                    placeholder="Palette Name"
                                                    value={newPaletteName}
                                                    onChange={(e) =>
                                                        setNewPaletteName(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <TextField
                                                    type="text"
                                                    placeholder="Colors (comma-separated)"
                                                    value={newColors}
                                                    onChange={(e) =>
                                                        setNewColors(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <div
                                                    style={{ margin: '8px 0' }}
                                                >
                                                    <Typography variant="h6">
                                                        Pick a Color:
                                                        <input
                                                            type="color"
                                                            value={
                                                                colorPickerValue
                                                            }
                                                            onChange={(e) =>
                                                                handleColorPickerChange(
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            style={{
                                                                marginLeft:
                                                                    '8px',
                                                            }}
                                                        />
                                                    </Typography>
                                                </div>
                                                <Button
                                                    onClick={
                                                        handleAddOrUpdatePalette
                                                    }
                                                >
                                                    {editIndex !== null
                                                        ? 'Save Palette'
                                                        : 'Add Palette'}
                                                </Button>
                                            </Accordion.Content>
                                        </Accordion>
                                    </Stack>
                                </div>
                            </div>
                        </Stack>
                    </Accordion.Content>
                </Accordion>
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
        const [expand, setExpand] = useState(false);
        // track the ref to debounce the input
        const showTooltip = () => {
            const spec = JSON.parse(value);
            spec.layer[0].mark.tooltip = spec.layer[0].mark.tooltip
                ? false
                : true;
            setData(path, spec as PathValue<D['data'], typeof path>);
        };
        // const showLabels = () => {
        //     const spec = JSON.parse(value);
        //     spec.layer[1].encoding.theta.field =
        //         showLabel == false ? 'value' : '';
        //     spec.layer[1].encoding.color.field =
        //         showLabel == false ? 'value' : '';
        //     spec.layer[1].encoding.text.field =
        //         showLabel == false ? 'value' : '';
        //     setShowLabel(!showLabel);
        //     setData(path, spec as PathValue<D['data'], typeof path>);
        //     spec['_state'] =
        //         spec['_state'] && Object.keys(spec['_state']).length > 0
        //             ? spec['_state']
        //             : {};
        //     spec['_state']['styling'] = {
        //         ...spec['_state']['styling'],
        //         canShowLabl: showLabel,
        //     };
        //     setValue(JSON.stringify(spec));
        // };
        // const handleChangeLabelPosition = (e) => {
        //     setLabelPosition(e.target.value);
        // };
        // const handleChangeFontSize = (e) => {
        //     setFontSize(e.target.value);
        // };
        // const excecute = () => {
        //     const spec = JSON.parse(value);
        //     spec.layer[1].mark.radius = labelPosition === 'Inside' ? 90 : 160;
        //     spec.layer[1].mark.fontSize = fontSize;
        //     spec['_state'] =
        //         spec['_state'] && Object.keys(spec['_state']).length > 0
        //             ? spec['_state']
        //             : {};
        //     spec['_state']['styling'] = {
        //         ...spec['_state']['styling'],
        //         labelPosition: labelPosition,
        //         fontSize: fontSize,
        //     };
        //     setData(path, spec as PathValue<D['data'], typeof path>);
        //     setValue(JSON.stringify(spec));
        // };

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
                <Accordion
                    expanded={expand}
                    onChange={() => setExpand(!expand)}
                >
                    <Accordion.Trigger>Features </Accordion.Trigger>
                    <Accordion.Content>
                        <Stack>
                            <ToolTips id={id} path={path} />
                            {/* <Button onClick={showLabels}>
                                Display value labels
                            </Button>
                            {showLabel ? (
                                <Stack>
                                    <Typography variant="h6">
                                        Choose a position for the Label
                                        <Select
                                            name="Choose a position for the Label"
                                            value={labelPosition}
                                            onChange={handleChangeLabelPosition}
                                        >
                                            <MenuItem value="Inside">
                                                Inside
                                            </MenuItem>
                                            <MenuItem value="Outside">
                                                Outside
                                            </MenuItem>
                                        </Select>
                                    </Typography>
                                    <Typography variant="h6">
                                        Font Size:
                                        <TextField
                                            focused={false}
                                            type="number"
                                            name="fontSize"
                                            value={fontSize}
                                            onChange={handleChangeFontSize}
                                        />
                                    </Typography>
                                    <Button onClick={excecute}>Execute</Button>
                                </Stack>
                            ) : (
                                ''
                            )} */}
                        </Stack>
                    </Accordion.Content>
                </Accordion>
            </Suspense>
        );
    },
);
