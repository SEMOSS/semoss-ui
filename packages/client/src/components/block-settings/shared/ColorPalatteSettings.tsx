import { useEffect, useMemo, useRef, useState, lazy, MouseEvent } from 'react';
import { computed } from 'mobx';
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
} from '@semoss/ui';
import { SketchPicker } from 'react-color';
import { OutlinedInput } from '@mui/material';
import EChartsReact from 'echarts-for-react';

interface ColorPalatteSettingProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;
    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
    /**
     * Height of ColorPalatte
     */
    height: string;
    /**
     * Width of ColorPalatte
     */
    width: string;
}
const varr = '"Test variable"';
// const StyledChartContainer = styled(SketchPicker)(
//     '.custom-sketch-picker .flexbox-fix:nth-child(4)::before',
//     () => ({
//         content: varr,
//         display: 'block',
//         fontSize:'12px',
//         fontWeight: 'bold',
//         color: 'black',
//         padding: '5px',
//     }),
// );

const StyledChartContainer = styled(SketchPicker)({
    '.custom-sketch-picker .flexbox-fix::before': {
        marginLeft: '32px',
        content: varr,
        display: 'block',
        fontSize: '12px',
        fontWeight: 'bold',
        color: 'black',
    },
    '.custom-sketch-picker .flexbox-fix:last-child div': {
        width: '24px !important' /* Set the width of the color circle */,
        height: '24px !important' /* Set the height of the color circle */,
        borderRadius: '50% !important' /* Makes only preset colors circular */,
        overflow: 'hidden',
    },
});

export const ColorPalatteSettings = observer<ColorPalatteSettingProps>(
    ({ id, path, height, width }) => {
        const [showPopover, setShowPopover] =
            useState<HTMLButtonElement | null>(null);
        const [color, setColor] = useState('#000000');
        const { data, setData } = useBlockSettings<any>(id);
        const [value, setValue] = useState(data.option);
        const pathVal = 'option';
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
            setShowPopover(event.currentTarget);
        }
        function handleClose() {
            setShowPopover(null);
        }
        function handleColorChange(e) {
            console.log(e);
            setColor(e.hex);
        }
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);
        useEffect(() => {
            let option = typeof value === 'string' ? JSON.parse(value) : value;
            // let customPath = 'series.0.itemStyle.color';
            // let customPathArray = customPath.split('.');

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
        const open = Boolean(showPopover);
        console.log(showPopover, 'showpopover');
        return (
            <div>
                <label htmlFor="outlined-adornment-password">
                    Select Colour
                </label>
                <OutlinedInput
                    id="outlined-adornment-password"
                    placeholder="Select Colour"
                    aria-label="Select Colour"
                    type={'text'}
                    value={color}
                    style={{ width: '100%' }}
                    onChange={(e) => {
                        setColor(e.target.value);
                    }}
                    endAdornment={
                        <InputAdornment position="end">
                            <IconButton
                                aria-label={'select colour'}
                                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                    if (showPopover) setShowPopover(null);
                                    else setShowPopover(e.currentTarget);
                                }}
                                edge="end"
                            >
                                <span
                                    style={{
                                        backgroundColor: color,
                                        width: '33px',
                                        height: '33px',
                                        borderRadius: '20%',
                                        display: 'block',
                                        border: '1px solid #000',
                                    }}
                                ></span>
                            </IconButton>
                        </InputAdornment>
                    }
                    label="Select Colour"
                />
                <Popover
                    id={id}
                    open={open}
                    anchorEl={showPopover}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                >
                    <StyledChartContainer
                        onChange={handleColorChange}
                        color={color}
                    ></StyledChartContainer>
                </Popover>
            </div>
        );
    },
);
