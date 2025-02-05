import { useEffect, useMemo, useRef, useState, lazy, MouseEvent } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { getValueByPath } from '@/utility';
import { Block, BlockDef, QueryState } from '@/stores';
import { DefaultBlocks } from '@/components/block-defaults';
import { Box, Button, Popover, Stack, styled } from '@semoss/ui';
import { SketchPicker } from 'react-color';
import './ColorPalette.css';

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
        function handleClick(event: MouseEvent<HTMLButtonElement>) {
            setShowPopover(event.currentTarget);
        }
        function handleClose() {
            setShowPopover(null);
        }
        function handleColorChange(e) {
            console.log(e.rgb);
            setColor(e.rgb);
        }
        const open = Boolean(showPopover);
        return (
            <div>
                <Button
                    aria-describedby={id}
                    variant="outlined"
                    onClick={handleClick}
                >
                    Click Me
                </Button>
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
