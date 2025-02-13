import { useEffect, useMemo, useRef, useState, lazy, MouseEvent } from 'react';
import { computed, set } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { getValueByPath } from '@/utility';
import { Block, BlockDef, QueryState } from '@/stores';
import { DefaultBlocks } from '@/components/block-defaults';
import {
    Box,
    Button,
    IconButton,
    InputAdornment,
    Popover,
    Stack,
    styled,
    TextField,
    Icon,
} from '@semoss/ui';
import { SketchPicker } from 'react-color';
import { Input, OutlinedInput } from '@mui/material';
import EChartsReact from 'echarts-for-react';
import {
    Close,
    Delete,
    Edit,
    FormatColorFill,
    Label,
    Padding,
} from '@mui/icons-material';

interface ColorPalatteSettingProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;
    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
}
const StyledButton = styled(Button)(({}) => ({
    justifyContent: 'center',
    display: 'flex',
}));
const StyledCloseButton = styled(Button)(({}) => ({
    titile: 'Add Custom Color Palette',
    width: '10%',
    variant: 'outlined',
    color: 'primary',
    justifyContent: 'flex-end',
}));
const StyledPicker = styled(SketchPicker)(({}) => ({
    marginTop: '20px',
    marginLeft: '20px',
    // display: 'flex',
    width: '300px !important',
    // padding: '10px 10px 0px',
}));
const StyledEmptyContainer = styled('div')(() => ({}));
const StyledColorPalete = styled('div')(() => ({
    display: 'inline-block',
    borderRadius: '10px',
    border: '1px solid #ddd',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    textAlign: 'center',
    backgroundColor: '#fff',
    width: '120px',
    height: '60px',
    cursor: 'pointer',
    margin: '5px',
}));
const StyledPaleteRow = styled('div')(() => ({
    display: 'flex',
    overflow: 'hidden',
    borderTopLeftRadius: '10px',
    borderTopRightRadius: '10px',
}));
const StyledPalete = styled('div')(() => ({
    flex: 1,
    height: '27px',
}));
const StyledOverlay = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'fit-content',
    borderRadius: '12px',
    padding: '16px',
}));
const StyledModel = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    width: 'fit-content',
}));
const StyledHeader = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
}));
const StyledTitle = styled('span')(() => ({
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#3366cc',
}));
const StyledDescription = styled('span')(() => ({
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
    width: '90%',
}));
const StyledButtonClose = styled(Button)(() => ({
    background: 'transparent',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#666',
    marginRight: '20px',
}));
const StyledButtonAdd = styled(Button)(() => ({
    background: '#007AFF',
    color: '#fff',
    fontSize: '14px',
    padding: '6px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginRight: '20px',
}));
const StyledButtonContainer = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '10px',
}));
const StyledPaleteLabel = styled('div')(() => ({
    marginTop: '5px',
    fontSize: '14px',
    fontWeight: 'normal',
}));
const StyledLabel = styled('label')(() => ({
    marginLeft: '20px',
    display: 'flex',
}));
const StyledColorSpan = styled('span')(() => ({ marginLeft: '20px' }));
const StyledEmptyContainer2 = styled('div')(() => ({}));
const StyledEmptyContainer3 = styled('div')(() => ({}));

const ColorPalette = ({ colors, label, onClick }) => {
    return (
        <StyledColorPalete onClick={() => onClick(colors)}>
            {/* Color palette row */}
            <StyledPaleteRow>
                {colors.map((color, index) => (
                    <StyledPalete
                        key={index}
                        style={{
                            backgroundColor: color,
                        }}
                    />
                ))}
            </StyledPaleteRow>
            {/* Label below the palette */}
            <StyledPaleteLabel>{label}</StyledPaleteLabel>
        </StyledColorPalete>
    );
};
export const ColorPalatteSettings = observer<ColorPalatteSettingProps>(
    ({ id, path }) => {
        const palettes = [
            {
                label: 'Option 1',
                colors: [
                    '#007AFF',
                    '#FFEDE9',
                    '#FFE9E2',
                    '#FF00FF',
                    '#A0D8FF',
                    '#082B12',
                    '#A0FF5E',
                    '#22AFFF',
                ],
            },
            {
                label: 'Option 2',
                colors: [
                    '#FF5733',
                    '#33FF57',
                    '#5733FF',
                    '#FF33A8',
                    '#33FFA8',
                    '#A833FF',
                    '#FFA833',
                    '#33A8FF',
                ],
            },
            {
                label: 'Option 3',
                colors: [
                    '#000000',
                    '#444444',
                    '#888888',
                    '#BBBBBB',
                    '#DDDDDD',
                    '#FFFFFF',
                ],
            },
            {
                label: 'Option 4',
                colors: [
                    '#FF0000',
                    '#00FF00',
                    '#0000FF',
                    '#FFFF00',
                    '#FF00FF',
                    '#00FFFF',
                    '#C0C0C0',
                    '#808080',
                ],
            },
            {
                label: 'Option 5',
                colors: [
                    '#D32F2F',
                    '#FBC02D',
                    '#388E3C',
                    '#1976D2',
                    '#7B1FA2',
                    '#F57C00',
                    '#303F9F',
                    '#0288D1',
                ],
            },
            {
                label: 'Option 6',
                colors: [
                    '#1E88E5',
                    '#D81B60',
                    '#43A047',
                    '#FB8C00',
                    '#8E24AA',
                    '#E53935',
                    '#00ACC1',
                    '#546E7A',
                ],
            },
            {
                label: 'Option 7',
                colors: [
                    '#FF6F61',
                    '#6B4226',
                    '#5F4B8B',
                    '#88B04B',
                    '#F7CAC9',
                    '#92A8D1',
                    '#955251',
                    '#B565A7',
                ],
            },
            {
                label: 'Option 8',
                colors: [
                    '#E63946',
                    '#F1FAEE',
                    '#A8DADC',
                    '#457B9D',
                    '#1D3557',
                    '#F4A261',
                    '#2A9D8F',
                    '#264653',
                ],
            },
            {
                label: 'Option 9',
                colors: [
                    '#F94144',
                    '#F3722C',
                    '#F8961E',
                    '#F9C74F',
                    '#90BE6D',
                    '#43AA8B',
                    '#577590',
                    '#4D908E',
                ],
            },
        ];
        const [colors, setColors] = useState([]);
        const [showCustomPopover, setShowCustomPopover] =
            useState<HTMLButtonElement | null>(null);
        const [color, setColor] = useState('#000000');
        const [editColor, setEditColor] = useState('');
        const { data, setData } = useBlockSettings<any>(id);
        const [value, setValue] = useState(data.option);
        const [colorPalatteFlag, setColorPalatteFlag] = useState(false);
        const [editColorFlag, setEditColorFlag] = useState(false);
        const [editIndex, setEditIndex] = useState(-1);
        const [paletteName, setPaletteName] = useState('');
        const pathVal = 'option';
        const [popoverPosition, setPopoverPosition] = useState({
            top: 0,
            left: 0,
        });
        const [colorPalette, setColorPalette] = useState(palettes);
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
        // const barChartColour = getValueByPath(data.option,'series.0');
        // console.log(barChartColour, 'barChartColour');
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return '';
                }
                const v = getValueByPath(data, pathVal);
                if (typeof v === 'undefined') {
                    return '';
                } else if (typeof v === 'string') {
                    return v;
                }
                return JSON.stringify(v, null, 2);
            });
        }, [data, pathVal]).get();

        function handleClick(event: MouseEvent<HTMLButtonElement>) {
            if (showCustomPopover) setShowCustomPopover(null);
            else setShowCustomPopover(event.currentTarget);
            console.log(
                document
                    .getElementById('elm-track-add-custom')
                    .getBoundingClientRect(),
                'elm-track-add-custom',
            );
            let buttonPosition = event.currentTarget.getBoundingClientRect();
            console.log(buttonPosition, 'buttonPosition');
            setPopoverPosition((prev) => ({
                ...prev,
                top: buttonPosition.top - 250,
                left: buttonPosition.left - 850,
            }));
            console.log(popoverPosition, 'popoverPosition');
        }
        function handleClose() {
            setColorPalatteFlag(false);
            setShowCustomPopover(null);
        }
        function handleEdit(index) {
            setEditIndex(index);
        }
        function handleColorPicker() {
            setColorPalatteFlag(!colorPalatteFlag);
        }
        function handleColorChange(e) {
            setColor(e.hex);
        }
        function addColorRow(color) {
            if (!colors.includes(color)) {
                setColors([...colors, color]);
            }
        }
        function editColorRow(color, index) {
            colors.splice(index, 1, color);
        }
        function handleAdd() {
            if (paletteName === '' || colors.length === 0) return;
            setColorPalette((prev) => [
                ...prev,
                { label: paletteName, colors: colors },
            ]);
            setColors([]);
            setPaletteName('');
            handleClose();
        }
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);
        useEffect(() => {
            let option = typeof value === 'string' ? JSON.parse(value) : value;
            if (
                option.hasOwnProperty('series') &&
                option['series'].length > 0
            ) {
                let seriesIndex = option['series'].findIndex(
                    (item) => item.type === 'bar',
                );
                option['series'][seriesIndex] = {
                    ...option['series'][seriesIndex],
                    ['itemStyle']: {
                        color: color,
                    },
                };
            }
            runStateUpdateCustom(option);
        }, [color]);
        function runStateUpdateCustom(option) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            timeoutRef.current = setTimeout(() => {
                try {
                    setData(pathVal, option as PathValue<any, typeof pathVal>);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }
        const open = Boolean(showCustomPopover);
        let customPopoverPositionLeft = popoverPosition.left;
        let customPopoverPositionTop = popoverPosition.top;
        return (
            <StyledEmptyContainer>
                <Popover
                    id={id}
                    open={open}
                    anchorEl={showCustomPopover}
                    onClose={handleClose}
                    // anchorOrigin={{
                    //     vertical: customPopoverPositionTop,
                    //     horizontal: customPopoverPositionLeft,
                    // }}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                    // anchorPosition={{ top: -200, left: -450 }}
                >
                    <StyledOverlay>
                        <StyledModel>
                            <StyledHeader>
                                <StyledTitle>Custom Color Palette</StyledTitle>
                                <StyledCloseButton onClick={handleClose}>
                                    <Icon
                                        sx={{
                                            width: '20px',
                                            height: '20px',
                                            mt: '6px',
                                            marginRight: '12px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            color: 'rgba(0, 0, 0, .5)',
                                        }}
                                    >
                                        <Close />
                                    </Icon>
                                </StyledCloseButton>
                            </StyledHeader>
                            <StyledDescription>
                                Pick your color and create your own color
                                palette
                            </StyledDescription>
                        </StyledModel>
                    </StyledOverlay>
                    <hr style={{ marginBottom: '20px' }}></hr>
                    <StyledLabel htmlFor="outlined-adornment-password">
                        Name
                    </StyledLabel>
                    <TextField
                        style={{
                            marginLeft: '20px',
                            display: 'flex',
                            marginRight: '20px',
                        }}
                        onChange={(e) => {
                            setPaletteName(e.target.value);
                        }}
                        label="Enter Palette Name"
                    ></TextField>
                    <StyledLabel htmlFor="outlined-adornment-password">
                        Select Colour
                    </StyledLabel>
                    <OutlinedInput
                        id="outlined-adornment-password"
                        placeholder="Enter Hex code or Pick Color"
                        aria-label="Select Colour"
                        type={'text'}
                        style={{
                            marginRight: '20px',
                            marginLeft: '20px',
                            display: 'flex',
                        }}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label={'select colour'}
                                    edge="end"
                                >
                                    <FormatColorFill
                                        style={{
                                            width: '33px',
                                            height: '33px',
                                            borderRadius: '20%',
                                            display: 'block',
                                        }}
                                        onClick={handleColorPicker}
                                    ></FormatColorFill>
                                </IconButton>
                            </InputAdornment>
                        }
                        label="Select Colour"
                    />
                    {colorPalatteFlag && (
                        <StyledEmptyContainer>
                            <StyledPicker
                                onChange={(newColor) => {
                                    setColor(newColor.hex);
                                }}
                                // onChangeComplete={() =>{setColorPalatteFlag(false)}}
                                color={color}
                            ></StyledPicker>
                            <StyledButtonContainer>
                                <StyledButtonClose
                                    onClick={() => {
                                        setColorPalatteFlag(false);
                                    }}
                                >
                                    Close
                                </StyledButtonClose>
                                <StyledButtonAdd
                                    onClick={() => {
                                        addColorRow(color);
                                    }}
                                >
                                    Add Color
                                </StyledButtonAdd>
                            </StyledButtonContainer>
                        </StyledEmptyContainer>
                    )}
                    <div>
                        {colors.map((color, index) => (
                            <StyledEmptyContainer key={index}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-start',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        marginBottom: '8px',
                                        marginLeft: '20px',
                                        marginRight: '20px',
                                    }}
                                >
                                    <div
                                        style={{
                                            backgroundColor: color,
                                            width: '33px',
                                            height: '33px',
                                            borderRadius: '20%',
                                        }}
                                    ></div>
                                    <StyledColorSpan>{color}</StyledColorSpan>
                                    <IconButton
                                        style={{
                                            marginLeft: 'auto',
                                            marginRight: '0px',
                                        }}
                                        aria-label={'select colour'}
                                        edge="end"
                                    >
                                        <Edit
                                            style={{
                                                width: '33px',
                                                height: '33px',
                                                borderRadius: '20%',
                                                display: 'block',
                                            }}
                                            onClick={() => {
                                                handleEdit(index);
                                            }}
                                        ></Edit>
                                    </IconButton>
                                    <IconButton
                                        aria-label={'select colour'}
                                        edge="end"
                                    >
                                        <Delete
                                            style={{
                                                width: '33px',
                                                height: '33px',
                                                borderRadius: '20%',
                                                display: 'block',
                                            }}
                                            onClick={() => {
                                                setColors(
                                                    colors.filter(
                                                        (item) =>
                                                            item !== color,
                                                    ),
                                                );
                                            }}
                                        ></Delete>
                                    </IconButton>
                                </div>
                                {index === editIndex && (
                                    <StyledEmptyContainer>
                                        <StyledPicker
                                            onChange={(newColor) => {
                                                setEditColor(newColor.hex);
                                            }}
                                            // onChangeComplete={() =>{setColorPalatteFlag(false)}}
                                            color={editColor}
                                        ></StyledPicker>
                                        <StyledButtonContainer>
                                            <StyledButtonClose
                                                onClick={() => {
                                                    setColorPalatteFlag(false);
                                                }}
                                            >
                                                Close
                                            </StyledButtonClose>
                                            <StyledButtonAdd
                                                onClick={() => {
                                                    editColorRow(
                                                        editColor,
                                                        index,
                                                    );
                                                    setEditIndex(-1);
                                                }}
                                            >
                                                Edit Color
                                            </StyledButtonAdd>
                                        </StyledButtonContainer>
                                    </StyledEmptyContainer>
                                )}
                            </StyledEmptyContainer>
                        ))}
                    </div>
                    <StyledButtonContainer>
                        <StyledButtonClose onClick={handleClose}>
                            Close
                        </StyledButtonClose>
                        <StyledButtonAdd onClick={handleAdd}>
                            Add
                        </StyledButtonAdd>
                    </StyledButtonContainer>
                </Popover>
                {/* <div id='elm-track-add-custom'>&nbsp;</div> */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <StyledButton
                        onClick={handleClick}
                        variant="outlined"
                        color="primary"
                        size="small"
                        style={{ display: 'flex', justifyContent: 'center' }}
                    >
                        + Add Custom Color Palette
                    </StyledButton>
                </div>
                <hr></hr>
                <div style={{ display: 'block' }}>
                    {colorPalette.map((palette, index) => (
                        <ColorPalette
                            onClick={handleColorChange}
                            key={index}
                            colors={palette.colors}
                            label={palette.label}
                        />
                    ))}
                </div>
                {/* </div> */}
            </StyledEmptyContainer>
        );
    },
);
