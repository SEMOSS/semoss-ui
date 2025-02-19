import { useEffect, useMemo, useRef, useState, lazy, MouseEvent } from 'react';
import { computed, set } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { getValueByPath } from '@/utility';
import { Block, BlockDef, getBlockElement, QueryState } from '@/stores';
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
    ArrowBack,
    Check,
    Close,
    Delete,
    Edit,
    FormatColorFill,
    Label,
    Padding,
} from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';

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
    width: '10%',
    variant: 'outlined',
    color: 'primary',
    justifyContent: 'flex-end',
}));
const StyledPicker = styled(SketchPicker)(({}) => ({
    // marginTop: '20px',
    // marginLeft: '20px',
    width: '300px !important',
    margin: '10px',
    boxShadow:
        'rgba(0, 0, 0, 0) 0px 0px 0px 1px, rgba(0, 0, 0, 0) 0px 8px 16px !important',
    padding: '0px !important',
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
    // padding: '16px',
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
    // fontWeight: 'bold',
    // color: '#3366cc',
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
    marginRight: '5px',
}));
const StyledButtonAdd = styled(Button)(() => ({
    background: '#007AFF',
    color: '#fff',
    fontSize: '14px',
    padding: '6px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginRight: '5px',
}));
const StyledCheck = styled(Button)(() => ({
    fontSize: '20px',
    // padding: '6px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
}));
const StyledButtonContainer = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'flex-end',
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
const StyledRowSection = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
}));
const StyledContainerToggle = styled('div')(() => ({}));
const StyledEmptyContainer2 = styled('div')(() => ({}));
const StyledEmptyContainer3 = styled('div')(() => ({}));

const ColorPalette = ({ colors, label, key, onClick, onEditClick }) => {
    return (
        <StyledColorPalete onClick={() => onClick(colors, label)}>
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
            <IconButton onClick={() => onEditClick(key, label)}>
                <EditIcon />
            </IconButton>
        </StyledColorPalete>
    );
};
export const ColorPalatteSettings = observer<ColorPalatteSettingProps>(
    ({ id, path }) => {
        const palettes = [
            {
                label: 'Option 1',
                palatteLabel: 'Option 1',
                isCustom: false,
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
                palatteLabel: 'Option 2',
                isCustom: false,
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
                palatteLabel: 'Option 3',
                isCustom: false,
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
                palatteLabel: 'Option 4',
                isCustom: false,
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
                palatteLabel: 'Option 5',
                isCustom: false,
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
                palatteLabel: 'Option 6',
                isCustom: false,
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
                palatteLabel: 'Option 7',
                isCustom: false,
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
                palatteLabel: 'Option 8',
                isCustom: false,
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
                palatteLabel: 'Option 9',
                isCustom: false,
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
        const [editColorPalatte, setEditColorPalatte] = useState(-1);
        const [editIndex, setEditIndex] = useState(-1);
        const [paletteName, setPaletteName] = useState('');
        const pathVal = 'option';
        const [popoverPosition, setPopoverPosition] = useState({
            top: 0,
            left: 0,
        });
        const [colorPalette, setColorPalette] = useState(palettes);
        const [toggleAddEdit, setToggleAddEdit] = useState<'' | 'add' | 'edit'>(
            '',
        );
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

        const getStyle = () => {
            let screenEle = document.getElementById(
                'outlined-adornment-colours',
            );
            console.log(screenEle, 'screenEle');
            // get position of page root block element
            /*const screenElementSize = screenEle.getBoundingClientRect();
                // get position of selected block element
                const selectedElement = getBlockElement(designer.selected);
                const selectedElementSize = selectedElement.getBoundingClientRect();

                // check for overflow
                const hasLeftOverflow =
                    screenElementSize.left === selectedElementSize.left &&
                    selectedElementSize.width <
                        STYLED_BUTTON_GROUP_BUTTON_WIDTH * 2;
                const hasRightOverflow =
                    screenElementSize.right === selectedElementSize.right &&
                    selectedElementSize.width <
                        STYLED_BUTTON_GROUP_BUTTON_WIDTH * 2;

                const leftValue =
                    size.left + size.width / 2 - STYLED_BUTTON_GROUP_BUTTON_WIDTH;
                let left: string;
                if (hasRightOverflow) {
                    left = `${
                        leftValue -
                        (STYLED_BUTTON_GROUP_BUTTON_WIDTH * 2 -
                            selectedElementSize.width) +
                        8
                    }px`;
                } else if (hasLeftOverflow) {
                    left = `${size.left - 8}px`;
                } else {
                    left = `${leftValue}px`;
                }

                const top = size.top + size.height;

                return { top, left };*/
        };

        function handleClick(event: MouseEvent<HTMLButtonElement>) {
            // if (showCustomPopover) setShowCustomPopover(null);
            // else setShowCustomPopover(event.currentTarget);
            setToggleAddEdit('add');

            let buttonPosition = event.currentTarget.getBoundingClientRect();
            setPopoverPosition((prev) => ({
                ...prev,
                top: buttonPosition.top - 250,
                left: buttonPosition.left - 850,
            }));
        }
        function handleClose() {
            setColorPalatteFlag(false);
            setShowCustomPopover(null);
            setToggleAddEdit('');
        }
        function handleEdit(index) {
            setEditIndex(index);
            setColorPalatteFlag(false);
        }
        function handleColorPicker() {
            setColorPalatteFlag(!colorPalatteFlag);
            getStyle();
        }
        function handleColorChange(e, label) {
            setPaletteName(label);
            let option = typeof value === 'string' ? JSON.parse(value) : value;
            let colors =
                label === '' || label === undefined
                    ? colorPalette[0]
                    : colorPalette.find((item) => item.label === label);
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
                        ['color']: colors?.colors[0],
                    },
                };
            }
            if (colors?.colors?.length) {
                option = {
                    ...option,
                    ['color']: colors?.colors,
                };
            }
            runStateUpdateCustom(option);
        }
        function handleEditButtonClick(id, label) {
            setToggleAddEdit('edit');
            setPaletteName(label);
            setEditColorPalatte(id);
        }
        function addColorRow(color) {
            if (!colors.includes(color)) {
                setColors([...colors, color]);
            }
        }
        function editColorRow(color, index) {
            colors.splice(index, 1, color);
        }
        function duplicateExists() {
            return availableLabels.includes(paletteName);
        }
        function handleAdd() {
            if (paletteName === '' || colors.length === 0 || duplicateExists())
                return;
            setColorPalette((prev) => [
                ...prev,
                {
                    label: paletteName,
                    colors: colors,
                    palatteLabel: paletteName,
                    isCustom: true,
                },
            ]);
            let option = typeof value === 'string' ? JSON.parse(value) : value;
            let customSettings = { customColorPalette: [] };
            if (option.hasOwnProperty('customSettings')) {
                option = {
                    ...option,
                    customSettings: {
                        ...option['customSettings'],
                    },
                };
            } else {
                option = {
                    ...option,
                    customSettings: {},
                };
            }
            if (option['customSettings'].hasOwnProperty('customColorPalette')) {
                option = {
                    ...option,
                    customSettings: {
                        customColorPalette: [
                            ...option['customSettings']['customColorPalette'],
                            {
                                label: paletteName,
                                colors: colors,
                                palatteLabel: paletteName,
                                isCustom: true,
                            },
                        ],
                    },
                };
            } else {
                option = {
                    ...option,
                    customSettings: {
                        customColorPalette: [
                            {
                                label: paletteName,
                                colors: colors,
                                palatteLabel: paletteName,
                                isCustom: true,
                            },
                        ],
                    },
                };
            }
            // customColorPalette:[
            //     ...option['customSettings']['customColorPalette'],
            //     {
            //         label: paletteName,
            //         colors: colors,
            //     },
            // ],
            setData('option', option as PathValue<any, typeof pathVal>);
            setColors([]);
            setPaletteName('');
            handleClose();
            setToggleAddEdit('');
        }
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);
        useEffect(() => {
            let option =
                typeof computedValue === 'string'
                    ? JSON.parse(computedValue)
                    : computedValue;
            if (
                option.hasOwnProperty('customSettings') &&
                option['customSettings'].hasOwnProperty('customColorPalette')
            ) {
                let colorPaletteData = [
                    ...colorPalette,
                    ...option['customSettings']['customColorPalette'],
                ];
                setColorPalette((prevColourPalatte) => {
                    return [...colorPaletteData];
                });
            }
        }, []);
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
        const availableLabels = useMemo(() => {
            return colorPalette.map((item) => item.label);
        }, [colorPalette]);
        const open = Boolean(showCustomPopover);
        let customPopoverPositionLeft = popoverPosition.left;
        let customPopoverPositionTop = popoverPosition.top;
        const popOverContent = (
            <>
                {/* StyledOverlay section for showing header of popup*/}
                <StyledOverlay>
                    <StyledModel>
                        <StyledHeader>
                            <IconButton
                                sx={{
                                    // width: '20px',
                                    // height: '20px',
                                    // mt: '6px',
                                    // marginRight: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    color: 'rgba(0, 0, 0, .5)',
                                }}
                                onClick={(e) => {
                                    setToggleAddEdit('');
                                    setShowCustomPopover(null);
                                    handleClose();
                                }}
                            >
                                <ArrowBack />
                            </IconButton>
                            <StyledTitle>
                                &nbsp;
                                {toggleAddEdit === 'add' ? 'Create' : 'Edit'} a
                                Custom Color Palette
                            </StyledTitle>
                        </StyledHeader>
                    </StyledModel>
                </StyledOverlay>
                {/*popup name section */}
                <StyledRowSection>
                    <StyledLabel htmlFor="outlined-adornment-password">
                        Name
                    </StyledLabel>
                    <TextField
                        style={{
                            marginLeft: '20px',
                            display: 'flex',
                            marginRight: '20px',
                        }}
                        defaultValue={
                            toggleAddEdit === 'edit' ? paletteName : ''
                        }
                        onChange={(e) => {
                            setPaletteName(e.target.value);
                        }}
                        placeholder="Enter Palette Name"
                    ></TextField>
                </StyledRowSection>
                {/* colours section */}
                <StyledRowSection>
                    <StyledLabel htmlFor="outlined-adornment-colours">
                        Colours
                    </StyledLabel>
                    <OutlinedInput
                        id="outlined-adornment-colours"
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
                </StyledRowSection>
                {/* show color palette when color palate button is pressed */}
                {colorPalatteFlag && (
                    <StyledEmptyContainer
                        style={{
                            display: 'inline-block',
                            borderRadius: '10px',
                            border: '1px solid #ddd',
                            margin: '20px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        }}
                    >
                        <StyledPicker
                            onChange={(newColor) => {
                                setColor(newColor.hex);
                            }}
                            // onChangeComplete={() =>{setColorPalatteFlag(false)}}
                            color={color}
                        ></StyledPicker>
                        <hr></hr>
                        <StyledButtonContainer>
                            <StyledButtonClose
                                onClick={() => {
                                    setColorPalatteFlag(false);
                                }}
                            >
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
                            </StyledButtonClose>
                            <StyledCheck
                                onClick={() => {
                                    addColorRow(color);
                                }}
                            >
                                <Icon
                                    sx={{
                                        width: '20px',
                                        height: '20px',
                                        mt: '6px',
                                        marginRight: '12px',
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                        color: 'rgba(0, 81, 255, 0.5)',
                                    }}
                                >
                                    <Check />
                                </Icon>
                            </StyledCheck>
                        </StyledButtonContainer>
                    </StyledEmptyContainer>
                )}
                {/* selected colours section */}
                <div>
                    {(
                        colors ||
                        colorPalette[editColorPalatte]?.colors ||
                        []
                    ).map((color, index) => (
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
                                {/* Edit button for the colour selected */}
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
                                            setEditColor(color);
                                        }}
                                    ></Edit>
                                </IconButton>
                                {/* delete button for the colour selected */}
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
                                                    (item) => item !== color,
                                                ),
                                            );
                                        }}
                                    ></Delete>
                                </IconButton>
                            </div>
                            {index === editIndex && (
                                // Edit color palette when edit button is clicked
                                <StyledEmptyContainer
                                    style={{
                                        display: 'inline-block',
                                        borderRadius: '10px',
                                        border: '1px solid #ddd',
                                        margin: '20px',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <StyledPicker
                                        onChange={(newColor) => {
                                            setEditColor(newColor.hex);
                                        }}
                                        color={editColor}
                                    ></StyledPicker>
                                    <hr></hr>
                                    <StyledButtonContainer
                                        style={{
                                            marginTop: '5px',
                                            marginBottom: '10px',
                                        }}
                                    >
                                        {/* close the color picker without selecting color */}
                                        <StyledButtonClose
                                            onClick={() => {
                                                setColorPalatteFlag(false);
                                                setEditIndex(-1);
                                            }}
                                        >
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
                                        </StyledButtonClose>
                                        {/* select the color from colour picker */}
                                        <StyledCheck
                                            onClick={() => {
                                                editColorRow(editColor, index);
                                                setEditIndex(-1);
                                            }}
                                        >
                                            <Icon
                                                sx={{
                                                    width: '20px',
                                                    height: '20px',
                                                    mt: '6px',
                                                    marginRight: '12px',
                                                    fontSize: '20px',
                                                    fontWeight: 'bold',
                                                    color: 'rgba(0, 81, 255, 0.5)',
                                                }}
                                            >
                                                <Check />
                                            </Icon>
                                        </StyledCheck>
                                    </StyledButtonContainer>
                                </StyledEmptyContainer>
                            )}
                        </StyledEmptyContainer>
                    ))}
                </div>
                <StyledButtonContainer
                    style={{ marginTop: '10px', marginBottom: '20px' }}
                >
                    <StyledButtonClose onClick={handleClose}>
                        Close
                    </StyledButtonClose>
                    <StyledButtonAdd onClick={handleAdd}>Add</StyledButtonAdd>
                </StyledButtonContainer>
            </>
        );
        return (
            <StyledEmptyContainer>
                {toggleAddEdit != '' && (
                    <StyledContainerToggle>
                        <>{popOverContent}</>
                    </StyledContainerToggle>
                )}
                {toggleAddEdit === '' && (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <StyledButton
                            onClick={handleClick}
                            variant="outlined"
                            color="primary"
                            size="small"
                        >
                            + Add Custom Color Palette
                        </StyledButton>
                    </div>
                )}
                <hr></hr>
                <div style={{ display: 'block' }}>
                    {colorPalette.map((palette, index) => (
                        <ColorPalette
                            onClick={handleColorChange}
                            onEditClick={handleEditButtonClick}
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
